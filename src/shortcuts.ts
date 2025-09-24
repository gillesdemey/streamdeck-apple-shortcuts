import { execa } from "execa";
import { parseOutputLine, type Shortcut, type Folder } from "./utils/parser";

/**
 * Run a shortcut by its ID
 * @param shortcutID The ID of the shortcut to run
 * @throws Error if the command fails
 */
export async function runShortcut(shortcutID: string): Promise<void> {
  await execa({ shell: true })`shortcuts run ${shortcutID}`;
}

/**
 * Fetch all shortcuts with their IDs
 * @returns Map of shortcut ID to Shortcut object
 */
export async function fetchAllShortcuts(): Promise<Map<string, Shortcut>> {
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

  return shortcuts;
}

/**
 * Fetch all folders with their shortcuts
 * @returns Map of folder ID to Folder object (includes "none" folder for ungrouped shortcuts)
 */
export async function fetchAllShortcutsByFolder(): Promise<
  Map<string, Folder>
> {
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
  }

  return folders;
}
