
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('./serviceAccountKey.json');

const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const userData = {};

async function setClaim(email, claims) {
    try {
        console.log(`Fetching user: ${email}...`);
        const user = await admin.auth().getUserByEmail(email);
        userData[email] = user.uid;
        if (Object.keys(claims).length > 0) {
            console.log(`Setting claims for ${email} (uid: ${user.uid}):`, claims);
            await admin.auth().setCustomUserClaims(user.uid, claims);
            console.log(`✅ Successfully set claims for ${email}.`);
        }
    } catch (error) {
        console.error(`❌ Error setting claims for ${email}:`, error.message);
    }
}

async function main() {
    // Set claims for admin
    await setClaim(users.admin.email, { admin: true });

    // Set claims for manager
    await setClaim(users.manager.email, { manager: true });

    // No special claims for customer, but we still want their UID
    await setClaim(users.customer.email, {});

    fs.writeFileSync('./user_data.json', JSON.stringify(userData, null, 2));
    console.log('\nUser UIDs saved to user_data.json');

    console.log('\nAll custom claims set successfully.');
}

main().catch(console.error);
