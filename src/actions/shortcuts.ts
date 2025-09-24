import streamDeck, {
  action,
  JsonValue,
  KeyDownEvent,
  SendToPluginEvent,
  SingletonAction,
  WillAppearEvent,
} from "@elgato/streamdeck";
import { execa } from "execa";
import {
  DataSourcePayload,
  ItemGroup,
  Item,
  DataSourceResultItem,
} from "../sdpi";
import { parseOutputLine, type Shortcut, type Folder } from "../utils/parser";

@action({ UUID: "com.gilles-de-mey.better-shortcuts.launch-shortcut" })
export class Launcher extends SingletonAction<LauncherSettings> {
  override async onWillAppear(
    ev: WillAppearEvent<LauncherSettings>,
  ): Promise<void> {
    const { shortcutID } = ev.payload.settings;

    const exists = await this.validateShortcut(shortcutID);
    if (!exists) {
      streamDeck.logger.trace("Shortcut MISSING", { shortcutID });
      ev.action.showAlert();
    }
  }

  async validateShortcut(shortcutID: string) {
    // check if shortcut still exists – if it doesn't we should show this to the user
    streamDeck.logger.trace("Checking if shortcut exists...", { shortcutID });
    try {
      const shortcuts = await this.fetchAllShortcuts();
      const exists = shortcuts.has(shortcutID);
      streamDeck.logger.trace("Shortcut OK", { shortcutID });

      return exists;
    } catch (error) {
      streamDeck.logger.error("Failed to check for existence", { shortcutID });
    }
  }

  override async onKeyDown(ev: KeyDownEvent<LauncherSettings>): Promise<void> {
    const { settings } = ev.payload;
    const { shortcutID } = settings;

    const exists = await this.validateShortcut(shortcutID);
    if (!exists) {
      streamDeck.logger.trace("Shortcut MISSING", { shortcutID });
      ev.action.showAlert();
    }

    try {
      await execa({ shell: true })`shortcuts run ${shortcutID}`;
      streamDeck.logger.trace("success");
      ev.action.showOk();
    } catch (error) {
      ev.action.showAlert();
      streamDeck.logger.error("Shortcut failed", { error });
    }
  }

  private async fetchAllShortcuts() {
    const shortcuts = new Map<string, Shortcut>();

    // fetch all shortcuts, with IDs
    const listShortcuts = execa({
      shell: true,
      lines: true,
    })`shortcuts list --show-identifiers`;

    for await (const line of listShortcuts) {
      const shortcut = parseOutputLine(line);
      if (shortcut) {
        shortcuts.set(shortcut.id, shortcut);
      }
    }

    streamDeck.logger.trace(`found ${shortcuts.size} shortcuts`, {
      list: Array.from(shortcuts),
    });

    return shortcuts;
  }

  private async fetchAllShortcutsByFolder() {
    // include the "none" folder
    const folders = new Map<string, Folder>([
      [
        "none",
        {
          id: "none",
          name: "All shortcuts",
          shortcuts: [],
        },
      ],
    ]);

    // fetch all folders with ID
    const listFolders = execa({
      shell: true,
      lines: true,
    })`shortcuts list --folders --show-identifiers`;

    for await (const line of listFolders) {
      const folderInfo = parseOutputLine(line);
      if (folderInfo) {
        const folder: Folder = {
          ...folderInfo,
          shortcuts: [],
        };

        folders.set(folder.id, folder);
      }
    }

    streamDeck.logger.trace(`found ${folders.size} folders`, {
      list: Array.from(folders),
    });

    // now fill shortcuts for each folder
    // first, fill shortcuts for regular folders (not "none")
    for (const [folderId, folder] of folders) {
      if (folderId !== "none") {
        // for regular folders, use folder-name filter
        const listShortcuts = execa({
          shell: true,
          lines: true,
        })`shortcuts list --folder-name ${folderId} --show-identifiers`;

        for await (const line of listShortcuts) {
          const shortcut = parseOutputLine(line);
          if (shortcut) {
            folder.shortcuts.push(shortcut);
          }
        }

        streamDeck.logger.trace(
          `found ${folder.shortcuts.length} shortcuts in folder "${folder.name}"`,
          {
            folderId,
            shortcuts: folder.shortcuts,
          },
        );
      }
    }

    // collect all shortcut IDs that are in folders
    const shortcutsInFolders = new Set<string>();
    for (const [folderId, folder] of folders) {
      if (folderId !== "none") {
        for (const shortcut of folder.shortcuts) {
          shortcutsInFolders.add(shortcut.id);
        }
      }
    }

    // now fill the "none" folder with shortcuts not in any folder
    const noneFolder = folders.get("none");
    if (noneFolder) {
      const listShortcuts = execa({
        shell: true,
        lines: true,
      })`shortcuts list --show-identifiers`;

      for await (const line of listShortcuts) {
        const shortcut = parseOutputLine(line);
        if (shortcut) {
          // only add shortcuts that are not already in other folders
          if (!shortcutsInFolders.has(shortcut.id)) {
            noneFolder.shortcuts.push(shortcut);
          }
        }
      }

      streamDeck.logger.trace(
        `found ${noneFolder.shortcuts.length} shortcuts in folder "${noneFolder.name}"`,
        {
          folderId: "none",
          shortcuts: noneFolder.shortcuts,
        },
      );
    }

    return folders;
  }

  /**
   * Listen for messages from the property inspector.
   * @param ev Event information.
   */
  override async onSendToPlugin(
    ev: SendToPluginEvent<JsonValue, LauncherSettings>,
  ): Promise<void> {
    // Check if the payload is requesting a data source, i.e. the structure is { event: string }
    if (
      ev.payload instanceof Object &&
      "event" in ev.payload &&
      ev.payload.event === "fetchAllShortcutsByFolder"
    ) {
      const shortcutsByFolder = await this.fetchAllShortcutsByFolder();

      // Map folders to ItemGroups and shortcuts to Items
      const items = Array.from(
        shortcutsByFolder.values(),
      ).map<DataSourceResultItem>((folder) => {
        const itemGroup: ItemGroup = {
          label: folder.name,
          children: folder.shortcuts.map(
            (shortcut) =>
              ({
                label: shortcut.name,
                value: shortcut.id,
              }) satisfies Item,
          ),
        };
        return itemGroup;
      });

      // Send the mapped data to the property inspector
      streamDeck.ui.current?.sendToPropertyInspector({
        event: "fetchAllShortcutsByFolder",
        items,
      } satisfies DataSourcePayload);
    }
  }
}
