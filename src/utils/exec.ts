import { execa, execaSync } from "execa";
import streamDeck from "@elgato/streamdeck";

/**
 * custom exaca(s) so we can hook into the streamDeck logger
 */
export const runCommand = execa({
  // @ts-expect-error
  verbose(verboseLine: string) {
    return streamDeck.logger.trace(verboseLine);
  },
});

export const runCommandSync = execaSync({
  // @ts-expect-error
  verbose(verboseLine: string) {
    return streamDeck.logger.trace(verboseLine);
  },
});
