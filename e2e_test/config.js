const firebaseConfig = {
    apiKey: "AIzaSyBUEPy3uHTpFcdNLUI7ii_iZSvkMgGIyEU",
    authDomain: "loyalty-first.firebaseapp.com",
    projectId: "loyalty-first",
    storageBucket: "loyalty-first.firebasestorage.app",
    messagingSenderId: "141137172814",
    appId: "1:141137172814:web:dcb321bffee257f590a61f"
};

const functionUrls = {
    registerCustomer: "https://us-central1-loyalty-first.cloudfunctions.net/registerCustomer",
    setUserRole: "https://us-central1-loyalty-first.cloudfunctions.net/setUserRole",
    createBunk: "https://us-central1-loyalty-first.cloudfunctions.net/createBunk",
    assignManagerToBunk: "https://us-central1-loyalty-first.cloudfunctions.net/assignManagerToBunk",
    updateGlobalConfig: "https://us-central1-loyalty-first.cloudfunctions.net/updateGlobalConfig",
    creditPoints: "https://us-central1-loyalty-first.cloudfunctions.net/creditPoints",
    redeemPoints: "https://us-central1-loyalty-first.cloudfunctions.net/redeemPoints",
    deleteUser: "https://us-central1-loyalty-first.cloudfunctions.net/deleteUser"
};

module.exports = { firebaseConfig, functionUrls };
