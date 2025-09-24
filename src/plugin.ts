import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { Launcher } from "./actions/shortcuts";
import spawn from "nano-spawn";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel(LogLevel.DEBUG);

// Register the increment action.
streamDeck.actions.registerAction(new Launcher());

streamDeck.logger.debug("⌛ Starting...");

try {
  await spawn("shortcuts", ["--help"]);
  streamDeck.logger.debug("✅ shortcuts binary installed");
} catch (error) {
  streamDeck.logger.error("❌ shortcuts binary not installed");
}

// Finally, connect to the Stream Deck.
await streamDeck.connect();
