
export function getErrorMessage(err, statusMessages = {}) {
  // No response at all — request never reached the server (offline, CORS,
  // server down, timeout, DNS failure, etc.)
  if (!err.response) {
    if (err.code === "ECONNABORTED") {
      return "The request took too long. Please try again.";
    }
    return "Can't reach the server. Please check your internet connection and try again.";
  }

  const status = err.response.status;

  // Caller-specific override takes priority — e.g. 401 on login should say
  // "Invalid email or password", not a generic auth message.
  if (statusMessages[status]) return statusMessages[status];

  const backendMessage = err.response.data?.message;

  // Only trust short, plain-text backend messages — never render raw stack
  // traces or long server errors directly to the user.
  if (
    backendMessage &&
    typeof backendMessage === "string" &&
    backendMessage.length < 200
  ) {
    return backendMessage;
  }

  // Generic fallbacks by status range
  if (status === 401) return "You need to sign in to continue.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "We couldn't find what you're looking for.";
  if (status === 429) return "Too many attempts. Please wait a moment and try again.";
  if (status >= 500) return "Something went wrong on our end. Please try again shortly.";

  return "Something went wrong. Please try again.";
}