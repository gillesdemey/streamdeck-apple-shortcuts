import streamDeck, {
  action,
  JsonValue,
  KeyDownEvent,
  SendToPluginEvent,
  SingletonAction,
  WillAppearEvent,
} from "@elgato/streamdeck";
import { DataSourcePayload, Item, DataSourceResultItem } from "../types/sdpi";
import {
  runShortcut,
  fetchAllShortcutsByFolder,
  hasShortcut,
} from "../shortcuts";

import { FETCH_SHORTCUTS_EVENT } from "../constants";
import { LauncherSettings } from "../types/types";

@action({ UUID: "com.gilles-de-mey.simple-shortcuts.launch-shortcut" })
export class Launcher extends SingletonAction<LauncherSettings> {
  /**
   * activates when the action appears on the stream deck
   */
  override async onWillAppear(
    ev: WillAppearEvent<LauncherSettings>,
  ): Promise<void> {
    return;
  }

  /**
   * check if shortcut still exists – if it doesn't we should show this to the user
   */
  private async validateShortcut(shortcutID: string) {
    streamDeck.logger.debug("⌛ checking if shortcut exists", { shortcutID });

    try {
      const exists = await hasShortcut(shortcutID);

      if (exists) {
        streamDeck.logger.debug("✅ shortcut OK", { shortcutID });
      } else {
        streamDeck.logger.debug("❌ shortcut MISSING", { shortcutID });
      }

      return exists;
    } catch (error) {
      streamDeck.logger.error("⚠️ failed to check for existence", {
        error,
        shortcutID,
      });
    }
  }

  override async onKeyDown(ev: KeyDownEvent<LauncherSettings>): Promise<void> {
    const { shortcutID } = ev.payload.settings;
    if (!shortcutID) {
      ev.action.showAlert();
      return;
    }

    const exists = await this.validateShortcut(shortcutID);
    if (!exists) {
      ev.action.showAlert();
    }

    try {
      streamDeck.logger.debug("⌛ running shortcut", { shortcutID });
      const result = await runShortcut(shortcutID);

      streamDeck.logger.debug("✅ success", { shortcutID, ...result });
      ev.action.showOk();
    } catch (error) {
      ev.action.showAlert();
      streamDeck.logger.error("❌ shortcut failed", { error, shortcutID });
    }
  }

  /**
   * Listen for messages from the property inspector.
   */
  override async onSendToPlugin(
    ev: SendToPluginEvent<JsonValue, LauncherSettings>,
  ): Promise<void> {
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
