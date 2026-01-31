import streamDeck from "@elgato/streamdeck";

import { ShowWanIP } from "./actions/show-wan-ip";

// Enable debug logging to help troubleshoot any issues
streamDeck.logger.setLevel("debug");

// Register our WAN IP action with the Stream Deck
streamDeck.actions.registerAction(new ShowWanIP());

// Connect to the Stream Deck application
streamDeck.connect();
