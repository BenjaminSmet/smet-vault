import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCbFiU93MOxuRlPvN0xZvEEVR7Gksp-Gac",
  authDomain: "smet-vault.firebaseapp.com",
  projectId: "smet-vault",
  storageBucket: "smet-vault.firebasestorage.app",
  messagingSenderId: "345961052512",
  appId: "1:345961052512:web:99a432cad23545a77a8605",
  measurementId: "G-GL9BDJGL5V"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

export default app
