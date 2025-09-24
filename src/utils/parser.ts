interface Entity {
  id: string;
  name: string;
}

export type Shortcut = Entity;

export interface Folder extends Entity {
  shortcuts: Shortcut[];
}

const LINE_REGEX =
  /^(.+?) \(([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})\)$/;

/**
 * Parse a line from shortcuts CLI output and extract shortcut information
 * @param line Line from shortcuts command output
 * @returns Shortcut object or null if line doesn't match expected format
 */
export function parseOutputLine(line: string): Entity | null {
  const match = line.match(LINE_REGEX);
  if (match) {
    return {
      name: match[1],
      id: match[2],
    };
  }
  return null;
}
