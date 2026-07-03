export function getFirebaseErrorMessage(error) {
  if (!error || !error.code) return "Sign-in failed. Please try again.";
  const messages = {
    "auth/popup-closed-by-user": "",
    "auth/popup-blocked": "Please allow pop-ups for this site to sign in with Google.",
    "auth/cancelled-popup-request": "",
    "auth/account-exists-with-different-credential": "An account already exists with this email. Please sign in with your password instead.",
    "auth/credential-already-in-use": "This Google account is already linked to another account.",
    "auth/network-request-failed": "Network error. Please check your connection and try again.",
    "auth/invalid-credential": "Sign-in failed. Please try again.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/unauthorized-domain": "This domain is not authorized for Google sign-in.",
  };
  return messages[error.code] || "Sign-in failed. Please try again.";
}
