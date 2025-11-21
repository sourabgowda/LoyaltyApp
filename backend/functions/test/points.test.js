
const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const test = require('firebase-functions-test')();

describe('Points Functions', () => {
    let pointsFunctions, authUtilStub, adminStub, firestoreServiceStub, runTransactionStub, txStub;

    beforeEach(() => {
        authUtilStub = { isManager: sinon.stub() };

        txStub = {
            get: sinon.stub(),
            update: sinon.stub(),
            set: sinon.stub(),
        };

        runTransactionStub = sinon.stub().callsFake(async (updateFunction) => updateFunction(txStub));

        const collectionStub = sinon.stub().returns({ doc: sinon.stub().returns({ ref: 'mockRef' }) });

        firestoreServiceStub = {
            collection: collectionStub,
            runTransaction: runTransactionStub,
        };

        adminStub = {
            firestore: Object.assign(() => firestoreServiceStub, {
                FieldValue: { serverTimestamp: () => 'MOCK_TIMESTAMP' },
            }),
            initializeApp: sinon.stub(),
        };

        pointsFunctions = proxyquire('../points', {
            'firebase-admin': adminStub,
            './utils/auth': authUtilStub,
        });
    });

    afterEach(() => {
        sinon.restore();
        test.cleanup();
    });

    describe('creditPoints', () => {
        it('should deny access if user is not a manager', async () => {
            authUtilStub.isManager.resolves(false);
            const wrapped = test.wrap(pointsFunctions.creditPoints);
            await assert.rejects(() => wrapped({}, { auth: { uid: 'u' } }), new Error('Only managers can credit points.'));
        });

        it('should prevent managers from crediting their own accounts', async () => {
            authUtilStub.isManager.resolves(true);
            const wrapped = test.wrap(pointsFunctions.creditPoints);
            const data = { customerId: 'manager-uid' };
            await assert.rejects(() => wrapped(data, { auth: { uid: 'manager-uid' } }), new Error('Managers cannot credit points to their own accounts.'));
        });

        it('should fail with invalid arguments', async () => {
            authUtilStub.isManager.resolves(true);
            const wrapped = test.wrap(pointsFunctions.creditPoints);
            await assert.rejects(() => wrapped({}, { auth: { uid: 'm' } }), new Error('Invalid arguments. Required: customerId, amountSpent, bunkId.'));
        });

        it('should fail with invalid amountSpent', async () => {
            authUtilStub.isManager.resolves(true);
            const wrapped = test.wrap(pointsFunctions.creditPoints);
            await assert.rejects(() => wrapped({ customerId: 'c', amountSpent: 0, bunkId: 'b' }, { auth: { uid: 'm' } }), new Error('Invalid arguments. Required: customerId, amountSpent, bunkId.'));
        });

        it('should fail with non-numeric amountSpent', async () => {
            authUtilStub.isManager.resolves(true);
            const wrapped = test.wrap(pointsFunctions.creditPoints);
            await assert.rejects(() => wrapped({ customerId: 'c', amountSpent: 'abc', bunkId: 'b' }, { auth: { uid: 'm' } }), new Error('Invalid arguments. Required: customerId, amountSpent, bunkId.'));
        });

        it('should handle missing documents in transaction', async () => {
            authUtilStub.isManager.resolves(true);
            txStub.get.resolves({ exists: false });
            const wrapped = test.wrap(pointsFunctions.creditPoints);
            const data = { customerId: 'c', amountSpent: 100, bunkId: 'b' };
            await assert.rejects(() => wrapped(data, { auth: { uid: 'm' } }), new Error('Manager, customer, or global config not found.'));
        });

        it('should fail if manager is not assigned to the bunk', async () => {
            authUtilStub.isManager.resolves(true);
            txStub.get.onFirstCall().resolves({ exists: true, data: () => ({ assignedBunkId: 'wrong-bunk' }) });
            txStub.get.onSecondCall().resolves({ exists: true, data: () => ({}) });
            txStub.get.onThirdCall().resolves({ exists: true, data: () => ({}) });
            const wrapped = test.wrap(pointsFunctions.creditPoints);
            await assert.rejects(() => wrapped({ customerId: 'c', amountSpent: 100, bunkId: 'b' }, { auth: { uid: 'm' } }), new Error('Manager is not assigned to this bunk.'));
        });

        it('should fail if customer is not verified', async () => {
            authUtilStub.isManager.resolves(true);
            txStub.get.onFirstCall().resolves({ exists: true, data: () => ({ assignedBunkId: 'b' }) });
            txStub.get.onSecondCall().resolves({ exists: true, data: () => ({ isVerified: false }) });
            txStub.get.onThirdCall().resolves({ exists: true, data: () => ({}) });
            const wrapped = test.wrap(pointsFunctions.creditPoints);
            await assert.rejects(() => wrapped({ customerId: 'c', amountSpent: 100, bunkId: 'b' }, { auth: { uid: 'm' } }), new Error('Customer not verified.'));
        });

        it('should fail if bunk is not found', async () => {
            authUtilStub.isManager.resolves(true);
            txStub.get.onFirstCall().resolves({ exists: true, data: () => ({ assignedBunkId: 'b' }) });
            txStub.get.onSecondCall().resolves({ exists: true, data: () => ({ isVerified: true }) });
            txStub.get.onThirdCall().resolves({ exists: true, data: () => ({ creditPercentage: 10 }) });
            txStub.get.onCall(3).resolves({ exists: false }); // Bunk does not exist
            const wrapped = test.wrap(pointsFunctions.creditPoints);
            await assert.rejects(() => wrapped({ customerId: 'c', amountSpent: 100, bunkId: 'b' }, { auth: { uid: 'm' } }), new Error('Bunk not found.'));
        });

        it('should fail if creditPercentage is invalid', async () => {
            authUtilStub.isManager.resolves(true);
            txStub.get.onFirstCall().resolves({ exists: true, data: () => ({ assignedBunkId: 'b' }) });
            txStub.get.onSecondCall().resolves({ exists: true, data: () => ({ isVerified: true }) });
            txStub.get.onThirdCall().resolves({ exists: true, data: () => ({ creditPercentage: -10 }) }); // Invalid percentage
            txStub.get.onCall(3).resolves({ exists: true, data: () => ({}) });
            const wrapped = test.wrap(pointsFunctions.creditPoints);
            await assert.rejects(() => wrapped({ customerId: 'c', amountSpent: 100, bunkId: 'b' }, { auth: { uid: 'm' } }), new Error('Invalid creditPercentage configured.'));
        });

        it('should fail if creditPercentage is non-numeric', async () => {
            authUtilStub.isManager.resolves(true);
            txStub.get.onFirstCall().resolves({ exists: true, data: () => ({ assignedBunkId: 'b' }) });
            txStub.get.onSecondCall().resolves({ exists: true, data: () => ({ isVerified: true }) });
            txStub.get.onThirdCall().resolves({ exists: true, data: () => ({ creditPercentage: 'abc' }) }); // Non-numeric percentage
            txStub.get.onCall(3).resolves({ exists: true, data: () => ({}) });
            const wrapped = test.wrap(pointsFunctions.creditPoints);
            await assert.rejects(() => wrapped({ customerId: 'c', amountSpent: 100, bunkId: 'b' }, { auth: { uid: 'm' } }), new Error('Invalid creditPercentage configured.'));
        });

        it('should fail if points to add is zero', async () => {
            authUtilStub.isManager.resolves(true);
            txStub.get.onFirstCall().resolves({ exists: true, data: () => ({ assignedBunkId: 'b' }) });
            txStub.get.onSecondCall().resolves({ exists: true, data: () => ({ isVerified: true }) });
            txStub.get.onThirdCall().resolves({ exists: true, data: () => ({ creditPercentage: 0.01 }) });
            txStub.get.onCall(3).resolves({ exists: true, data: () => ({}) });
            const wrapped = test.wrap(pointsFunctions.creditPoints);
            await assert.rejects(() => wrapped({ customerId: 'c', amountSpent: 10, bunkId: 'b' }, { auth: { uid: 'm' } }), new Error('Configured credit yields 0 points for this amount.'));
        });

        it('should credit points successfully', async () => {
            authUtilStub.isManager.resolves(true);

            const managerSnap = { exists: true, data: () => ({ assignedBunkId: 'bunk-id' }) };
            const customerSnap = { exists: true, data: () => ({ isVerified: true, points: 10 }), ref: 'customerRef' };
            const configSnap = { exists: true, data: () => ({ creditPercentage: '10' }) };
            const bunkSnap = { exists: true, data: () => ({ name: 'Test Bunk' }) };

            txStub.get.onFirstCall().resolves(managerSnap);
            txStub.get.onSecondCall().resolves(customerSnap);
            txStub.get.onThirdCall().resolves(configSnap);
            txStub.get.onCall(3).resolves(bunkSnap);

            const wrapped = test.wrap(pointsFunctions.creditPoints);
            const data = { customerId: 'customer-id', amountSpent: 150, bunkId: 'bunk-id' };
            const result = await wrapped(data, { auth: { uid: 'manager-uid' } });

            assert.strictEqual(result.status, 'success');
            assert.strictEqual(result.pointsAdded, 15);
            assert.strictEqual(result.newPoints, 25);
        });

    });

    describe('redeemPoints', () => {
        it('should deny access if user is not a manager', async () => {
            authUtilStub.isManager.resolves(false);
            const wrapped = test.wrap(pointsFunctions.redeemPoints);
            await assert.rejects(() => wrapped({}, { auth: { uid: 'u' } }), new Error('Only managers can redeem points.'));
        });

        it('should prevent managers from redeeming their own points', async () => {
            authUtilStub.isManager.resolves(true);
            const wrapped = test.wrap(pointsFunctions.redeemPoints);
            const data = { customerId: 'manager-uid' };
            await assert.rejects(() => wrapped(data, { auth: { uid: 'manager-uid' } }), new Error('Managers cannot redeem their own points.'));
        });

        it('should fail with invalid arguments', async () => {
            authUtilStub.isManager.resolves(true);
            const wrapped = test.wrap(pointsFunctions.redeemPoints);
            await assert.rejects(() => wrapped({ customerId: 'c', pointsToRedeem: 0, bunkId: 'b' }, { auth: { uid: 'm' } }), new Error('Invalid arguments. Required: customerId, pointsToRedeem, bunkId.'));
        });

        it('should fail with non-numeric pointsToRedeem', async () => {
            authUtilStub.isManager.resolves(true);
            const wrapped = test.wrap(pointsFunctions.redeemPoints);
            await assert.rejects(() => wrapped({ customerId: 'c', pointsToRedeem: 'abc', bunkId: 'b' }, { auth: { uid: 'm' } }), new Error('Invalid arguments. Required: customerId, pointsToRedeem, bunkId.'));
        });

        it('should handle missing documents in transaction', async () => {
            authUtilStub.isManager.resolves(true);
            txStub.get.resolves({ exists: false });
            const wrapped = test.wrap(pointsFunctions.redeemPoints);
            await assert.rejects(() => wrapped({ customerId: 'c', pointsToRedeem: 1, bunkId: 'b' }, { auth: { uid: 'm' } }), new Error('Manager, customer, or global config not found.'));
        });

        it('should fail if manager is not assigned to the bunk', async () => {
            authUtilStub.isManager.resolves(true);
            txStub.get.onFirstCall().resolves({ exists: true, data: () => ({ assignedBunkId: 'wrong-bunk' }) });
            txStub.get.onSecondCall().resolves({ exists: true, data: () => ({}) });
            txStub.get.onThirdCall().resolves({ exists: true, data: () => ({}) });
            const wrapped = test.wrap(pointsFunctions.redeemPoints);
            await assert.rejects(() => wrapped({ customerId: 'c', pointsToRedeem: 1, bunkId: 'b' }, { auth: { uid: 'm' } }), new Error('Manager is not assigned to this bunk.'));
        });

        it('should fail if customer is not verified', async () => {
            authUtilStub.isManager.resolves(true);
            txStub.get.onFirstCall().resolves({ exists: true, data: () => ({ assignedBunkId: 'b' }) });
            txStub.get.onSecondCall().resolves({ exists: true, data: () => ({ isVerified: false }) });
            txStub.get.onThirdCall().resolves({ exists: true, data: () => ({}) });
            const wrapped = test.wrap(pointsFunctions.redeemPoints);
            await assert.rejects(() => wrapped({ customerId: 'c', pointsToRedeem: 1, bunkId: 'b' }, { auth: { uid: 'm' } }), new Error('Customer not verified.'));
        });

        it('should fail if bunk is not found', async () => {
            authUtilStub.isManager.resolves(true);
            txStub.get.onFirstCall().resolves({ exists: true, data: () => ({ assignedBunkId: 'b' }) });
            txStub.get.onSecondCall().resolves({ exists: true, data: () => ({ isVerified: true, points: 100 }) });
            txStub.get.onThirdCall().resolves({ exists: true, data: () => ({ redemptionRate: 1 }) });
            txStub.get.onCall(3).resolves({ exists: false }); // Bunk does not exist
            const wrapped = test.wrap(pointsFunctions.redeemPoints);
            await assert.rejects(() => wrapped({ customerId: 'c', pointsToRedeem: 50, bunkId: 'b' }, { auth: { uid: 'm' } }), new Error('Bunk not found.'));
        });

        it('should fail if redemptionRate is invalid', async () => {
            authUtilStub.isManager.resolves(true);
            txStub.get.onFirstCall().resolves({ exists: true, data: () => ({ assignedBunkId: 'b' }) });
            txStub.get.onSecondCall().resolves({ exists: true, data: () => ({ isVerified: true, points: 100 }) });
            txStub.get.onThirdCall().resolves({ exists: true, data: () => ({ redemptionRate: 0 }) }); // Invalid rate
            txStub.get.onCall(3).resolves({ exists: true, data: () => ({}) });
            const wrapped = test.wrap(pointsFunctions.redeemPoints);
            await assert.rejects(() => wrapped({ customerId: 'c', pointsToRedeem: 50, bunkId: 'b' }, { auth: { uid: 'm' } }), new Error('Invalid redemptionRate configured.'));
        });

        it('should fail if redemptionRate is non-numeric', async () => {
            authUtilStub.isManager.resolves(true);
            txStub.get.onFirstCall().resolves({ exists: true, data: () => ({ assignedBunkId: 'b' }) });
            txStub.get.onSecondCall().resolves({ exists: true, data: () => ({ isVerified: true, points: 100 }) });
            txStub.get.onThirdCall().resolves({ exists: true, data: () => ({ redemptionRate: 'abc' }) }); // Non-numeric rate
            txStub.get.onCall(3).resolves({ exists: true, data: () => ({}) });
            const wrapped = test.wrap(pointsFunctions.redeemPoints);
            await assert.rejects(() => wrapped({ customerId: 'c', pointsToRedeem: 50, bunkId: 'b' }, { auth: { uid: 'm' } }), new Error('Invalid redemptionRate configured.'));
        });
        
        it('should fail if customer has insufficient points', async () => {
            authUtilStub.isManager.resolves(true);
            const managerSnap = { exists: true, data: () => ({ assignedBunkId: 'bunk-id' }) };
            const customerSnap = { exists: true, data: () => ({ isVerified: true, points: 50 }) }; // Has 50 points
            const configSnap = { exists: true, data: () => ({ redemptionRate: 1 }) };

            txStub.get.onFirstCall().resolves(managerSnap);
            txStub.get.onSecondCall().resolves(customerSnap);
            txStub.get.onThirdCall().resolves(configSnap);

            const wrapped = test.wrap(pointsFunctions.redeemPoints);
            const data = { customerId: 'c', pointsToRedeem: 100, bunkId: 'bunk-id' }; // Wants to redeem 100
            await assert.rejects(() => wrapped(data, { auth: { uid: 'm' } }), new Error('Insufficient points.'));
        });

        it('should redeem points successfully', async () => {
            authUtilStub.isManager.resolves(true);
            const managerSnap = { exists: true, data: () => ({ assignedBunkId: 'bunk-id' }) };
            const customerSnap = { exists: true, data: () => ({ isVerified: true, points: 200 }), ref: 'customerRef' };
            const configSnap = { exists: true, data: () => ({ redemptionRate: '1.5' }) };
            const bunkSnap = { exists: true, data: () => ({ name: 'Test Bunk' }) };

            txStub.get.onFirstCall().resolves(managerSnap);
            txStub.get.onSecondCall().resolves(customerSnap);
            txStub.get.onThirdCall().resolves(configSnap);
            txStub.get.onCall(3).resolves(bunkSnap);

            const wrapped = test.wrap(pointsFunctions.redeemPoints);
            const data = { customerId: 'customer-id', pointsToRedeem: 100, bunkId: 'bunk-id' };
            const result = await wrapped(data, { auth: { uid: 'manager-uid' } });

            assert.strictEqual(result.status, 'success');
            assert.strictEqual(result.redeemedValue, 150);
            assert.strictEqual(result.newPoints, 100);
        });
    });
});
