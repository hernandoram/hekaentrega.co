const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { getStorage } = require('firebase/storage');

class FirebaseServiceConection {
  constructor() {
    this.app = initializeApp({
      apiKey: 'AIzaSyCtzXKSoweSMLPej5-MbkTfQzFH719y-MM',
      authDomain: 'hekaapp-23c89.firebaseapp.com',
      databaseURL: 'https://hekaapp-23c89.firebaseio.com',
      projectId: 'hekaapp-23c89',
      storageBucket: 'hekaapp-23c89.appspot.com',
      messagingSenderId: '539740310887',
      appId: '1:539740310887:web:66f9ab535d18addeb173c2',
      measurementId: 'G-47CYMPHNRM',
    });
  }

  dbFirebase() {
    return getFirestore(this.app, process.env.FIREBASE_DATABASE);
  }

  storageFirebase() {
    return getStorage(this.app);
  }
}

module.exports = FirebaseServiceConection;