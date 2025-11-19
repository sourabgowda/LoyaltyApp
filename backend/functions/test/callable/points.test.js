const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Mock Firebase environment
const test = require('firebase-functions-test')();

// Mock sub-modules
const roles = require('../../roles');

// Import the Cloud Functions
const { creditPoints, redeemPoints } = require('../../callable/points');

describe('Points Management', () => {

    let adminInitStub, runTransactionStub;

    before(() => {
        adminInitStub = sinon.stub(admin, 'initializeApp');
    });

    after(() => {
        adminInitStub.restore();
        test.cleanup();
    });

    beforeEach(() => {
        runTransactionStub = sinon.stub(admin.firestore(), 'runTransaction');
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('creditPoints', () => {
        let isManagerStub;

        beforeEach(() => {
            isManagerStub = sinon.stub(roles, 'isManager');
        });

        it('should allow a manager to credit points to a customer', async () => {
            const context = { auth: { uid: 'managerUid' } };
            const data = { customerId: 'customerUid', amountSpent: 100 };

            isManagerStub.withArgs('managerUid').resolves(true);

            runTransactionStub.callsFake(async (updateFunction) => {
                const tx = { get: sinon.stub(), update: sinon.stub(), set: sinon.stub() };
                tx.get.withArgs(sinon.match.any).resolves({ exists: true, data: () => ({ assignedBunkId: 'bunk1', isVerified: true, points: 0, creditPercentage: 10 }) });
                await updateFunction(tx);
                return { newPoints: 10 };
            });

            const result = await test.wrap(creditPoints)(data, context);

            expect(result.newPoints).to.equal(10);
            expect(isManagerStub.calledOnce).to.be.true;
            expect(runTransactionStub.calledOnce).to.be.true;
        });

    });

    describe('redeemPoints', () => {
        let isManagerStub;

        beforeEach(() => {
            isManagerStub = sinon.stub(roles, 'isManager');
        });

        it('should allow a manager to redeem points for a customer', async () => {
            const context = { auth: { uid: 'managerUid' } };
            const data = { customerId: 'customerUid', pointsToRedeem: 50 };

            isManagerStub.withArgs('managerUid').resolves(true);

            runTransactionStub.callsFake(async (updateFunction) => {
                const tx = { get: sinon.stub(), update: sinon.stub(), set: sinon.stub() };
                tx.get.withArgs(sinon.match.any).resolves({ exists: true, data: () => ({ isVerified: true, points: 100, pointValue: 0.5 }) });
                await updateFunction(tx);
                return { newPoints: 50, redeemedValue: 25 };
            });

            const result = await test.wrap(redeemPoints)(data, context);

            expect(result.newPoints).to.equal(50);
            expect(result.redeemedValue).to.equal(25);
            expect(isManagerStub.calledOnce).to.be.true;
            expect(runTransactionStub.calledOnce).to.be.true;
        });

    });

});