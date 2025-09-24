export type LauncherSettings = {
  shortcutID?: string; // optional, only happens if the shortcut wasn't configured properly (or yet)
};

export interface Shortcut {
  id: string;
  name: string;
}

export interface Folder {
  id: string;
  name: string;
  shortcuts: Shortcut[];
}
