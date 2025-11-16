
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import 'services/auth_service.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/manager_screen.dart';
import 'screens/admin_screen.dart';
import 'screens/otp_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthService(),
      child: MaterialApp(
        title: 'Loyalty App',
        theme: ThemeData(primarySwatch: Colors.deepPurple),
        home: AuthWrapper(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);
    return StreamBuilder<User?>(
      stream: auth.authStateChanges,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.active) {
          final User? user = snapshot.data;
          if (user == null) {
            return LoginScreen();
          }
          // If user is logged in, proceed to verification and role checks
          return VerificationWrapper(user: user);
        } else {
          return Scaffold(body: Center(child: CircularProgressIndicator()));
        }
      },
    );
  }
}

class VerificationWrapper extends StatelessWidget {
  final User user;

  const VerificationWrapper({Key? key, required this.user}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<DocumentSnapshot>(
      // Listen to the user's document in Firestore
      stream: FirebaseFirestore.instance.collection('users').doc(user.uid).snapshots(),
      builder: (context, snapshot) {
        // Show loading indicator while waiting for data
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Scaffold(body: Center(child: CircularProgressIndicator()));
        }

        // Handle cases where the user document might not exist
        if (!snapshot.hasData || !snapshot.data!.exists) {
          // This can happen if the user record is deleted from Firestore but auth record still exists.
          // Sending them to the login screen will allow them to re-authenticate.
          return LoginScreen(); 
        }

        final userData = snapshot.data!.data() as Map<String, dynamic>;

        // If the user's phone number is not verified, show the OTP screen
        if (userData['isVerified'] != true) {
          return OTPScreen(phoneNumber: userData['phoneNumber'], sessionId: 'resend');
        }

        // If verified, determine the user's role and show the appropriate screen
        return RoleWrapper(userData: userData);
      },
    );
  }
}

class RoleWrapper extends StatelessWidget {
  final Map<String, dynamic> userData;

  const RoleWrapper({Key? key, required this.userData}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final role = userData['role'];

    // Display the screen that corresponds to the user's role
    switch (role) {
      case 'admin':
        return AdminScreen();
      case 'manager':
        return ManagerScreen();
      case 'customer':
      default: // Default to customer dashboard
        return DashboardScreen();
    }
  }
}
