const test = require('firebase-functions-test')();
const assert = require('assert');
const admin = require('firebase-admin');
const sinon = require('sinon');

// 1. STUB INITIALIZATION
sinon.stub(admin, 'initializeApp');

// 2. FIRESTORE & AUTH STUBS

// Stubs for document methods
const userSetStub = sinon.stub().resolves();
const userUpdateStub = sinon.stub().resolves();
const bunkAddStub = sinon.stub().resolves({ id: 'new-bunk-123' });
const configSetStub = sinon.stub().resolves();
const transactionSetStub = sinon.stub().resolves();

// Stubs for get calls
const txGetStub = sinon.stub(); // For `get` calls inside a transaction
const userGetStub = sinon.stub(); // For non-transaction `get` calls

// Stubs for document references
// These now return objects with all the methods our functions use.
const userDocRef = { set: userSetStub, update: userUpdateStub, get: userGetStub, path: 'users/test-user' };
const bunkDocRef = { get: txGetStub }; 
const configDocRef = { set: configSetStub, get: txGetStub };
const transactionDocRef = { set: transactionSetStub };

const userDocStub = sinon.stub().returns(userDocRef);
const bunkDocStub = sinon.stub().returns(bunkDocRef);
const configDocStub = sinon.stub().returns(configDocRef);
const transactionDocStub = sinon.stub().returns(transactionDocRef);

// Stub for collection references
const collectionStub = sinon.stub();
collectionStub.withArgs('users').returns({ doc: userDocStub });
collectionStub.withArgs('bunks').returns({ add: bunkAddStub, doc: bunkDocStub });
collectionStub.withArgs('configs').returns({ doc: configDocStub });
collectionStub.withArgs('transactions').returns({ doc: transactionDocStub });

// The master Firestore stub
sinon.stub(admin, 'firestore').get(() => {
    const firestore = () => ({
        collection: collectionStub,
        runTransaction: async (updateFunction) => {
            const tx = { 
                get: txGetStub,
                // Pass the update/set calls through to the doc reference stubs
                update: (docRef, data) => docRef.update(data), 
                set: (docRef, data) => docRef.set(data)
            };
            return await updateFunction(tx);
        }
    });
    firestore.FieldValue = { serverTimestamp: () => 'SERVER_TIMESTAMP' };
    return firestore;
});

// Auth stubs
const createUserStub = sinon.stub().resolves({ uid: '123456' });
const setCustomUserClaimsStub = sinon.stub().resolves();
sinon.stub(admin, 'auth').get(() => () => ({
  createUser: createUserStub,
  setCustomUserClaims: setCustomUserClaimsStub,
}));

// 3. REQUIRE & STUB HELPER FUNCTIONS
const myFunctions = require('../index.js');
const isAdminStub = sinon.stub(myFunctions, 'isAdmin');
const isManagerStub = sinon.stub(myFunctions, 'isManager');

// 4. TESTS
describe('Cloud Functions', () => {

  after(() => { sinon.restore(); test.cleanup(); });

  beforeEach(() => {
      const stubs = [userSetStub, userUpdateStub, bunkAddStub, configSetStub, 
                     transactionSetStub, userDocStub, bunkDocStub, configDocStub, 
                     transactionDocStub, collectionStub, createUserStub, 
                     setCustomUserClaimsStub, isAdminStub, isManagerStub, 
                     txGetStub, userGetStub];
      stubs.forEach(s => s.resetHistory());
  });

  describe('registerCustomer', () => {
    it('should create a new customer', async () => {
      const wrapped = test.wrap(myFunctions.registerCustomer);
      await wrapped({ firstName: 'Test', lastName: 'User', email: 'test@example.com', password: 'password' });
      assert(userSetStub.calledOnce);
    });
  });

  describe('createBunk', () => {
    it('should create a bunk if admin', async () => {
      isAdminStub.resolves(true);
      const wrapped = test.wrap(myFunctions.createBunk);
      const bunkData = { name: 'B', location: 'L', district: 'D', state: 'S', pincode: 'P' };
      await wrapped(bunkData, { auth: { uid: 'admin-uid' } });
      assert(bunkAddStub.calledOnceWith(bunkData));
    });

    it('should deny if not admin', async () => {
      isAdminStub.resolves(false);
      const wrapped = test.wrap(myFunctions.createBunk);
      await assert.rejects(wrapped({}, { auth: { uid: 'user-uid' } }), { code: 'permission-denied' });
    });
  });

  describe('creditPoints', () => {
    it('should credit points if manager', async () => {
      isManagerStub.resolves(true);

      // Correctly add the `.ref` property to the snapshot mock
      txGetStub.onCall(0).resolves({ exists: true, data: () => ({ assignedBunkId: 'bunk-123' }), ref: userDocRef });
      txGetStub.onCall(1).resolves({ exists: true, data: () => ({ isVerified: true, points: 100 }), ref: userDocRef });
      txGetStub.onCall(2).resolves({ exists: true, data: () => ({ creditPercentage: 10 }), ref: configDocRef });
      txGetStub.onCall(3).resolves({ exists: true, data: () => ({ name: 'Test Bunk' }), ref: bunkDocRef });
      
      const wrapped = test.wrap(myFunctions.creditPoints);
      await wrapped({ customerId: 'cust-id', amountSpent: 500 }, { auth: { uid: 'manager-uid' } });

      assert(userUpdateStub.calledOnceWith({ points: 150 }));
      assert(transactionSetStub.calledOnce);
    });
  });

  describe('redeemPoints', () => {
    it('should redeem points if manager', async () => {
      isManagerStub.resolves(true);
      
      // Correctly add the `.ref` property here too
      txGetStub.onCall(0).resolves({ exists: true, data: () => ({}), ref: userDocRef });
      txGetStub.onCall(1).resolves({ exists: true, data: () => ({ isVerified: true, points: 200 }), ref: userDocRef });
      txGetStub.onCall(2).resolves({ exists: true, data: () => ({ pointValue: 0.5 }), ref: configDocRef });
      
      const wrapped = test.wrap(myFunctions.redeemPoints);
      await wrapped({ customerId: 'cust-id', pointsToRedeem: 100 }, { auth: { uid: 'manager-uid' } });

      assert(userUpdateStub.calledOnceWith({ points: 100 }));
      assert(transactionSetStub.calledOnce);
    });
  });

  describe('setUserRole', () => {
    it('should set role if admin', async () => {
      isAdminStub.resolves(true);
      const wrapped = test.wrap(myFunctions.setUserRole);
      await wrapped({ targetUid: 'test-user-id', newRole: 'manager' }, { auth: { uid: 'admin-uid' } });
      assert(setCustomUserClaimsStub.calledOnceWith('test-user-id', { manager: true }));
      assert(userUpdateStub.calledOnceWith({ role: 'manager' }));
    });
  });

  describe('updateGlobalConfig', () => {
    it('should update config if admin', async () => {
      isAdminStub.resolves(true);
      const wrapped = test.wrap(myFunctions.updateGlobalConfig);
      await wrapped({ updateData: { creditPercentage: 20 } }, { auth: { uid: 'admin-uid' } });
      assert(configSetStub.calledOnceWith({ creditPercentage: 20 }, { merge: true }));
    });
  });

  describe('onUserCreate', () => {
    it('should update isVerified flag on email verification', async () => {
      userGetStub.resolves({ exists: true });
      const wrapped = test.wrap(myFunctions.onUserCreate);
      await wrapped({ uid: 'u', email: 'e', emailVerified: true });
      assert(userUpdateStub.calledOnceWith({ isVerified: true }));
    });
  });
});
