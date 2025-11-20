const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const fs = require('fs');
const { firebaseConfig } = require('./config');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const users = {
    admin: { email: 'admin@test.com', password: 'password123' },
    manager: { email: 'manager@test.com', password: 'password123' },
    customer: { email: 'customer@test.com', password: 'password123' }
};

async function getTokens() {
    const tokens = {};
    for (const role in users) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, users[role].email, users[role].password);
            tokens[role] = await userCredential.user.getIdToken();
            console.log(`Successfully got token for ${role}`);
        } catch (error) {
            console.error(`Error getting token for ${role}:`, error.message);
        }
    }

    fs.writeFileSync('./tokens.json', JSON.stringify(tokens, null, 2));
    console.log('Tokens saved to tokens.json');
}

getTokens();
