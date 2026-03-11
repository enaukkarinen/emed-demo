import { EventEmitter } from "events";

// Simple event emitter to notify when a lead is saved, so we can update the UI in real time.
// Obviously wouldn't work with multiple server instances — would need Redis pub/sub instead.

// In Next.js dev mode, API routes are bundled in separate module scopes, so a plain module-level
// singleton would result in multiple EventEmitter instances. Attaching to global ensures all
// route handlers share the same instance across hot reloads.
declare global {
  var leadEvents: EventEmitter | undefined;
}

export const leadEvents = global.leadEvents ?? new EventEmitter();
global.leadEvents = leadEvents;

export const LEAD_SAVED_EVENT = "lead:saved";
