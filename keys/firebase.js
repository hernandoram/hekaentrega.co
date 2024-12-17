const dotenv = require('dotenv');
dotenv.config();

var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/database");
require("firebase/firestore");
require("firebase/storage");

var firebaseConfig = JSON.parse(atob(process.env.FIREBASE_CONFIG));
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

module.exports = firebase;