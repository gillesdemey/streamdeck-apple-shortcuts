export type LauncherSettings = {
  shortcutID?: string; // optional, only happens if the shortcut wasn't configured properly (or yet)
};

export interface Entity {
  id: string;
  name: string;
}

// for now a Shortcut is just an entity with a name and an identifier
export type Shortcut = Entity;

export interface Folder {
  id: string;
  name: string;
  shortcuts: Shortcut[];
}
