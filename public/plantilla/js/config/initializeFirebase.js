import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  collectionGroup, 
  orderBy, 
  onSnapshot, 
  limit, 
  startAt, 
  endAt, 
  startAfter,
  deleteDoc,
  updateDoc,
  addDoc,
  writeBatch, 
  arrayUnion 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { getStorage, ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-analytics.js";  // Importar Analytics
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

  // Configuración de Firebase
  const firebaseConfig = {
    apiKey: 'AIzaSyCtzXKSoweSMLPej5-MbkTfQzFH719y-MM',
    authDomain: 'hekaapp-23c89.firebaseapp.com',
    databaseURL: 'https://hekaapp-23c89.firebaseio.com',
    projectId: 'hekaapp-23c89',
    storageBucket: 'hekaapp-23c89.appspot.com',
    messagingSenderId: '539740310887',
    appId: '1:539740310887:web:66f9ab535d18addeb173c2',
    measurementId: 'G-47CYMPHNRM'
  };

  // Inicialización de Firebase
  const app = initializeApp(firebaseConfig);

  // Clase de conexión con Firebase
  class FirebaseServiceConection {
    constructor() {
      // Inicialización de la aplicación Firebase
      this.app = app;
    }

    // Método para obtener Firestore
    dbFirebase() {
      return getFirestore(this.app, window.ENV.FIREBASE_DATABASE);
    }

    // Método para obtener el almacenamiento de Firebase
    storageFirebase() {
      return getStorage(this.app);
    }

    getAnalytics() {
      return getAnalytics(this.app);
    }

    getAuth() {
      return getAuth(this.app);
    }

  }

  // Ejemplo de uso de la clase
  const firebaseService = new FirebaseServiceConection();
  const db = firebaseService.dbFirebase();
  const storage = firebaseService.storageFirebase();
  const analytics = firebaseService.getAnalytics();
  const auth = firebaseService.getAuth(app);


 export { 
  db, 
  storage, 
  analytics, 
  auth, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  collectionGroup, 
  ref, 
  listAll, 
  getDownloadURL, 
  orderBy, 
  onSnapshot, 
  limit, 
  startAt, 
  endAt, 
  startAfter,
  deleteDoc,
  updateDoc,
  addDoc,
  writeBatch,
  arrayUnion
};