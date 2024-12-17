var firebaseConfig = JSON.parse(atob(window.ENV.FIREBASE_CONFIG));

// Initialize Firebase
firebase.initializeApp(firebaseConfig);