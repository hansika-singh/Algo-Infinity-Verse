import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";

let configPromise = null;
let app = null;
let auth = null;
let stateListeners = [];

function fetchConfig() {
  if (!configPromise) {
    configPromise = fetch("/api/firebase-config")
      .then(r => r.json())
      .then(data => {
        if (!data.configured) throw new Error("Firebase not configured");
        return data;
      })
      .catch(() => {
        configPromise = null;
        throw new Error("Firebase not configured");
      });
  }
  return configPromise;
}

async function ensureAuth() {
  if (auth) return auth;
  const config = await fetchConfig();
  if (!app) {
    app = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    });
  }
  if (!auth) {
    auth = getAuth(app);
    auth.onAuthStateChanged((user) => {
      stateListeners.forEach(cb => { try { cb(user); } catch (e) { void 0; } });
    });
  }
  return auth;
}

export async function getRedirectUser() {
  const authInstance = await ensureAuth();

  try {
    const result = await getRedirectResult(authInstance);
    if (result?.user) {
      const idToken = await result.user.getIdToken(true);
      return { idToken, user: result.user };
    }
  } catch (error) {
    void 0;
  }

  if (authInstance.currentUser) {
    try {
      const idToken = await authInstance.currentUser.getIdToken(true);
      return { idToken, user: authInstance.currentUser };
    } catch (tokenError) {
      void 0;
    }
    return null;
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      unsubscribe();
      if (user) {
        user.getIdToken(true).then((idToken) => {
          resolve({ idToken, user });
        }).catch(() => {
          resolve(null);
        });
      } else {
        resolve(null);
      }
    });
  });
}

export async function signInWithGoogle() {
  const authInstance = await ensureAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const result = await signInWithPopup(authInstance, provider);
    return result;
  } catch (error) {
    if (error.code === "auth/popup-blocked") {
      await signInWithRedirect(authInstance, provider);
      return null;
    }
    throw error;
  }
}

export async function signOutUser() {
  if (!auth) return;
  await signOut(auth);
}

export function getCurrentUser() {
  return auth ? auth.currentUser : null;
}

export function onAuthChange(callback) {
  stateListeners.push(callback);
  if (auth && auth.currentUser !== undefined) {
    try { callback(auth.currentUser); } catch (e) { void 0; }
  }
  return () => {
    stateListeners = stateListeners.filter(cb => cb !== callback);
  };
}

export async function getIdToken() {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;
  return currentUser.getIdToken();
}

export async function sendPasswordReset(email) {
  const authInstance = await ensureAuth();
  await sendPasswordResetEmail(authInstance, email);
}

export function isConfigured() {
  return auth !== null;
}

window.__firebaseClient = {
  signInWithGoogle,
  getRedirectUser,
  signOutUser,
  getCurrentUser,
  onAuthChange,
  getIdToken,
  sendPasswordReset,
  isConfigured
};

// Legacy global exports
window.getRedirectUser = getRedirectUser;
window.signInWithGoogle = signInWithGoogle;
window.signOutUser = signOutUser;
window.getCurrentUser = getCurrentUser;
window.onAuthChange = onAuthChange;
window.getIdToken = getIdToken;
window.sendPasswordReset = sendPasswordReset;
window.isConfigured = isConfigured;
