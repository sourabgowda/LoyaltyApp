
const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const test = require('firebase-functions-test')();

describe('User Functions', () => {
    let userFunctions, authUtilStub, validationStub, adminStub;
    let authServiceStub, firestoreServiceStub, docStub, collectionStub;

    beforeEach(() => {
        authUtilStub = {
            isAdmin: sinon.stub(),
            getUserDoc: sinon.stub(),
        };

        validationStub = {
            isValidFirstName: sinon.stub(),
            isValidLastName: sinon.stub(),
        };

        authServiceStub = {
            setCustomUserClaims: sinon.stub().resolves(),
            deleteUser: sinon.stub().resolves(),
            getUser: sinon.stub().resolves({ email: 'test@example.com' }),
        };

        docStub = {
            update: sinon.stub().resolves(),
            get: sinon.stub().resolves({ exists: true, data: () => ({ role: 'customer' }) }),
            set: sinon.stub().resolves(),
        };
        
        collectionStub = sinon.stub().returns({ doc: sinon.stub().returns(docStub) });

        firestoreServiceStub = { collection: collectionStub };

        const fieldValueStub = { serverTimestamp: () => 'MOCK_SERVER_TIMESTAMP' };

        adminStub = {
            auth: () => authServiceStub,
            firestore: Object.assign(() => firestoreServiceStub, { FieldValue: fieldValueStub }),
            initializeApp: sinon.stub(),
        };

        userFunctions = proxyquire('../user', {
            'firebase-admin': adminStub,
            './utils/auth': authUtilStub,
            './validation': validationStub,
        });
    });

    afterEach(() => {
        sinon.restore();
        test.cleanup();
    });

    describe('setUserRole', () => {
        it('should deny access if user is not an admin', async () => {
            authUtilStub.isAdmin.resolves(false);
            const wrapped = test.wrap(userFunctions.setUserRole);
            await assert.rejects(async () => await wrapped({ targetUid: 'another-uid', newRole: 'manager' }, { auth: { uid: 'some-uid' } }), new Error('Only admins can set user roles.'));
        });

        it('should throw an error for invalid arguments (missing role)', async () => {
            authUtilStub.isAdmin.resolves(true);
            const wrapped = test.wrap(userFunctions.setUserRole);
            await assert.rejects(async () => await wrapped({ targetUid: 'another-uid' }, { auth: { uid: 'admin-uid' } }), new Error('A valid targetUid and newRole are required.'));
        });

        it('should throw an error for invalid arguments (invalid role)', async () => {
            authUtilStub.isAdmin.resolves(true);
            const wrapped = test.wrap(userFunctions.setUserRole);
            await assert.rejects(async () => await wrapped({ targetUid: 'another-uid', newRole: 'invalid-role' }, { auth: { uid: 'admin-uid' } }), new Error('A valid targetUid and newRole are required.'));
        });

        it('should throw an error if target user not found', async () => {
            authUtilStub.isAdmin.resolves(true);
            authUtilStub.getUserDoc.resolves(null);
            const wrapped = test.wrap(userFunctions.setUserRole);
            await assert.rejects(async () => await wrapped({ targetUid: 'another-uid', newRole: 'manager' }, { auth: { uid: 'admin-uid' } }), new Error('The target user does not exist.'));
        });

        it('should set user role to admin successfully', async () => {
            authUtilStub.isAdmin.resolves(true);
            authUtilStub.getUserDoc.resolves({ exists: true });
            const wrapped = test.wrap(userFunctions.setUserRole);

            const result = await wrapped({ targetUid: 'another-uid', newRole: 'admin' }, { auth: { uid: 'admin-uid' } });

            assert.deepStrictEqual(result, { status: 'success', message: 'User role updated to admin.' });
            assert(authServiceStub.setCustomUserClaims.calledWith('another-uid', { admin: true }));
        });

        it('should set user role to manager successfully', async () => {
            authUtilStub.isAdmin.resolves(true);
            authUtilStub.getUserDoc.resolves({ exists: true });
            const wrapped = test.wrap(userFunctions.setUserRole);

            const result = await wrapped({ targetUid: 'another-uid', newRole: 'manager' }, { auth: { uid: 'admin-uid' } });

            assert.deepStrictEqual(result, { status: 'success', message: 'User role updated to manager.' });
            assert(authServiceStub.setCustomUserClaims.calledWith('another-uid', { manager: true }));
        });

        it('should set user role to customer successfully', async () => {
            authUtilStub.isAdmin.resolves(true);
            authUtilStub.getUserDoc.resolves({ exists: true });
            const wrapped = test.wrap(userFunctions.setUserRole);

            const result = await wrapped({ targetUid: 'another-uid', newRole: 'customer' }, { auth: { uid: 'admin-uid' } });

            assert.deepStrictEqual(result, { status: 'success', message: 'User role updated to customer.' });
            assert(authServiceStub.setCustomUserClaims.calledWith('another-uid', {}));
        });
    });

    describe('onUserCreate', () => {
        it('should update user verification status if email is verified and user doc exists', async () => {
            const user = { uid: 'test-uid', email: 'test@example.com', emailVerified: true };
            const specificDocStub = {
                get: sinon.stub().resolves({ exists: true }),
                update: sinon.stub().resolves(),
                set: sinon.stub().resolves(),
            };
            collectionStub.returns({ doc: sinon.stub().returns(specificDocStub) });
            const wrapped = test.wrap(userFunctions.onUserCreate);
            await wrapped(user);
            assert(specificDocStub.update.calledOnceWith({ isVerified: true }));
        });

        it('should not update if email is not verified', async () => {
            const user = { uid: 'test-uid', email: 'test@example.com', emailVerified: false };
            const specificDocStub = {
                get: sinon.stub(),
                update: sinon.stub(),
            };
            collectionStub.returns({ doc: sinon.stub().withArgs('test-uid').returns(specificDocStub) });
            const wrapped = test.wrap(userFunctions.onUserCreate);
            await wrapped(user);
            assert(specificDocStub.get.notCalled);
            assert(specificDocStub.update.notCalled);
        });

        it('should not update if user document does not exist', async () => {
            const user = { uid: 'test-uid', email: 'test@example.com', emailVerified: true };
            const specificDocStub = {
                get: sinon.stub().resolves({ exists: false }),
                update: sinon.stub(),
            };
            collectionStub.returns({ doc: sinon.stub().withArgs('test-uid').returns(specificDocStub) });
            const wrapped = test.wrap(userFunctions.onUserCreate);
            await wrapped(user);
            assert(specificDocStub.get.calledOnce);
            assert(specificDocStub.update.notCalled);
        });
    });

    describe('deleteUser', () => {
        it('should deny access if user is not an admin', async () => {
            authUtilStub.isAdmin.resolves(false);
            const wrapped = test.wrap(userFunctions.deleteUser);
            await assert.rejects(async () => await wrapped({ uid: 'another-uid' }, { auth: { uid: 'some-uid' } }), new Error('Only admins can delete users.'));
        });

        it('should throw an error if uid is missing', async () => {
            authUtilStub.isAdmin.resolves(true);
            const wrapped = test.wrap(userFunctions.deleteUser);
            await assert.rejects(async () => await wrapped({}, { auth: { uid: 'admin-uid' } }), new Error('UID is required.'));
        });

        it('should throw an error if user not found', async () => {
            authUtilStub.isAdmin.resolves(true);
            authServiceStub.getUser.throws({code: 'auth/user-not-found'});
            const wrapped = test.wrap(userFunctions.deleteUser);
            await assert.rejects(async () => await wrapped({ uid: 'user-to-delete' }, { auth: { uid: 'admin-uid' } }), new Error('User with UID user-to-delete not found.'));
        });

        it('should throw an internal error for any other deletion errors', async () => {
            authUtilStub.isAdmin.resolves(true);
            authServiceStub.getUser.throws(new Error('Internal error'));
            const wrapped = test.wrap(userFunctions.deleteUser);
            await assert.rejects(async () => await wrapped({ uid: 'user-to-delete' }, { auth: { uid: 'admin-uid' } }), new Error('Error deleting user.'));
        });

        it('should delete user successfully', async () => {
            authUtilStub.isAdmin.resolves(true);
            const wrapped = test.wrap(userFunctions.deleteUser);

            const result = await wrapped({ uid: 'user-to-delete' }, { auth: { uid: 'admin-uid' } });

            assert.deepStrictEqual(result, { status: 'success', message: 'User user-to-delete deleted successfully.'});
            assert(authServiceStub.deleteUser.calledWith('user-to-delete'));
        });
    });

    describe('updateUserProfile', () => {
        it('should throw an error if user is not authenticated', async () => {
            const wrapped = test.wrap(userFunctions.updateUserProfile);
            await assert.rejects(async () => await wrapped({ firstName: 'John' }, {}), new Error('You must be logged in to update your profile.'));
        });

        it('should throw an error if the user does not exist', async () => {
            authUtilStub.getUserDoc.resolves(null);
            const wrapped = test.wrap(userFunctions.updateUserProfile);
            await assert.rejects(async () => await wrapped({ firstName: 'John' }, { auth: { uid: 'some-uid' } }), new Error('The user does not exist.'));
        });

        it('should throw an error for invalid first name', async () => {
            authUtilStub.getUserDoc.resolves({ data: { role: 'customer' } });
            validationStub.isValidFirstName.returns(false);
            const wrapped = test.wrap(userFunctions.updateUserProfile);

            await assert.rejects(async () => await wrapped({ firstName: 'J' }, { auth: { uid: 'some-uid' } }), new Error('Invalid first name.'));
        });

        it('should throw an error for invalid last name', async () => {
            authUtilStub.getUserDoc.resolves({ data: { role: 'customer' } });
            validationStub.isValidLastName.returns(false);
            const wrapped = test.wrap(userFunctions.updateUserProfile);

            await assert.rejects(async () => await wrapped({ lastName: 'Doe%' }, { auth: { uid: 'some-uid' } }), new Error('Invalid last name.'));
        });

        it('should throw an error if no fields are provided', async () => {
            authUtilStub.getUserDoc.resolves({ data: { role: 'customer' } });
            const wrapped = test.wrap(userFunctions.updateUserProfile);

            await assert.rejects(async () => await wrapped({}, { auth: { uid: 'some-uid' } }), new Error('At least one field to update must be provided.'));
        });

        it('should update user profile successfully', async () => {
            authUtilStub.getUserDoc.resolves({ data: () => ({ role: 'customer' }) });
            validationStub.isValidFirstName.returns(true);
            validationStub.isValidLastName.returns(true);
            const wrapped = test.wrap(userFunctions.updateUserProfile);

            const result = await wrapped({ firstName: 'John', lastName: 'Doe'}, { auth: { uid: 'some-uid' } });

            assert.deepStrictEqual(result, { status: 'success', message: 'User profile updated successfully.' });
        });
    });
});
