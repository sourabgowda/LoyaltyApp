
const test = require('firebase-functions-test')();
const assert = require('assert');
const admin = require('firebase-admin');
const sinon = require('sinon');

sinon.stub(admin, 'initializeApp');

const userSetStub = sinon.stub().resolves();
const userUpdateStub = sinon.stub().resolves();
const bunkAddStub = sinon.stub().resolves({ id: 'new-bunk-123' });
const bunkUpdateStub = sinon.stub().resolves();
const configSetStub = sinon.stub().resolves();
const transactionSetStub = sinon.stub().resolves();
const deleteUserStub = sinon.stub().resolves();

const txGetStub = sinon.stub();
const userGetStub = sinon.stub();
const getCollectionsStub = sinon.stub().resolves([]);

const userDocRef = { set: userSetStub, update: userUpdateStub, get: userGetStub, path: 'users/test-user' };
const bunkDocRef = { get: txGetStub, update: bunkUpdateStub }; 
const configDocRef = { set: configSetStub, get: txGetStub };
const transactionDocRef = { set: transactionSetStub };

const userDocStub = sinon.stub().returns(userDocRef);
const bunkDocStub = sinon.stub().returns(bunkDocRef);
const configDocStub = sinon.stub().returns(configDocRef);
const transactionDocStub = sinon.stub().returns(transactionDocRef);

const collectionStub = sinon.stub();
collectionStub.withArgs('users').returns({ doc: userDocStub });
collectionStub.withArgs('bunks').returns({ add: bunkAddStub, doc: bunkDocStub, get: getCollectionsStub });
collectionStub.withArgs('configs').returns({ doc: configDocStub });
collectionStub.withArgs('transactions').returns({ doc: transactionDocStub, get: getCollectionsStub });

sinon.stub(admin, 'firestore').get(() => {
    const firestore = () => ({
        collection: collectionStub,
        runTransaction: async (updateFunction) => {
            const tx = { 
                get: txGetStub,
                update: (docRef, data) => docRef.update(data), 
                set: (docRef, data) => docRef.set(data)
            };
            return await updateFunction(tx);
        }
    });
    firestore.FieldValue = {
      serverTimestamp: () => 'SERVER_TIMESTAMP',
      arrayUnion: (arg) => `ARRAY_UNION:${arg}`,
      arrayRemove: (arg) => `ARRAY_REMOVE:${arg}`
    };
    return firestore;
});

const createUserStub = sinon.stub().resolves({ uid: '123456' });
const setCustomUserClaimsStub = sinon.stub().resolves();
const getUserByEmailStub = sinon.stub();
const getUserStub = sinon.stub();
sinon.stub(admin, 'auth').get(() => () => ({
  createUser: createUserStub,
  setCustomUserClaims: setCustomUserClaimsStub,
  getUserByEmail: getUserByEmailStub,
  getUser: getUserStub,
  deleteUser: deleteUserStub
}));

const myFunctions = require('../index.js');
const authUtils = require('../utils/auth');

const isAdminStub = sinon.stub(authUtils, 'isAdmin');
const isManagerStub = sinon.stub(authUtils, 'isManager');
const getUserDocStub = sinon.stub(authUtils, 'getUserDoc');

describe('Cloud Functions', () => {

  after(() => { sinon.restore(); test.cleanup(); });

  beforeEach(() => {
      const stubs = [userSetStub, userUpdateStub, bunkAddStub, bunkUpdateStub, configSetStub, 
                     transactionSetStub, userDocStub, bunkDocStub, configDocStub, 
                     transactionDocStub, collectionStub, createUserStub, 
                     setCustomUserClaimsStub, isAdminStub, isManagerStub, 
                     txGetStub, userGetStub, getUserByEmailStub, getUserDocStub, getUserStub,
                     deleteUserStub, getCollectionsStub];
      stubs.forEach(s => s.resetHistory());
  });

  describe('registerCustomer', () => {
    it('should create a new customer', async () => {
      const wrapped = test.wrap(myFunctions.registerCustomer);
      await wrapped({ firstName: 'Test', lastName: 'User', email: 'test@example.com', password: 'password' });
      assert(userSetStub.calledOnce);
    });
    it('should throw an error if required fields are missing', async () => {
        const wrapped = test.wrap(myFunctions.registerCustomer);
        await assert.rejects(wrapped({ firstName: 'Test' }), { code: 'invalid-argument' });
    });
    it('should throw an error for invalid email format', async () => {
        const wrapped = test.wrap(myFunctions.registerCustomer);
        await assert.rejects(wrapped({ firstName: 'Test', lastName: 'User', email: 'test', password: 'password' }), { code: 'invalid-argument' });
    });
    it('should throw an error for a short password', async () => {
        const wrapped = test.wrap(myFunctions.registerCustomer);
        await assert.rejects(wrapped({ firstName: 'Test', lastName: 'User', email: 'test@test.com', password: '123' }), { code: 'invalid-argument' });
    });
    it('should throw an error if email already exists', async () => {
        createUserStub.throws({code: 'auth/email-already-exists'});
        const wrapped = test.wrap(myFunctions.registerCustomer);
        await assert.rejects(wrapped({ firstName: 'Test', lastName: 'User', email: 'test@test.com', password: 'password' }), { code: 'already-exists' });
    });
    it('should throw an error for a long first name', async () => {
        const wrapped = test.wrap(myFunctions.registerCustomer);
        await assert.rejects(wrapped({ firstName: 'a'.repeat(41), lastName: 'User', email: 'test@test.com', password: 'password' }), { code: 'invalid-argument' });
    });
    it('should throw an error for a first name with spaces', async () => {
        const wrapped = test.wrap(myFunctions.registerCustomer);
        await assert.rejects(wrapped({ firstName: 'Test User', lastName: 'User', email: 'test@test.com', password: 'password' }), { code: 'invalid-argument' });
    });
    it('should throw an error for a long last name', async () => {
        const wrapped = test.wrap(myFunctions.registerCustomer);
        await assert.rejects(wrapped({ firstName: 'Test', lastName: 'a'.repeat(81), email: 'test@test.com', password: 'password' }), { code: 'invalid-argument' });
    });
    it('should throw an error for a last name with too many spaces', async () => {
        const wrapped = test.wrap(myFunctions.registerCustomer);
        await assert.rejects(wrapped({ firstName: 'Test', lastName: 'User  With  Too  Many  Spaces', email: 'test@test.com', password: 'password' }), { code: 'invalid-argument' });
    });
  });

  describe('createBunk', () => {
    it('should create a bunk and log the transaction if admin', async () => {
      isAdminStub.resolves(true);
      const wrapped = test.wrap(myFunctions.createBunk);
      const bunkData = { name: 'B', location: 'L', district: 'D', state: 'S', pincode: '123456' };
      await wrapped(bunkData, { auth: { uid: 'admin-uid' } });
      assert(bunkAddStub.calledOnceWith({ ...bunkData, managerIds: [] }));
      assert(transactionSetStub.calledOnce);
      const transactionArg = transactionSetStub.firstCall.args[0];
      assert.deepStrictEqual(transactionArg.type, 'create_bunk');
      assert.deepStrictEqual(transactionArg.initiatorRole, 'admin');
    });

    it('should deny if not admin', async () => {
      isAdminStub.resolves(false);
      const wrapped = test.wrap(myFunctions.createBunk);
      await assert.rejects(wrapped({}, { auth: { uid: 'user-uid' } }), { code: 'permission-denied' });
    });
    it('should throw an error if required bunk data is missing', async () => {
        isAdminStub.resolves(true);
        const wrapped = test.wrap(myFunctions.createBunk);
        await assert.rejects(wrapped({ name: 'B' }, { auth: { uid: 'admin-uid' } }), { code: 'invalid-argument' });
    });
    it('should throw an error for an invalid pincode', async () => {
        isAdminStub.resolves(true);
        const bunkData = { name: 'B', location: 'L', district: 'D', state: 'S', pincode: '123' };
        const wrapped = test.wrap(myFunctions.createBunk);
        await assert.rejects(wrapped(bunkData, { auth: { uid: 'admin-uid' } }), { code: 'invalid-argument' });
    });
  });

  describe('assignManagerToBunk', () => {
    it('should assign a manager to a bunk and log the transaction if admin', async () => {
      isAdminStub.resolves(true);
      bunkDocStub.returns({ get: () => ({ exists: true }), update: bunkUpdateStub });
      getUserStub.resolves({ customClaims: { manager: true } });
      const wrapped = test.wrap(myFunctions.assignManagerToBunk);
      await wrapped({ managerUid: 'manager-uid', bunkId: 'bunk-123' }, { auth: { uid: 'admin-uid' } });
      assert(userUpdateStub.calledOnceWith({ assignedBunkId: 'bunk-123' }));
      assert(bunkUpdateStub.calledOnceWith({ managerIds: 'ARRAY_UNION:manager-uid' }));
      assert(transactionSetStub.calledOnce);
      const transactionArg = transactionSetStub.firstCall.args[0];
      assert.deepStrictEqual(transactionArg.type, 'assign_manager');
      assert.deepStrictEqual(transactionArg.initiatorRole, 'admin');
    });

    it('should deny if not admin', async () => {
      isAdminStub.resolves(false);
      const wrapped = test.wrap(myFunctions.assignManagerToBunk);
      await assert.rejects(wrapped({}, { auth: { uid: 'user-uid' } }), { code: 'permission-denied' });
    });

    it('should throw an error if managerUid or bunkId are missing', async () => {
      isAdminStub.resolves(true);
      const wrapped = test.wrap(myFunctions.assignManagerToBunk);
      await assert.rejects(wrapped({ managerUid: 'manager-uid' }, { auth: { uid: 'admin-uid' } }), { code: 'invalid-argument' });
    });
  });

  describe('creditPoints', () => {
    it('should credit points and log the transaction if manager', async () => {
      isManagerStub.resolves(true);
      txGetStub.onCall(0).resolves({ exists: true, data: () => ({ assignedBunkId: 'bunk-123' }), ref: userDocRef });
      txGetStub.onCall(1).resolves({ exists: true, data: () => ({ isVerified: true, points: 100 }), ref: userDocRef });
      txGetStub.onCall(2).resolves({ exists: true, data: () => ({ creditPercentage: 10 }), ref: configDocRef });
      txGetStub.onCall(3).resolves({ exists: true, data: () => ({ name: 'Test Bunk' }), ref: bunkDocRef });
      const wrapped = test.wrap(myFunctions.creditPoints);
      await wrapped({ customerId: 'cust-id', amountSpent: 500, bunkId: 'bunk-123' }, { auth: { uid: 'manager-uid' } });
      assert(userUpdateStub.calledOnceWith({ points: 150 }));
      assert(transactionSetStub.calledOnce);
      const transactionArg = transactionSetStub.firstCall.args[0];
      assert.deepStrictEqual(transactionArg.type, 'credit');
      assert.deepStrictEqual(transactionArg.initiatorRole, 'manager');
    });
    it('should throw a permission-denied error if the user is not a manager', async () => {
        isManagerStub.resolves(false);
        const wrapped = test.wrap(myFunctions.creditPoints);
        await assert.rejects(wrapped({}, { auth: { uid: 'user-uid' } }), { code: 'permission-denied' });
    });
    it('should throw a permission-denied error if a manager tries to credit points to their own account', async () => {
        isManagerStub.resolves(true);
        const wrapped = test.wrap(myFunctions.creditPoints);
        await assert.rejects(wrapped({ customerId: 'manager-uid', amountSpent: 500, bunkId: 'bunk-123' }, { auth: { uid: 'manager-uid' } }), { code: 'permission-denied' });
    });
    it('should throw a not-found error if the customer does not exist', async () => {
        isManagerStub.resolves(true);
        txGetStub.onCall(0).resolves({ exists: true, data: () => ({ assignedBunkId: 'bunk-123' }), ref: userDocRef });
        txGetStub.onCall(1).resolves({ exists: false });
        const wrapped = test.wrap(myFunctions.creditPoints);
        await assert.rejects(wrapped({ customerId: 'cust-id', amountSpent: 500, bunkId: 'bunk-123' }, { auth: { uid: 'manager-uid' } }), { code: 'not-found' });
    });
    it('should throw an error if the customer is not verified', async () => {
        isManagerStub.resolves(true);
        txGetStub.onCall(0).resolves({ exists: true, data: () => ({ assignedBunkId: 'bunk-123' }), ref: userDocRef });
        txGetStub.onCall(1).resolves({ exists: true, data: () => ({ isVerified: false, points: 100 }), ref: userDocRef });
        const wrapped = test.wrap(myFunctions.creditPoints);
        await assert.rejects(wrapped({ customerId: 'cust-id', amountSpent: 500, bunkId: 'bunk-123' }, { auth: { uid: 'manager-uid' } }), { code: 'failed-precondition' });
    });
    it('should throw an invalid-argument error for a non-positive amount', async () => {
        isManagerStub.resolves(true);
        const wrapped = test.wrap(myFunctions.creditPoints);
        await assert.rejects(wrapped({ customerId: 'cust-id', amountSpent: 0, bunkId: 'bunk-123' }, { auth: { uid: 'manager-uid' } }), { code: 'invalid-argument' });
    });
  });

  describe('redeemPoints', () => {
    it('should redeem points and log the transaction if manager', async () => {
      isManagerStub.resolves(true);
      txGetStub.onCall(0).resolves({ exists: true, data: () => ({ assignedBunkId: 'bunk-123' }), ref: userDocRef });
      txGetStub.onCall(1).resolves({ exists: true, data: () => ({ isVerified: true, points: 200 }), ref: userDocRef });
      txGetStub.onCall(2).resolves({ exists: true, data: () => ({ redemptionRate: 0.5 }), ref: configDocRef });
      txGetStub.onCall(3).resolves({ exists: true, data: () => ({ name: 'Test Bunk' }), ref: bunkDocRef });
      const wrapped = test.wrap(myFunctions.redeemPoints);
      await wrapped({ customerId: 'cust-id', pointsToRedeem: 100, bunkId: 'bunk-123' }, { auth: { uid: 'manager-uid' } });
      assert(userUpdateStub.calledOnceWith({ points: 100 }));
      assert(transactionSetStub.calledOnce);
      const transactionArg = transactionSetStub.firstCall.args[0];
      assert.deepStrictEqual(transactionArg.type, 'redeem');
      assert.deepStrictEqual(transactionArg.initiatorRole, 'manager');
    });
    it('should throw a permission-denied error if the user is not a manager', async () => {
        isManagerStub.resolves(false);
        const wrapped = test.wrap(myFunctions.redeemPoints);
        await assert.rejects(wrapped({}, { auth: { uid: 'user-uid' } }), { code: 'permission-denied' });
    });
    it('should throw a permission-denied error if a manager tries to redeem their own points', async () => {
        isManagerStub.resolves(true);
        const wrapped = test.wrap(myFunctions.redeemPoints);
        await assert.rejects(wrapped({ customerId: 'manager-uid', pointsToRedeem: 100, bunkId: 'bunk-123' }, { auth: { uid: 'manager-uid' } }), { code: 'permission-denied' });
    });
    it('should throw an error if the customer has insufficient points', async () => {
        isManagerStub.resolves(true);
        txGetStub.onCall(0).resolves({ exists: true, data: () => ({ assignedBunkId: 'bunk-123' }), ref: userDocRef });
        txGetStub.onCall(1).resolves({ exists: true, data: () => ({ isVerified: true, points: 50 }), ref: userDocRef });
        txGetStub.onCall(2).resolves({ exists: true, data: () => ({ redemptionRate: 0.5 }), ref: configDocRef });
        const wrapped = test.wrap(myFunctions.redeemPoints);
        await assert.rejects(wrapped({ customerId: 'cust-id', pointsToRedeem: 100, bunkId: 'bunk-123' }, { auth: { uid: 'manager-uid' } }), { code: 'failed-precondition' });
    });
    it('should throw an invalid-argument error for non-positive points', async () => {
        isManagerStub.resolves(true);
        const wrapped = test.wrap(myFunctions.redeemPoints);
        await assert.rejects(wrapped({ customerId: 'cust-id', pointsToRedeem: 0, bunkId: 'bunk-123' }, { auth: { uid: 'manager-uid' } }), { code: 'invalid-argument' });
    });
  });

  describe('setUserRole', () => {
    it('should set role and log the transaction if admin', async () => {
      isAdminStub.resolves(true);
      getUserDocStub.resolves({data: {}, ref: {}});
      const wrapped = test.wrap(myFunctions.setUserRole);
      await wrapped({ targetUid: 'test-user-id', newRole: 'manager' }, { auth: { uid: 'admin-uid' } });
      assert(setCustomUserClaimsStub.calledOnceWith('test-user-id', { manager: true }));
      assert(userUpdateStub.calledOnceWith({ role: 'manager' }));
      assert(transactionSetStub.calledOnce);
      const transactionArg = transactionSetStub.firstCall.args[0];
      assert.deepStrictEqual(transactionArg.type, 'set_user_role');
      assert.deepStrictEqual(transactionArg.initiatorRole, 'admin');
    });
    it('should deny access if the user is not an admin', async () => {
        isAdminStub.resolves(false);
        const wrapped = test.wrap(myFunctions.setUserRole);
        await assert.rejects(wrapped({}, { auth: { uid: 'user-uid' } }), { code: 'permission-denied' });
    });
    it('should throw an error for an invalid role', async () => {
        isAdminStub.resolves(true);
        const wrapped = test.wrap(myFunctions.setUserRole);
        await assert.rejects(wrapped({ targetUid: 'test-user-id', newRole: 'invalid' }, { auth: { uid: 'admin-uid' } }), { code: 'invalid-argument' });
    });
    it('should throw a not-found error if the target user does not exist', async () => {
        isAdminStub.resolves(true);
        getUserDocStub.resolves(null);
        const wrapped = test.wrap(myFunctions.setUserRole);
        await assert.rejects(wrapped({ targetUid: 'test-user-id', newRole: 'manager' }, { auth: { uid: 'admin-uid' } }), { code: 'not-found' });
    });
  });

  describe('updateGlobalConfig', () => {
    it('should update config and log the transaction if admin', async () => {
      isAdminStub.resolves(true);
      const wrapped = test.wrap(myFunctions.updateGlobalConfig);
      await wrapped({ updateData: { creditPercentage: 20 } }, { auth: { uid: 'admin-uid' } });
      assert(configSetStub.calledOnceWith({ creditPercentage: 20 }, { merge: true }));
      assert(transactionSetStub.calledOnce);
      const transactionArg = transactionSetStub.firstCall.args[0];
      assert.deepStrictEqual(transactionArg.type, 'update_global_config');
      assert.deepStrictEqual(transactionArg.initiatorRole, 'admin');
    });
    it('should deny access if the user is not an admin', async () => {
        isAdminStub.resolves(false);
        const wrapped = test.wrap(myFunctions.updateGlobalConfig);
        await assert.rejects(wrapped({}, { auth: { uid: 'user-uid' } }), { code: 'permission-denied' });
    });
    it('should throw an error for invalid updateData', async () => {
        isAdminStub.resolves(true);
        const wrapped = test.wrap(myFunctions.updateGlobalConfig);
        await assert.rejects(wrapped({ updateData: 123 }, { auth: { uid: 'admin-uid' } }), { code: 'invalid-argument' });
    });
    it('should throw an error for a creditPercentage less than 0', async () => {
        isAdminStub.resolves(true);
        const wrapped = test.wrap(myFunctions.updateGlobalConfig);
        await assert.rejects(wrapped({ updateData: { creditPercentage: -1 } }, { auth: { uid: 'admin-uid' } }), { code: 'invalid-argument' });
    });
    it('should throw an error for a creditPercentage greater than 100', async () => {
        isAdminStub.resolves(true);
        const wrapped = test.wrap(myFunctions.updateGlobalConfig);
        await assert.rejects(wrapped({ updateData: { creditPercentage: 101 } }, { auth: { uid: 'admin-uid' } }), { code: 'invalid-argument' });
    });
  });

  describe('onUserCreate', () => {
    it('should update isVerified flag on email verification', async () => {
      userGetStub.resolves({ exists: true });
      const wrapped = test.wrap(myFunctions.onUserCreate);
      await wrapped({ uid: 'u', email: 'e', emailVerified: true });
      assert(userUpdateStub.calledOnceWith({ isVerified: true }));
    });
    it('should not update isVerified if email is not verified', async () => {
        userGetStub.resolves({ exists: true });
        const wrapped = test.wrap(myFunctions.onUserCreate);
        await wrapped({ uid: 'u', email: 'e', emailVerified: false });
        assert(userUpdateStub.notCalled);
    });
    it('should not throw an error if the user document does not exist', async () => {
        userGetStub.resolves({ exists: false });
        const wrapped = test.wrap(myFunctions.onUserCreate);
        await wrapped({ uid: 'u', email: 'e', emailVerified: true });
        assert(userUpdateStub.notCalled);
    });
  });

  describe('unassignManagerFromBunk', () => {
    it('should unassign a manager from a bunk and log the transaction if admin', async () => {
      isAdminStub.resolves(true);
      bunkDocStub.returns({ get: () => ({ exists: true }), update: bunkUpdateStub });
      const wrapped = test.wrap(myFunctions.unassignManagerFromBunk);
      await wrapped({ managerUid: 'manager-uid', bunkId: 'bunk-123' }, { auth: { uid: 'admin-uid' } });
      assert(userUpdateStub.calledOnceWith({ assignedBunkId: null }));
      assert(bunkUpdateStub.calledOnceWith({ managerIds: 'ARRAY_REMOVE:manager-uid' }));
      assert(transactionSetStub.calledOnce);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user and log the transaction if admin', async () => {
      isAdminStub.resolves(true);
      const wrapped = test.wrap(myFunctions.deleteUser);
      await wrapped({ uid: 'user-to-delete-uid' }, { auth: { uid: 'admin-uid' } });
      assert(deleteUserStub.calledOnceWith('user-to-delete-uid'));
      assert(userUpdateStub.calledOnceWith({ isDeleted: true }));
      assert(transactionSetStub.calledOnce);
    });
  });

  describe('getAllBunks', () => {
    it('should return all bunks if admin', async () => {
      isAdminStub.resolves(true);
      const wrapped = test.wrap(myFunctions.getAllBunks);
      await wrapped({}, { auth: { uid: 'admin-uid' } });
      assert(getCollectionsStub.calledOnce);
    });
  });

  describe('getAllTransactions', () => {
    it('should return all transactions if admin', async () => {
      isAdminStub.resolves(true);
      const wrapped = test.wrap(myFunctions.getAllTransactions);
      await wrapped({}, { auth: { uid: 'admin-uid' } });
      assert(getCollectionsStub.calledOnce);
    });
  });

  describe('updateUserProfile', () => {
    it('should allow a user to update their own profile', async () => {
      const wrapped = test.wrap(myFunctions.updateUserProfile);
      await wrapped({ firstName: 'New', lastName: 'Name' }, { auth: { uid: 'user-uid' } });
      assert(userUpdateStub.calledOnceWith({ firstName: 'New', lastName: 'Name' }));
    });
  });

  describe('getAssignedBunk', () => {
    it('should return the assigned bunk for a manager', async () => {
      isManagerStub.resolves(true);
      userGetStub.resolves({ exists: true, data: () => ({ assignedBunkId: 'bunk-123' }) });
      txGetStub.resolves({ exists: true, data: () => ({ name: 'Test Bunk' }) });
      const wrapped = test.wrap(myFunctions.getAssignedBunk);
      const result = await wrapped({}, { auth: { uid: 'manager-uid' } });
      assert.deepStrictEqual(result, { name: 'Test Bunk' });
    });
  });

  describe('getCustomerProfile', () => {
    it('should return a customer profile for a manager', async () => {
      isManagerStub.resolves(true);
      userGetStub.resolves({ exists: true, data: () => ({ firstName: 'Customer', points: 100 }) });
      const wrapped = test.wrap(myFunctions.getCustomerProfile);
      const result = await wrapped({ customerId: 'cust-id' }, { auth: { uid: 'manager-uid' } });
      assert.deepStrictEqual(result, { firstName: 'Customer', points: 100 });
    });
  });

  describe('getCustomerTransactions', () => {
    it('should return customer transactions for a manager', async () => {
      isManagerStub.resolves(true);
      const wrapped = test.wrap(myFunctions.getCustomerTransactions);
      await wrapped({ customerId: 'cust-id' }, { auth: { uid: 'manager-uid' } });
      assert(getCollectionsStub.calledOnce);
    });
  });

  describe('getManagerTransactions', () => {
    it('should return manager\'s transactions for a manager', async () => {
      isManagerStub.resolves(true);
      const wrapped = test.wrap(myFunctions.getManagerTransactions);
      await wrapped({}, { auth: { uid: 'manager-uid' } });
      assert(getCollectionsStub.calledOnce);
    });
  });
});
