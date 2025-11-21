
const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const test = require('firebase-functions-test')();

describe('Config Functions', () => {
    let configFunctions, authUtilStub, adminStub, firestoreServiceStub;

    beforeEach(() => {
        authUtilStub = { isAdmin: sinon.stub() };

        const setStub = sinon.stub();
        const docStub = sinon.stub().returns({ set: setStub });
        const collectionStub = sinon.stub().returns({ doc: docStub });

        firestoreServiceStub = {
            collection: collectionStub,
            FieldValue: { serverTimestamp: () => 'MOCK_TIMESTAMP' },
        };

        adminStub = {
            firestore: Object.assign(() => firestoreServiceStub, {
                FieldValue: { serverTimestamp: () => 'MOCK_TIMESTAMP' },
            }),
            initializeApp: sinon.stub(),
        };

        configFunctions = proxyquire('../config', {
            'firebase-admin': adminStub,
            './utils/auth': authUtilStub,
        });
    });

    afterEach(() => {
        sinon.restore();
        test.cleanup();
    });

    describe('updateGlobalConfig', () => {
        it('should deny access if user is not an admin', async () => {
            authUtilStub.isAdmin.resolves(false);
            const wrapped = test.wrap(configFunctions.updateGlobalConfig);
            await assert.rejects(() => wrapped({}, { auth: { token: 't' } }), new Error('Only admins can update global configuration.'));
        });

        it('should fail with invalid arguments', async () => {
            authUtilStub.isAdmin.resolves(true);
            const wrapped = test.wrap(configFunctions.updateGlobalConfig);
            await assert.rejects(() => wrapped({}, { auth: { uid: 'a' } }), new Error('updateData object is required.'));
        });

        it('should fail with invalid creditPercentage', async () => {
            authUtilStub.isAdmin.resolves(true);
            const wrapped = test.wrap(configFunctions.updateGlobalConfig);
            const data = { updateData: { creditPercentage: 101 } };
            await assert.rejects(() => wrapped(data, { auth: { uid: 'a' } }), new Error('creditPercentage must be a number between 0 and 100.'));
        });

        it('should fail with non-numeric creditPercentage', async () => {
            authUtilStub.isAdmin.resolves(true);
            const wrapped = test.wrap(configFunctions.updateGlobalConfig);
            const data = { updateData: { creditPercentage: 'not-a-number' } };
            await assert.rejects(() => wrapped(data, { auth: { uid: 'a' } }), new Error('creditPercentage must be a number between 0 and 100.'));
        });

        it('should update global config successfully with creditPercentage at 0', async () => {
            authUtilStub.isAdmin.resolves(true);
            const wrapped = test.wrap(configFunctions.updateGlobalConfig);
            const data = { updateData: { creditPercentage: 0 } };
            const result = await wrapped(data, { auth: { uid: 'admin-uid' } });
            assert.strictEqual(result.status, 'success');
        });

        it('should update global config successfully with creditPercentage at 100', async () => {
            authUtilStub.isAdmin.resolves(true);
            const wrapped = test.wrap(configFunctions.updateGlobalConfig);
            const data = { updateData: { creditPercentage: 100 } };
            const result = await wrapped(data, { auth: { uid: 'admin-uid' } });
            assert.strictEqual(result.status, 'success');
        });

        it('should update global config successfully with an empty updateData object', async () => {
            authUtilStub.isAdmin.resolves(true);
            const wrapped = test.wrap(configFunctions.updateGlobalConfig);
            const data = { updateData: {} };
            const result = await wrapped(data, { auth: { uid: 'admin-uid' } });
            assert.strictEqual(result.status, 'success');
        });

        it('should update global config successfully with other valid fields', async () => {
            authUtilStub.isAdmin.resolves(true);
            const wrapped = test.wrap(configFunctions.updateGlobalConfig);
            const data = { updateData: { otherField: 'some-value' } };
            const result = await wrapped(data, { auth: { uid: 'admin-uid' } });
            assert.strictEqual(result.status, 'success');
        });

        it('should update global config successfully', async () => {
            authUtilStub.isAdmin.resolves(true);
            const wrapped = test.wrap(configFunctions.updateGlobalConfig);
            const data = { updateData: { creditPercentage: 10 } };
            const result = await wrapped(data, { auth: { uid: 'admin-uid' } });

            assert.strictEqual(result.status, 'success');
            assert.strictEqual(result.message, 'Global configuration updated.');
        });
    });
});
