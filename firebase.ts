import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAHhhQLMkSgWzIHmD9snErp-jlC2HOHsf4",
  authDomain: "hessekhub-finance.firebaseapp.com",
  projectId: "hessekhub-finance",
  storageBucket: "hessekhub-finance.firebasestorage.app",
  messagingSenderId: "531920483052",
  appId: "1:531920483052:web:c368651f2d644de4116bc9",
  measurementId: "G-WPNE0BSHTL"
};

const app = initializeApp(firebaseConfig);

// Enable offline persistence for iOS compatibility
// This ensures data is cached persistently and survives app reloads
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const analytics = getAnalytics(app);
