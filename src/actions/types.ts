type LauncherSettings = {
  shortcutID: string;
};

interface Shortcut {
  id: string;
  name: string;
}

interface Folder {
  id: string;
  name: string;
  shortcuts: Shortcut[];
}
