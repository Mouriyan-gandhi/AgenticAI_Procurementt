import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
    apiKey: "AIzaSyDyU2yYlrUqbMTGH9HdIeztFztAeZ92rug",
    authDomain: "rental-app-d2148.firebaseapp.com",
    projectId: "rental-app-d2148",
    storageBucket: "rental-app-d2148.firebasestorage.app",
    messagingSenderId: "968179091401",
    appId: "1:968179091401:web:74c64b90b85fb8c129ca18",
    measurementId: "G-LW2Q45K9LX",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
