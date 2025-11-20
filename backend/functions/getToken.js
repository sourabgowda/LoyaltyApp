
const admin = require('firebase-admin');
const axios = require('axios');
const fs = require('fs');

const WEB_API_KEY = 'AIzaSyBUEPy3uHTpFcdNLUI7ii_iZSvkMgGIyEU';

// --- SCRIPT LOGIC ---
const args = process.argv.slice(2);
const silentMode = args.includes('--silent');
const serviceAccountPath = args[0];
const uid = args[1];

if (args.length < 2) {
    console.error('\nUsage: node getToken.js <path_to_service_account_json> <user_uid> [--silent]\n');
    process.exit(1);
}

if (!fs.existsSync(serviceAccountPath)) {
    console.error(`\nService account file not found at: ${serviceAccountPath}\n`);
    process.exit(1);
}

const serviceAccount = require(require('path').resolve(serviceAccountPath));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function getIDToken(uid) {
    try {
        if (!silentMode) console.log(`Attempting to create a custom token for UID: ${uid}`);
        const customToken = await admin.auth().createCustomToken(uid);
        if (!silentMode) console.log('Successfully created custom token.');

        const exchangeUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${WEB_API_KEY}`;

        const response = await axios.post(exchangeUrl, {
            token: customToken,
            returnSecureToken: true
        });

        if (silentMode) {
            process.stdout.write(response.data.idToken);
        } else {
            console.log('\n------------------------- FIREBASE ID TOKEN -------------------------');
            console.log(response.data.idToken);
            console.log('---------------------------------------------------------------------');
            console.log('\nCopy and paste this token into your curl_test.sh script.\n');
        }

    } catch (error) {
        let errorMessage = error.message;
        if (error.response && error.response.data && error.response.data.error) {
            errorMessage = error.response.data.error.message;
        }
        console.error(`\nError getting ID token: ${errorMessage}\n`);
        if (errorMessage === 'USER_NOT_FOUND') {
            console.error('Please make sure the UID you provided is correct.');
        }
        process.exit(1);
    }
}

getIDToken(uid);
