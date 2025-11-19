const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Mock Firebase environment
const test = require('firebase-functions-test')();

// Import the Cloud Function
const { onUserCreate } = require('../../triggers/users');

describe('User Triggers', () => {

    let adminInitStub;

    before(() => {
        adminInitStub = sinon.stub(admin, 'initializeApp');
    });

    after(() => {
        adminInitStub.restore();
        test.cleanup();
    });

    describe('onUserCreate', () => {
        let collectionStub, docStub, getStub, updateStub;

        beforeEach(() => {
            // Stubs for admin.firestore()
            collectionStub = sinon.stub(admin.firestore(), 'collection');
            docStub = sinon.stub();
            getStub = sinon.stub();
            updateStub = sinon.stub();

            collectionStub.withArgs('users').returns({ doc: docStub });
            docStub.returns({ get: getStub, update: updateStub });
        });

        afterEach(() => {
            sinon.restore();
        });

        it('should update the user document when a verified user is created', async () => {
            const user = {
                uid: 'testUid',
                email: 'test@example.com',
                emailVerified: true
            };

            getStub.resolves({ exists: true });
            updateStub.resolves();

            await test.wrap(onUserCreate)(user);

            expect(updateStub.calledWith({ isVerified: true })).to.be.true;
        });

    });

});