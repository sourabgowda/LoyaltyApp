
const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const test = require('firebase-functions-test')();

describe('Bunk Functions', () => {
    let bunkFunctions, authUtilStub, validationStub, adminStub;
    let authServiceStub, firestoreServiceStub, docStub;

    beforeEach(() => {
        authUtilStub = { isAdmin: sinon.stub() };
        validationStub = { isValidPincode: sinon.stub() };
        authServiceStub = { getUser: sinon.stub() };

        docStub = {
            update: sinon.stub().resolves(),
            get: sinon.stub().resolves({ exists: true, data: () => ({ managerIds: ['manager1', 'manager2'] }) }),
            set: sinon.stub().resolves(),
            delete: sinon.stub().resolves(),
        };
        const collectionStub = sinon.stub().returns({ 
            doc: sinon.stub().returns(docStub),
            add: sinon.stub().resolves({ id: 'new-bunk-id' }),
        });
        firestoreServiceStub = { collection: collectionStub };

        const fieldValueStub = { 
            serverTimestamp: () => 'MOCK_SERVER_TIMESTAMP', 
            arrayUnion: (val) => `UNION:${val}`,
            arrayRemove: (val) => `REMOVE:${val}`
        }; 

        adminStub = {
            auth: () => authServiceStub,
            firestore: Object.assign(() => firestoreServiceStub, { FieldValue: fieldValueStub }),
            initializeApp: sinon.stub(),
        };

        bunkFunctions = proxyquire('../bunk', {
            'firebase-admin': adminStub,
            './utils/auth': authUtilStub,
            './validation': validationStub,
        });
    });

    afterEach(() => {
        sinon.restore();
        test.cleanup();
    });

    describe('createBunk', () => {
        it('should deny access if user is not an admin', async () => {
            authUtilStub.isAdmin.resolves(false);
            const wrapped = test.wrap(bunkFunctions.createBunk);
            await assert.rejects(() => wrapped({}, { auth: { uid: 'some-uid' } }), new Error('Only admins can create bunks.'));
        });

        it('should throw an error for missing bunk details', async () => {
            authUtilStub.isAdmin.resolves(true);
            const wrapped = test.wrap(bunkFunctions.createBunk);
            await assert.rejects(() => wrapped({}, { auth: { uid: 'admin-uid' } }), new Error('Bunk details are required.'));
        });

        it('should throw an error for an invalid pincode', async () => {
            authUtilStub.isAdmin.resolves(true);
            validationStub.isValidPincode.returns(false);
            const wrapped = test.wrap(bunkFunctions.createBunk);
            await assert.rejects(() => wrapped({ name: 'a', location: 'b', district: 'c', state: 'd', pincode: '012345' }, { auth: { uid: 'admin-uid' } }), new Error('Pincode must be a 6-digit number and cannot start with 0.'));
        });

        it('should throw an error for a pincode with more than 6 digits', async () => {
            authUtilStub.isAdmin.resolves(true);
            validationStub.isValidPincode.returns(false);
            const wrapped = test.wrap(bunkFunctions.createBunk);
            await assert.rejects(() => wrapped({ name: 'a', location: 'b', district: 'c', state: 'd', pincode: '1234567' }, { auth: { uid: 'admin-uid' } }), new Error('Pincode must be a 6-digit number and cannot start with 0.'));
        });

        it('should create a bunk successfully', async () => {
            authUtilStub.isAdmin.resolves(true);
            validationStub.isValidPincode.returns(true);
            const wrapped = test.wrap(bunkFunctions.createBunk);

            const result = await wrapped({ name: 'Test Bunk', location: 'Test Location', district: 'Test District', state: 'Test State', pincode: '123456' }, { auth: { uid: 'admin-uid' } });

            assert.deepStrictEqual(result, { status: 'success', message: 'Bunk created successfully.', bunkId: 'new-bunk-id' });
        });
    });

    describe('assignManagerToBunk', () => {
        it('should deny access if user is not an admin', async () => {
            authUtilStub.isAdmin.resolves(false);
            const wrapped = test.wrap(bunkFunctions.assignManagerToBunk);
            await assert.rejects(() => wrapped({ managerUid: 'm', bunkId: 'b' }, { auth: { uid: 'u' } }), new Error('Only admins can assign managers to bunks.'));
        });

        it('should throw an error for missing arguments', async () => {
            authUtilStub.isAdmin.resolves(true);
            const wrapped = test.wrap(bunkFunctions.assignManagerToBunk);
            await assert.rejects(() => wrapped({}, { auth: { uid: 'admin-uid' } }), new Error('A managerUid and bunkId are required.'));
        });

        it('should throw an error if bunk not found', async () => {
            authUtilStub.isAdmin.resolves(true);
            docStub.get.resolves({ exists: false });
            const wrapped = test.wrap(bunkFunctions.assignManagerToBunk);
            await assert.rejects(() => wrapped({ managerUid: 'm', bunkId: 'b' }, { auth: { uid: 'admin-uid' } }), new Error('Bunk not found.'));
        });

        it('should throw an error if user not found', async () => {
            authUtilStub.isAdmin.resolves(true);
            authServiceStub.getUser.rejects({ code: 'auth/user-not-found' });
            const wrapped = test.wrap(bunkFunctions.assignManagerToBunk);
            await assert.rejects(() => wrapped({ managerUid: 'm', bunkId: 'b' }, { auth: { uid: 'admin-uid' } }), new Error('Manager user not found.'));
        });

        it('should throw an error for other auth errors', async () => {
            authUtilStub.isAdmin.resolves(true);
            authServiceStub.getUser.rejects(new Error('Some other error'));
            const wrapped = test.wrap(bunkFunctions.assignManagerToBunk);
            await assert.rejects(() => wrapped({ managerUid: 'm', bunkId: 'b' }, { auth: { uid: 'admin-uid' } }), new Error('Some other error'));
        });

        it('should throw an error if user is not a manager', async () => {
            authUtilStub.isAdmin.resolves(true);
            authServiceStub.getUser.resolves({ customClaims: { customer: true } });
            const wrapped = test.wrap(bunkFunctions.assignManagerToBunk);
            await assert.rejects(() => wrapped({ managerUid: 'm', bunkId: 'b' }, { auth: { uid: 'admin-uid' } }), new Error('User is not a manager.'));
        });

        it('should assign a manager successfully', async () => {
            authUtilStub.isAdmin.resolves(true);
            authServiceStub.getUser.resolves({ customClaims: { manager: true } });
            const wrapped = test.wrap(bunkFunctions.assignManagerToBunk);

            const result = await wrapped({ managerUid: 'manager-uid', bunkId: 'bunk-id' }, { auth: { uid: 'admin-uid' } });

            assert.deepStrictEqual(result, { status: 'success', message: 'Manager assigned to bunk successfully.' });
        });
    });

    describe('unassignManagerFromBunk', () => {
        it('should deny access if user is not an admin', async () => {
            authUtilStub.isAdmin.resolves(false);
            const wrapped = test.wrap(bunkFunctions.unassignManagerFromBunk);
            await assert.rejects(() => wrapped({ managerUid: 'm', bunkId: 'b' }, { auth: { uid: 'u' } }), new Error('Only admins can unassign managers from bunks.'));
        });

        it('should throw an error for missing arguments', async () => {
            authUtilStub.isAdmin.resolves(true);
            const wrapped = test.wrap(bunkFunctions.unassignManagerFromBunk);
            await assert.rejects(() => wrapped({}, { auth: { uid: 'admin-uid' } }), new Error('A managerUid and bunkId are required.'));
        });

        it('should throw an error if bunk not found', async () => {
            authUtilStub.isAdmin.resolves(true);
            docStub.get.resolves({ exists: false });
            const wrapped = test.wrap(bunkFunctions.unassignManagerFromBunk);
            await assert.rejects(() => wrapped({ managerUid: 'm', bunkId: 'b' }, { auth: { uid: 'admin-uid' } }), new Error('Bunk not found.'));
        });

        it('should throw an error if user not found', async () => {
            authUtilStub.isAdmin.resolves(true);
            authServiceStub.getUser.rejects({ code: 'auth/user-not-found' });
            const wrapped = test.wrap(bunkFunctions.unassignManagerFromBunk);
            await assert.rejects(() => wrapped({ managerUid: 'm', bunkId: 'b' }, { auth: { uid: 'admin-uid' } }), new Error('Manager user not found.'));
        });

        it('should throw an error for other auth errors', async () => {
            authUtilStub.isAdmin.resolves(true);
            authServiceStub.getUser.rejects(new Error('Some other error'));
            const wrapped = test.wrap(bunkFunctions.unassignManagerFromBunk);
            await assert.rejects(() => wrapped({ managerUid: 'm', bunkId: 'b' }, { auth: { uid: 'admin-uid' } }), new Error('Some other error'));
        });

        it('should unassign a manager successfully', async () => {
            authUtilStub.isAdmin.resolves(true);
            authServiceStub.getUser.resolves({});
            const wrapped = test.wrap(bunkFunctions.unassignManagerFromBunk);

            const result = await wrapped({ managerUid: 'manager-uid', bunkId: 'bunk-id' }, { auth: { uid: 'admin-uid' } });

            assert.deepStrictEqual(result, { status: 'success', message: 'Manager unassigned from bunk successfully.' });
        });
    });

    describe('deleteBunk', () => {
        it('should deny access if user is not an admin', async () => {
            authUtilStub.isAdmin.resolves(false);
            const wrapped = test.wrap(bunkFunctions.deleteBunk);
            await assert.rejects(() => wrapped({ bunkId: 'bunk-id' }, { auth: { uid: 'some-uid' } }), new Error('Only admins can delete bunks.'));
        });

        it('should throw an error for a missing bunkId', async () => {
            authUtilStub.isAdmin.resolves(true);
            const wrapped = test.wrap(bunkFunctions.deleteBunk);
            await assert.rejects(() => wrapped({}, { auth: { uid: 'admin-uid' } }), new Error('A bunkId is required.'));
        });

        it('should throw an error if bunk not found', async () => {
            authUtilStub.isAdmin.resolves(true);
            docStub.get.resolves({ exists: false });
            const wrapped = test.wrap(bunkFunctions.deleteBunk);
            await assert.rejects(() => wrapped({ bunkId: 'bunk-id' }, { auth: { uid: 'admin-uid' } }), new Error('Bunk not found.'));
        });

        it('should delete a bunk and unassign managers successfully', async () => {
            authUtilStub.isAdmin.resolves(true);
            const wrapped = test.wrap(bunkFunctions.deleteBunk);
            const result = await wrapped({ bunkId: 'bunk-id' }, { auth: { uid: 'admin-uid' } });

            assert.deepStrictEqual(result, { status: 'success', message: 'Bunk deleted successfully.' });
            assert(docStub.delete.calledOnce, 'Bunk should be deleted');
            assert.equal(docStub.update.callCount, 2, 'Expected manager updates');
        });
    });
});
