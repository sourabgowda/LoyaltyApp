const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Mock Firebase environment
const test = require('firebase-functions-test')();

// Mock sub-modules
const roles = require('../../roles');
const validation = require('../../lib/validation');

// Import the Cloud Function
const { updateGlobalConfig } = require('../../callable/admin');

describe('Admin', () => {

    let adminInitStub;

    before(() => {
        adminInitStub = sinon.stub(admin, 'initializeApp');
    });

    after(() => {
        adminInitStub.restore();
        test.cleanup();
    });

    describe('updateGlobalConfig', () => {
        let setStub, isAdminStub;

        beforeEach(() => {
            // Stubs for admin.firestore()
            setStub = sinon.stub().resolves();
            const docStub = sinon.stub().returns({ set: setStub });
            sinon.stub(admin.firestore(), 'collection').withArgs('configs').returns({ doc: docStub });

            // Stub for isAdmin
            isAdminStub = sinon.stub(roles, 'isAdmin');

            // Stub for validation
            sinon.stub(validation, 'isValidCreditPercentage').returns(true);
            sinon.stub(validation, 'isValidPointValue').returns(true);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('should allow an admin to update the global configuration', async () => {
            const context = { auth: { uid: 'adminUid' } };
            const data = { updateData: { creditPercentage: 15, pointValue: 0.75 } };

            isAdminStub.withArgs('adminUid').resolves(true);

            const result = await test.wrap(updateGlobalConfig)(data, context);

            expect(result.status).to.equal('success');
            expect(setStub.calledWith({ creditPercentage: 15, pointValue: 0.75 }, { merge: true })).to.be.true;
        });

    });
});