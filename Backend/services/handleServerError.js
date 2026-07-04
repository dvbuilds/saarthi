
export const handleServerError = (res, error, fallbackMessage = "Something went wrong. Please try again.") => {
  // Full detail stays server-side only — check your Render logs, never the client response.
  console.error(error);
  return res.status(500).json({ message: fallbackMessage });
};