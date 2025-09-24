import streamDeck, {
  action,
  JsonValue,
  KeyDownEvent,
  SendToPluginEvent,
  SingletonAction,
  WillAppearEvent,
} from "@elgato/streamdeck";
import { DataSourcePayload, Item, DataSourceResultItem } from "../sdpi";
import {
  runShortcut,
  fetchAllShortcuts,
  fetchAllShortcutsByFolder,
} from "../shortcuts";

import { FETCH_SHORTCUTS_EVENT } from "./constants";
import { LauncherSettings } from "./types";

@action({ UUID: "com.gilles-de-mey.better-shortcuts.launch-shortcut" })
export class Launcher extends SingletonAction<LauncherSettings> {
  /**
   * activates when the action appears on the stream deck
   */
  override async onWillAppear(
    ev: WillAppearEvent<LauncherSettings>,
  ): Promise<void> {
    const { shortcutID } = ev.payload.settings;

    const exists = await this.validateShortcut(shortcutID);
    if (!exists) {
      ev.action.showAlert();
    }
  }

  /**
   * check if shortcut still exists – if it doesn't we should show this to the user
   */
  private async validateShortcut(shortcutID: string) {
    streamDeck.logger.trace("checking if shortcut exists", { shortcutID });
    try {
      const shortcuts = await fetchAllShortcuts();
      const exists = shortcuts.has(shortcutID);

      if (exists) {
        streamDeck.logger.trace("shortcut OK", { shortcutID });
      } else {
        streamDeck.logger.trace("shortcut MISSING", { shortcutID });
      }

      return exists;
    } catch (error) {
      streamDeck.logger.error("failed to check for existence", { shortcutID });
    }
  }

  override async onKeyDown(ev: KeyDownEvent<LauncherSettings>): Promise<void> {
    const { shortcutID } = ev.payload.settings;

    const exists = await this.validateShortcut(shortcutID);
    if (!exists) {
      ev.action.showAlert();
    }

    try {
      runShortcut(shortcutID);

      streamDeck.logger.trace("success");
      ev.action.showOk();
    } catch (error) {
      ev.action.showAlert();
      streamDeck.logger.error("shortcut failed", { error });
    }
  }

  /**
   * Listen for messages from the property inspector.
   */
  override async onSendToPlugin(
    ev: SendToPluginEvent<JsonValue, LauncherSettings>,
  ): Promise<void> {
    streamDeck.logger.trace("ev", ev);
    const isFetchShortcutsRequest =
      ev.payload instanceof Object &&
      "event" in ev.payload &&
      ev.payload.event === FETCH_SHORTCUTS_EVENT;

    if (isFetchShortcutsRequest) {
      const shortcutsByFolder = await fetchAllShortcutsByFolder();
      const folderArray = Array.from(shortcutsByFolder.values());

      // Map folders to ItemGroups and shortcuts to Items
      const items = folderArray.map<DataSourceResultItem>((folder) => ({
        label: folder.name,
        children: folder.shortcuts.map<Item>((shortcut) => ({
          label: shortcut.name,
          value: shortcut.id,
        })),
      }));

      const payload: DataSourcePayload = {
        event: FETCH_SHORTCUTS_EVENT,
        items,
      };

      // Send the mapped data to the property inspector
      streamDeck.ui.current?.sendToPropertyInspector(payload);
    }
  }
}
