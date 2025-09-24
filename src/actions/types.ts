export type LauncherSettings = {
  shortcutID: string;
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
