import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../services/auth_service.dart';
import 'register_screen.dart';
import 'otp_screen.dart'; // Import the OTP screen

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;

  void _login() async {
    setState(() => _loading = true);
    try {
      final auth = Provider.of<AuthService>(context, listen: false);
      final cred = await auth.signIn(_emailCtrl.text.trim(), _passCtrl.text.trim());

      // After successful login, check if the user is verified.
      final userDoc = await FirebaseFirestore.instance.collection('users').doc(cred.user!.uid).get();

      if (userDoc.exists) {
        final isVerified = userDoc.data()!['isVerified'] ?? false;
        if (!isVerified) {
          // If not verified, start the OTP flow.
          final phoneNumber = userDoc.data()!['phoneNumber'];
          final otpResult = await auth.sendOtp(phoneNumber);
          final sessionId = otpResult.data['sessionId'];

          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => OTPScreen(
                phoneNumber: phoneNumber,
                sessionId: sessionId,
              ),
            ),
          );
        } 
        // If verified, the auth state change will handle navigation to the dashboard.

      } else {
         throw Exception('User profile not found.');
      }

    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Login')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(children: [
          TextField(controller: _emailCtrl, decoration: InputDecoration(labelText: 'Email')),
          TextField(controller: _passCtrl, decoration: InputDecoration(labelText: 'Password'), obscureText: true),
          SizedBox(height: 20),
          ElevatedButton(onPressed: _loading ? null : _login, child: _loading ? CircularProgressIndicator() : Text('Login')),
          TextButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => RegisterScreen())), child: Text('Register'))
        ]),
      ),
    );
  }
}
