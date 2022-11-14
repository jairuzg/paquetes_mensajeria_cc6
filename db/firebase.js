// admin configuration snippet Firebase
const admin = require("firebase-admin");
const serviceAccount = require("./../serviceAccountKey.json");


const firebase = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
}, "Firebase");


const dbf = firebase.firestore();

module.exports = {
    dbfirestore: dbf
}
