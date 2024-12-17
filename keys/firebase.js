const dotenv = require('dotenv');
dotenv.config();

var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/database");
require("firebase/firestore");
require("firebase/storage");

var firebaseConfig = {
    apiKey: process.env.FIRE_APIKEY,
    authDomain: process.env.FIRE_AUTHDOMAIN,
    databaseURL: process.env.FIRE_DB_URL,
    projectId: process.env.FIRE_PROJECT_ID,
    storageBucket: process.env.FIRE_STORAGE,
    messagingSenderId: process.env.FIRE_MESSAGESENDER_ID,
    appId: process.env.FIRE_APP_ID
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

module.exports = firebase;