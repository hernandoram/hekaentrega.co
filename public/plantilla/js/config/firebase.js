import "https://www.gstatic.com/firebasejs/7.18.0/firebase-app.js";
import "https://www.gstatic.com/firebasejs/7.18.0/firebase-auth.js";
import "https://www.gstatic.com/firebasejs/7.18.0/firebase-analytics.js";
import "https://www.gstatic.com/firebasejs/7.18.0/firebase-database.js";
import "https://www.gstatic.com/firebasejs/8.2.4/firebase-firestore.js";
import "https://www.gstatic.com/firebasejs/8.2.4/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyCtzXKSoweSMLPej5-MbkTfQzFH719y-MM",
    authDomain: "hekaapp-23c89.firebaseapp.com",
    databaseURL: "https://hekaapp-23c89.firebaseio.com",
    projectId: "hekaapp-23c89",
    storageBucket: "hekaapp-23c89.appspot.com",
    messagingSenderId: "539740310887",
    appId: "1:539740310887:web:66f9ab535d18addeb173c2",
    measurementId: "G-47CYMPHNRM"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const firestore = firebase.firestore();
export const storage = firebase.storage();
export const database = firebase.database();
export const analytics = firebase.analytics();

export default firebase;