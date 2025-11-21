
const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const test = require('firebase-functions-test')();

describe('Admin Functions', () => {
    let adminFunctions, authUtilStub, adminStub;
    let firestoreServiceStub;

    beforeEach(() => {
        authUtilStub = { isAdmin: sinon.stub() };

        const collectionStub = sinon.stub();
        // Default stub for get() to return an empty snapshot
        collectionStub.returns({ 
            get: sinon.stub().resolves({ docs: [] }),
            orderBy: sinon.stub().returns({ get: sinon.stub().resolves({ docs: [] }) })
        });

        firestoreServiceStub = { collection: collectionStub };

        adminStub = {
            firestore: () => firestoreServiceStub,
            initializeApp: sinon.stub(),
        };

        adminFunctions = proxyquire('../admin', {
            'firebase-admin': adminStub,
            './utils/auth': authUtilStub,
        });
    });

    afterEach(() => {
        sinon.restore();
        test.cleanup();
    });

    describe('getAllBunks', () => {
        it('should deny access if user is not an admin', async () => {
            authUtilStub.isAdmin.resolves(false);
            const wrapped = test.wrap(adminFunctions.getAllBunks);
            await assert.rejects(() => wrapped({}, { auth: { uid: 'some-uid' } }), new Error('Only admins can view all bunks.'));
        });

        it('should return a list of bunks if user is an admin', async () => {
            authUtilStub.isAdmin.resolves(true);
            const bunksData = [
                { id: 'bunk1', data: () => ({ name: 'Bunk 1' }) },
                { id: 'bunk2', data: () => ({ name: 'Bunk 2' }) },
            ];
            firestoreServiceStub.collection.withArgs('bunks').returns({ 
                get: sinon.stub().resolves({ docs: bunksData })
            });

            const wrapped = test.wrap(adminFunctions.getAllBunks);
            const result = await wrapped({}, { auth: { uid: 'admin-uid' } });

            assert.deepStrictEqual(result, {
                status: 'success',
                bunks: [
                    { id: 'bunk1', name: 'Bunk 1' },
                    { id: 'bunk2', name: 'Bunk 2' },
                ]
            });
        });

        it('should return an empty list if no bunks are found', async () => {
            authUtilStub.isAdmin.resolves(true);
            // The default stub returns an empty list, so no need to override
            const wrapped = test.wrap(adminFunctions.getAllBunks);
            const result = await wrapped({}, { auth: { uid: 'admin-uid' } });

            assert.deepStrictEqual(result, { status: 'success', bunks: [] });
        });
    });

    describe('getAllTransactions', () => {
        it('should deny access if user is not an admin', async () => {
            authUtilStub.isAdmin.resolves(false);
            const wrapped = test.wrap(adminFunctions.getAllTransactions);
            await assert.rejects(() => wrapped({}, { auth: { uid: 'some-uid' } }), new Error('Only admins can view all transactions.'));
        });

        it('should return a list of transactions if user is an admin', async () => {
            authUtilStub.isAdmin.resolves(true);
            const transactionsData = [
                { id: 'txn1', data: () => ({ type: 'add_points', amount: 100 }) },
                { id: 'txn2', data: () => ({ type: 'redeem_points', amount: 50 }) },
            ];
            firestoreServiceStub.collection.withArgs('transactions').returns({ 
                orderBy: sinon.stub().returns({ 
                    get: sinon.stub().resolves({ docs: transactionsData })
                })
            });

            const wrapped = test.wrap(adminFunctions.getAllTransactions);
            const result = await wrapped({}, { auth: { uid: 'admin-uid' } });

            assert.deepStrictEqual(result, {
                status: 'success',
                transactions: [
                    { id: 'txn1', type: 'add_points', amount: 100 },
                    { id: 'txn2', type: 'redeem_points', amount: 50 },
                ]
            });
        });

        it('should return an empty list if no transactions are found', async () => {
            authUtilStub.isAdmin.resolves(true);
            // The default stub returns an empty list, so no need to override
            const wrapped = test.wrap(adminFunctions.getAllTransactions);
            const result = await wrapped({}, { auth: { uid: 'admin-uid' } });

            assert.deepStrictEqual(result, { status: 'success', transactions: [] });
        });
    });
});
