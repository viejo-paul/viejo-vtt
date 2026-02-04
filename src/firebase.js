// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// SUSTITUYE ESTO CON TUS DATOS DE LA CONSOLA DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCKAFGFaNA3oeu2mDtgEwsp8o6qIAwXZ2Q",
  authDomain: "viejo-vtt.firebaseapp.com",
  databaseURL: "https://viejo-vtt-default-rtdb.europe-west1.firebasedatabase.app/", 
  projectId: "viejo-vtt",
  storageBucket: "viejo-vtt.firebasestorage.app",
  messagingSenderId: "941846238067",
  appId: "1:941846238067:web:6a6dbfd9c46711edbc6b06"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);