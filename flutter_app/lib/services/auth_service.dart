import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_functions/cloud_functions.dart';

class AuthService with ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  User? get currentUser => _auth.currentUser;

  Future<UserCredential> signIn(String email, String password) async {
    return await _auth.signInWithEmailAndPassword(email: email, password: password);
  }

  Future<UserCredential> register(String email, String password) async {
    return await _auth.createUserWithEmailAndPassword(email: email, password: password);
  }

  Future<HttpsCallableResult> registerCustomer(Map<String, dynamic> userData) async {
      final callable = _functions.httpsCallable('registerCustomer');
      return await callable.call(userData);
  }

  Future<HttpsCallableResult> sendOtp(String phoneNumber) async {
      final callable = _functions.httpsCallable('sendOtp');
      return await callable.call({'phoneNumber': phoneNumber});
  }

  Future<HttpsCallableResult> verifyOtp(String sessionId, String otp) async {
    final callable = _functions.httpsCallable('verifyOtp');
    return await callable.call({
      'sessionId': sessionId,
      'otp': otp,
    });
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }
}
