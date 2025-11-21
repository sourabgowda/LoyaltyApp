
const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const test = require('firebase-functions-test')();

describe('Manager Functions', () => {
    let managerFunctions, authUtilStub, adminStub, firestoreServiceStub, docStub;

    beforeEach(() => {
        authUtilStub = {
            isManager: sinon.stub(),
            getUserDoc: sinon.stub(),
        };

        docStub = {
            get: sinon.stub(),
        };

        const collectionStub = sinon.stub().returns({ 
            doc: sinon.stub().returns(docStub),
            where: sinon.stub().returns({ 
                orderBy: sinon.stub().returns({ 
                    get: sinon.stub().resolves({ docs: [] })
                })
            }),
        });

        firestoreServiceStub = { collection: collectionStub };

        adminStub = {
            firestore: () => firestoreServiceStub,
            initializeApp: sinon.stub(),
        };

        managerFunctions = proxyquire('../manager', {
            'firebase-admin': adminStub,
            './utils/auth': authUtilStub,
        });
    });

    afterEach(() => {
        sinon.restore();
        test.cleanup();
    });

    describe('getAssignedBunk', () => {
        it('should deny access if user is not a manager', async () => {
            authUtilStub.isManager.resolves(false);
            const wrapped = test.wrap(managerFunctions.getAssignedBunk);
            await assert.rejects(() => wrapped({}, { auth: { uid: 'some-uid' } }), new Error('Only managers can view their assigned bunk.'));
        });

        it('should throw an error if manager document does not exist', async () => {
            authUtilStub.isManager.resolves(true);
            authUtilStub.getUserDoc.resolves(null);
            const wrapped = test.wrap(managerFunctions.getAssignedBunk);
            await assert.rejects(() => wrapped({}, { auth: { uid: 'manager-uid' } }), new Error('You are not assigned to any bunk.'));
        });

        it('should throw an error if manager is not assigned to a bunk', async () => {
            authUtilStub.isManager.resolves(true);
            authUtilStub.getUserDoc.resolves({ data: { assignedBunkId: 'NA' } });
            const wrapped = test.wrap(managerFunctions.getAssignedBunk);
            await assert.rejects(() => wrapped({}, { auth: { uid: 'manager-uid' } }), new Error('You are not assigned to any bunk.'));
        });

        it('should throw an error if the assigned bunk does not exist', async () => {
            authUtilStub.isManager.resolves(true);
            authUtilStub.getUserDoc.resolves({ data: { assignedBunkId: 'bunk-id' } });
            docStub.get.resolves({ exists: false });
            const wrapped = test.wrap(managerFunctions.getAssignedBunk);
            await assert.rejects(() => wrapped({}, { auth: { uid: 'manager-uid' } }), new Error('The assigned bunk does not exist.'));
        });

        it('should return the assigned bunk successfully', async () => {
            authUtilStub.isManager.resolves(true);
            authUtilStub.getUserDoc.resolves({ data: { assignedBunkId: 'bunk-id' } });
            const bunkData = { name: 'Test Bunk' };
            docStub.get.resolves({ exists: true, data: () => bunkData });
            const wrapped = test.wrap(managerFunctions.getAssignedBunk);

            const result = await wrapped({}, { auth: { uid: 'manager-uid' } });

            assert.deepStrictEqual(result, { status: 'success', bunk: { id: undefined, ...bunkData } });
        });
    });

    describe('getManagerTransactions', () => {
        it('should deny access if user is not a manager', async () => {
            authUtilStub.isManager.resolves(false);
            const wrapped = test.wrap(managerFunctions.getManagerTransactions);
            await assert.rejects(() => wrapped({}, { auth: { uid: 'some-uid' } }), new Error('Only managers can view their transactions.'));
        });

        it('should return an empty list if there are no transactions', async () => {
            authUtilStub.isManager.resolves(true);
            const wrapped = test.wrap(managerFunctions.getManagerTransactions);
            const result = await wrapped({}, { auth: { uid: 'manager-uid' } });
            assert.deepStrictEqual(result, { status: 'success', transactions: [] });
        });

        it('should return a list of transactions successfully', async () => {
            authUtilStub.isManager.resolves(true);
            const transactionsData = [
                { id: 'txn1', data: () => ({ type: 'add_points', amount: 100 }) },
                { id: 'txn2', data: () => ({ type: 'redeem_points', amount: 50 }) },
            ];
            const getStub = sinon.stub().resolves({ docs: transactionsData });
            const orderByStub = sinon.stub().returns({ get: getStub });
            firestoreServiceStub.collection.withArgs('transactions').returns({ 
                where: () => ({ orderBy: orderByStub })
            });

            const wrapped = test.wrap(managerFunctions.getManagerTransactions);
            const result = await wrapped({}, { auth: { uid: 'manager-uid' } });

            assert.deepStrictEqual(result, {
                status: 'success',
                transactions: [
                    { id: 'txn1', type: 'add_points', amount: 100 },
                    { id: 'txn2', type: 'redeem_points', amount: 50 },
                ]
            });
        });
    });
});
