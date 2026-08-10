import { logger } from "./logger.js";

export const handleServerError = (res, error, fallbackMessage = "Something went wrong. Please try again.") => {
  // Logged via the structured logger (not console.error) so the real
  // error shows up as a proper JSON line in Render's log stream —
  // searchable by "level":50 (pino's numeric code for "error") — instead
  // of a raw, unstyled stack trace dump that renders very differently
  // from everything else in the stream and is easy to miss or lose when
  // copying from a live log view.
  logger.error({ err: error }, fallbackMessage);
  return res.status(500).json({ message: fallbackMessage });
};