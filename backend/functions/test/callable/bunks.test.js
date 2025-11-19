const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const test = require('firebase-functions-test')();

const roles = require('../../roles');
let validation = require('../../lib/validation');

const { createBunk } = require('../../callable/bunks');

describe('Bunk Management', () => {

    let adminInitStub;

    before(() => {
        adminInitStub = sinon.stub(admin, 'initializeApp');
    });

    after(() => {
        adminInitStub.restore();
        test.cleanup();
    });

    describe('createBunk', () => {
        let collectionStub, addStub, isAdminStub;

        beforeEach(() => {
            collectionStub = sinon.stub(admin.firestore(), 'collection');
            addStub = sinon.stub();
            collectionStub.withArgs('bunks').returns({ add: addStub });

            isAdminStub = sinon.stub(roles, 'isAdmin');

            validation = sinon.stub(validation);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('should allow an admin to create a new bunk', async () => {
            const context = { auth: { uid: 'adminUid' } };
            const data = {
                name: 'Test Bunk',
                pincode: '123456',
                location: { latitude: 12.9716, longitude: 77.5946 }
            };

            isAdminStub.withArgs('adminUid').resolves(true);
            addStub.resolves({ id: 'bunk123' });

            const result = await test.wrap(createBunk)(data, context);

            expect(result.status).to.equal('success');
            expect(result.bunkId).to.equal('bunk123');
            expect(addStub.calledOnce).to.be.true;
        });

    });

});