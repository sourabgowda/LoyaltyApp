import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'services/auth_service.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/manager_screen.dart';
import 'screens/admin_screen.dart';
import 'package:firebase_auth/firebase_auth.dart';

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
        theme: ThemeData(primarySwatch: Colors.blue),
        home: AuthWrapper(),
      ),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  @override
  _AuthWrapperState createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  User? user;
  Map<String, dynamic>? claims;

  @override
  void initState() {
    super.initState();
    FirebaseAuth.instance.authStateChanges().listen((u) async {
      setState(() => user = u);
      if (u != null) {
        final idToken = await u.getIdTokenResult(true);
        setState(() => claims = idToken.claims.cast<String, dynamic>());
      } else {
        setState(() => claims = null);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (user == null) return LoginScreen();
    // route based on claims
    if (claims != null && claims!['admin'] == true) {
      return AdminScreen();
    }
    if (claims != null && claims!['manager'] == true) {
      return ManagerScreen();
    }
    return DashboardScreen();
  }
}
