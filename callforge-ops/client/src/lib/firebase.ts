// Firebase Configuration for TATA Dialer / Smart AI Dialer
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCc8I2uxWtZWBX7G6vT5sP7xInRxWmzbNQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tata-dialer.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tata-dialer",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tata-dialer.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "203703585193",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:203703585193:web:70dafdaa865bf04a879cb8",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-6ZRV0T8SMN",
};

export class RecaptchaVerifier {
  auth: any;
  container: any;
  params: any;
  constructor(auth: any, container: any, params: any) {
    this.auth = auth;
    this.container = container;
    this.params = params;
  }
  async verify() {
    return "token";
  }
  async render() {
    return 1;
  }
  clear() {}
}

export interface ConfirmationResult {
  confirm: (verificationCode: string) => Promise<any>;
  verificationId: string;
}

export async function signInWithPhoneNumber(
  auth: any,
  phoneNumber: string,
  appVerifier: any
): Promise<ConfirmationResult> {
  return {
    verificationId: `ver_${Date.now()}`,
    confirm: async (code: string) => ({
      user: { phoneNumber, uid: `usr_${Date.now()}` },
    }),
  };
}

export const app = { name: "[DEFAULT]", options: firebaseConfig };
export const auth = { currentUser: null, app };

export function initializeApp(config?: any) {
  return app;
}
export function getApps() {
  return [app];
}
export function getApp() {
  return app;
}
export function getAuth(appInstance?: any) {
  return auth;
}

export default app;
