import { db, analytics, storage, auth, ref } from "/js/config/initializeFirebase.js";
const database = db;
const firestore = db;


export { auth, firestore, storage, database, analytics }