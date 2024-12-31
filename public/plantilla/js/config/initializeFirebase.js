import { initializeApp } from "https://www.gstatic.com/firebasejs/9.11.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.11.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.11.0/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.11.0/firebase-analytics.js";  // Importar Analytics

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
  }

  // Ejemplo de uso de la clase
  const firebaseService = new FirebaseServiceConection();
  const db = firebaseService.dbFirebase();

 export { db, collection, query, where, getDocs };