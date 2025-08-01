// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAva6hRFSNqNSS1GQRy1QNdaFQGTPu1iDI",
  authDomain: "deal-me-up.firebaseapp.com",
  projectId: "deal-me-up",
  storageBucket: "deal-me-up.firebasestorage.app",
  messagingSenderId: "879690137107",
  appId: "1:879690137107:web:48acdc63830ac8a52649e6",
  measurementId: "G-NGY31TKNX7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

const db = getFirestore(app);
const auth = getAuth(app);

export { db, app, auth };