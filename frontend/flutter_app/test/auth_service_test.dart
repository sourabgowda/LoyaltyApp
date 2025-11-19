'''import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:loyalty_app/services/auth_service.dart';

// 1. MOCK CLASSES
// Mock FirebaseAuth
class MockFirebaseAuth extends Mock implements FirebaseAuth {}

// Mock FirebaseFunctions
class MockFirebaseFunctions extends Mock implements FirebaseFunctions {}

// Mock HttpsCallable
class MockHttpsCallable extends Mock implements HttpsCallable {}

// Mock HttpsCallableResult
class MockHttpsCallableResult extends Mock implements HttpsCallableResult {}

// Mock UserCredential
class MockUserCredential extends Mock implements UserCredential {}

void main() {
  // 2. TEST SETUP
  late AuthService authService;
  late MockFirebaseAuth mockAuth;
  late MockFirebaseFunctions mockFunctions;
  late MockHttpsCallable mockCallable;
  late MockHttpsCallableResult mockCallableResult;
  late MockUserCredential mockUserCredential;

  setUp(() {
    // Instantiate mocks before each test
    mockAuth = MockFirebaseAuth();
    mockFunctions = MockFirebaseFunctions();
    mockCallable = MockHttpsCallable();
    mockCallableResult = MockHttpsCallableResult();
    mockUserCredential = MockUserCredential();

    // Create an instance of AuthService with mocked dependencies
    authService = AuthService();

    // Stub the function callable
    when(mockFunctions.httpsCallable(any)).thenReturn(mockCallable);
  });

  // 3. TESTS
  group('AuthService', () {
    test('signIn calls FirebaseAuth.signInWithEmailAndPassword', () async {
      // Arrange
      const email = 'test@test.com';
      const password = 'password';
      when(mockAuth.signInWithEmailAndPassword(email: email, password: password))
          .thenAnswer((_) async => mockUserCredential);

      // Act
      final result = await authService.signIn(email, password);

      // Assert
      verify(mockAuth.signInWithEmailAndPassword(email: email, password: password));
      expect(result, isA<UserCredential>());
    });

    test('registerCustomer calls the correct Firebase Function', () async {
      // Arrange
      final userData = {'firstName': 'Test', 'lastName': 'User'};
      when(mockCallable.call(userData)).thenAnswer((_) async => mockCallableResult);

      // Act
      final result = await authService.registerCustomer(userData);

      // Assert
      verify(mockFunctions.httpsCallable('registerCustomer'));
      verify(mockCallable.call(userData));
      expect(result, isA<HttpsCallableResult>());
    });

    test('signOut calls FirebaseAuth.signOut', () async {
      // Arrange
      when(mockAuth.signOut()).thenAnswer((_) async => {});

      // Act
      await authService.signOut();

      // Assert
      verify(mockAuth.signOut());
    });
  });
}
''