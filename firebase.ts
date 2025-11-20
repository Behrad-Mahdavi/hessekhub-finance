import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
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
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
