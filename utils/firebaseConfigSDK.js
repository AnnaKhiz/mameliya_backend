const admin = require('firebase-admin');
const { firebaseServiceAccount, firebaseStorageBucket} = require('../config/default');

const serviceAccount = JSON.parse(firebaseServiceAccount);
if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		storageBucket: firebaseStorageBucket,
	})
}

const bucket = admin.storage().bucket();

module.exports = { admin, bucket }
