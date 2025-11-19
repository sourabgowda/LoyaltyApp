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

// Import the Cloud Functions
const { registerCustomer, setUserRole } = require('../../callable/users');

describe('User Management', () => {

    let adminInitStub;

    before(() => {
        adminInitStub = sinon.stub(admin, 'initializeApp');
    });

    after(() => {
        adminInitStub.restore();
        test.cleanup();
    });

    describe('registerCustomer', () => {
        let createUserStub, collectionStub, docStub, setStub;

        beforeEach(() => {
            // Stubs for admin.auth() and admin.firestore()
            createUserStub = sinon.stub(admin.auth(), 'createUser');
            collectionStub = sinon.stub(admin.firestore(), 'collection');
            docStub = sinon.stub();
            setStub = sinon.stub();

            collectionStub.withArgs('users').returns({ doc: docStub });
            docStub.returns({ set: setStub });

            // Stubs for validation functions
            sinon.stub(validation, 'isValidFirstName').returns(true);
            sinon.stub(validation, 'isValidLastName').returns(true);
            sinon.stub(validation, 'isValidEmail').returns(true);
            sinon.stub(validation, 'isValidPassword').returns(true);
            sinon.stub(validation, 'isValidPhoneNumber').returns(true);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('should register a new customer successfully', async () => {
            const data = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: 'password123',
                phoneNumber: '1234567890'
            };

            createUserStub.resolves({ uid: 'testUid' });
            setStub.resolves();

            const result = await test.wrap(registerCustomer)(data, {});

            expect(result.status).to.equal('success');
            expect(result.userId).to.equal('testUid');
            expect(createUserStub.calledOnce).to.be.true;
            expect(setStub.calledOnce).to.be.true;
        });

    });

    describe('setUserRole', () => {
        let collectionStub, docStub, getStub, updateStub, setCustomUserClaimsStub, isAdminStub;

        beforeEach(() => {
            // Stubs for admin.firestore() and admin.auth()
            collectionStub = sinon.stub(admin.firestore(), 'collection');
            docStub = sinon.stub();
            getStub = sinon.stub();
            updateStub = sinon.stub();
            setCustomUserClaimsStub = sinon.stub(admin.auth(), 'setCustomUserClaims');

            collectionStub.withArgs('users').returns({ doc: docStub });
            docStub.returns({ get: getStub, update: updateStub });

            // Stub for isAdmin
            isAdminStub = sinon.stub(roles, 'isAdmin');

            // Stub for validation
            sinon.stub(validation, 'isValidRole').returns(true);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('should allow an admin to set a user role', async () => {
            const context = { auth: { uid: 'adminUid' } };
            const data = { targetUid: 'testUid', newRole: 'manager' };

            isAdminStub.withArgs('adminUid').resolves(true);
            getStub.resolves({ exists: true });
            updateStub.resolves();
            setCustomUserClaimsStub.resolves();

            const result = await test.wrap(setUserRole)(data, context);

            expect(result.status).to.equal('success');
            expect(setCustomUserClaimsStub.calledWith('testUid', { manager: true })).to.be.true;
            expect(updateStub.calledWith({ role: 'manager' })).to.be.true;
        });

    });
});