
const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const test = require('firebase-functions-test')();

describe('Customer Functions', () => {
    let customerFunctions, validationStub, adminStub, authServiceStub, firestoreServiceStub, docStub;

    beforeEach(() => {
        validationStub = {
            isValidFirstName: sinon.stub(),
            isValidLastName: sinon.stub(),
            isValidEmail: sinon.stub(),
            isValidPassword: sinon.stub(),
        };

        authServiceStub = {
            createUser: sinon.stub(),
        };

        docStub = {
            set: sinon.stub().resolves(),
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
            auth: () => authServiceStub,
            firestore: () => firestoreServiceStub,
            initializeApp: sinon.stub(),
        };

        customerFunctions = proxyquire('../customer', {
            'firebase-admin': adminStub,
            './validation': validationStub,
        });
    });

    afterEach(() => {
        sinon.restore();
        test.cleanup();
    });

    describe('registerCustomer', () => {
        it('should throw an error for missing required fields', async () => {
            const wrapped = test.wrap(customerFunctions.registerCustomer);
            await assert.rejects(() => wrapped({}), new Error('Missing required fields.'));
        });

        it('should throw an error for an invalid first name', async () => {
            validationStub.isValidFirstName.returns(false);
            const wrapped = test.wrap(customerFunctions.registerCustomer);
            await assert.rejects(() => wrapped({ firstName: 'a', lastName: 'b', email: 'c@d.com', password: '123456' }), new Error('First name must be 1-40 characters long and contain no spaces.'));
        });

        it('should throw an error for an invalid last name', async () => {
            validationStub.isValidFirstName.returns(true);
            validationStub.isValidLastName.returns(false);
            const wrapped = test.wrap(customerFunctions.registerCustomer);
            await assert.rejects(() => wrapped({ firstName: 'a', lastName: 'b', email: 'c@d.com', password: '123456' }), new Error('Last name must be 1-80 characters long and can have up to two spaces.'));
        });

        it('should throw an error for an invalid email', async () => {
            validationStub.isValidFirstName.returns(true);
            validationStub.isValidLastName.returns(true);
            validationStub.isValidEmail.returns(false);
            const wrapped = test.wrap(customerFunctions.registerCustomer);
            await assert.rejects(() => wrapped({ firstName: 'a', lastName: 'b', email: 'c@d.com', password: '123456' }), new Error('Invalid email format.'));
        });

        it('should throw an error for an invalid password', async () => {
            validationStub.isValidFirstName.returns(true);
            validationStub.isValidLastName.returns(true);
            validationStub.isValidEmail.returns(true);
            validationStub.isValidPassword.returns(false);
            const wrapped = test.wrap(customerFunctions.registerCustomer);
            await assert.rejects(() => wrapped({ firstName: 'a', lastName: 'b', email: 'c@d.com', password: '123' }), new Error('Password must be at least 6 characters long.'));
        });

        it('should throw an error for email already in use', async () => {
            validationStub.isValidFirstName.returns(true);
            validationStub.isValidLastName.returns(true);
            validationStub.isValidEmail.returns(true);
            validationStub.isValidPassword.returns(true);
            authServiceStub.createUser.rejects({ code: 'auth/email-already-exists' });
            const wrapped = test.wrap(customerFunctions.registerCustomer);
            await assert.rejects(() => wrapped({ firstName: 'a', lastName: 'b', email: 'c@d.com', password: '123456' }), new Error('The email address is already in use by another account.'));
        });

        it('should throw an internal error for unexpected issues', async () => {
            validationStub.isValidFirstName.returns(true);
            validationStub.isValidLastName.returns(true);
            validationStub.isValidEmail.returns(true);
            validationStub.isValidPassword.returns(true);
            authServiceStub.createUser.rejects(new Error('Unexpected error'));
            const wrapped = test.wrap(customerFunctions.registerCustomer);
            await assert.rejects(() => wrapped({ firstName: 'a', lastName: 'b', email: 'c@d.com', password: '123456' }), new Error('An unexpected error occurred.'));
        });

        it('should register a customer successfully', async () => {
            validationStub.isValidFirstName.returns(true);
            validationStub.isValidLastName.returns(true);
            validationStub.isValidEmail.returns(true);
            validationStub.isValidPassword.returns(true);
            authServiceStub.createUser.resolves({ uid: 'new-customer-uid' });
            const wrapped = test.wrap(customerFunctions.registerCustomer);

            const result = await wrapped({ firstName: 'a', lastName: 'b', email: 'c@d.com', password: '123456' });

            assert.deepStrictEqual(result, { status: 'success', message: 'Customer registered successfully.', uid: 'new-customer-uid' });
        });
    });

    describe('getCustomerProfile', () => {
        it('should require authentication', async () => {
            const wrapped = test.wrap(customerFunctions.getCustomerProfile);
            await assert.rejects(() => wrapped({}, {}), new Error('You must be logged in to view your profile.'));
        });

        it('should throw an error if profile not found', async () => {
            docStub.get.resolves({ exists: false });
            const wrapped = test.wrap(customerFunctions.getCustomerProfile);
            await assert.rejects(() => wrapped({}, { auth: { uid: 'customer-uid' } }), new Error('Your user profile was not found.'));
        });

        it('should return the customer profile successfully', async () => {
            const profileData = { firstName: 'John', lastName: 'Doe' };
            docStub.get.resolves({ exists: true, data: () => profileData });
            const wrapped = test.wrap(customerFunctions.getCustomerProfile);

            const result = await wrapped({}, { auth: { uid: 'customer-uid' } });

            assert.deepStrictEqual(result, { status: 'success', profile: profileData });
        });
    });

    describe('getCustomerTransactions', () => {
        it('should require authentication', async () => {
            const wrapped = test.wrap(customerFunctions.getCustomerTransactions);
            await assert.rejects(() => wrapped({}, {}), new Error('You must be logged in to view your transactions.'));
        });

        it('should return an empty list if no transactions are found', async () => {
            const wrapped = test.wrap(customerFunctions.getCustomerTransactions);
            const result = await wrapped({}, { auth: { uid: 'customer-uid' } });

            assert.deepStrictEqual(result, { status: 'success', transactions: [] });
        });

        it('should return a list of transactions successfully', async () => {
            const transactionsData = [
                { id: 'txn1', data: () => ({ type: 'add_points', amount: 100 }) },
                { id: 'txn2', data: () => ({ type: 'redeem_points', amount: 50 }) },
            ];
            const getStub = sinon.stub().resolves({ docs: transactionsData });
            const orderByStub = sinon.stub().returns({ get: getStub });
            firestoreServiceStub.collection.withArgs('transactions').returns({ 
                where: () => ({ orderBy: orderByStub })
            });
            
            const wrapped = test.wrap(customerFunctions.getCustomerTransactions);
            const result = await wrapped({}, { auth: { uid: 'customer-uid' } });

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
