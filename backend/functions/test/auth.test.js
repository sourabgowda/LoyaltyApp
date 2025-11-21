
const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

describe('Auth Util Functions', () => {
    let authUtils, adminStub, firestoreServiceStub, getStub;

    beforeEach(() => {
        getStub = sinon.stub();
        const docStub = sinon.stub().returns({ get: getStub });
        const collectionStub = sinon.stub().returns({ doc: docStub });

        firestoreServiceStub = {
            collection: collectionStub,
        };

        adminStub = {
            firestore: () => firestoreServiceStub,
            initializeApp: sinon.stub(),
        };

        authUtils = proxyquire('../utils/auth', {
            'firebase-admin': adminStub,
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('getUserDoc', () => {
        it('should return null if no userId is provided', async () => {
            const result = await authUtils.getUserDoc(null);
            assert.strictEqual(result, null);
        });

        it('should return null if user document does not exist', async () => {
            getStub.resolves({ exists: false });
            const result = await authUtils.getUserDoc('non-existent-user');
            assert.strictEqual(result, null);
        });

        it('should return user data if user document exists', async () => {
            const userData = { name: 'Test User' };
            getStub.resolves({ exists: true, data: () => userData, ref: 'mockRef' });
            const result = await authUtils.getUserDoc('existent-user');
            assert.deepStrictEqual(result.data, userData);
        });
    });

    describe('isManager', () => {
        it('should return true if token has manager claim', async () => {
            const decodedToken = { manager: true };
            const result = await authUtils.isManager(decodedToken);
            assert.strictEqual(result, true);
        });

        it('should return false if token does not have manager claim', async () => {
            const decodedToken = {};
            const result = await authUtils.isManager(decodedToken);
            assert.strictEqual(result, false);
        });

        it('should return false for a falsy token', async () => {
            const result = await authUtils.isManager(null);
            assert.strictEqual(result, false);
        });
    });

    describe('isAdmin', () => {
        it('should return true if token has admin claim', async () => {
            const decodedToken = { admin: true };
            const result = await authUtils.isAdmin(decodedToken);
            assert.strictEqual(result, true);
        });

        it('should return false if token does not have admin claim', async () => {
            const decodedToken = {};
            const result = await authUtils.isAdmin(decodedToken);
            assert.strictEqual(result, false);
        });

        it('should return false for a falsy token', async () => {
            const result = await authUtils.isAdmin(null);
            assert.strictEqual(result, false);
        });
    });
});
