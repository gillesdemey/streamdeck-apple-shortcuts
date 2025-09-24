import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { Launcher } from "./actions/shortcuts";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel(LogLevel.TRACE);

// Register the increment action.
streamDeck.actions.registerAction(new Launcher());

streamDeck.logger.trace("Booting...");

// Finally, connect to the Stream Deck.
await streamDeck.connect();
