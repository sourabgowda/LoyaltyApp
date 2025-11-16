import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class RegisterScreen extends StatefulWidget {
  @override
  _RegisterScreenState createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _phone = TextEditingController();
  bool _loading = false;

  void _register() async {
    setState(() => _loading = true);
    try {
      final auth = Provider.of<AuthService>(context, listen: false);
      final cred = await auth.register(_emailCtrl.text.trim(), _passCtrl.text.trim());
      final profile = {
        'firstName': _firstName.text.trim(),
        'lastName': _lastName.text.trim(),
        'phoneNumber': _phone.text.trim(),
        'isManager': false,
        'isAdmin': false,
        'isVerified': true,
        'points': 0,
        'assignedBunkId': 'NA',
      };
      await FirebaseFirestore.instance.collection('users').doc(cred.user!.uid).set(profile);
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Register')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: SingleChildScrollView(
          child: Column(children: [
            TextField(controller: _firstName, decoration: InputDecoration(labelText: 'First Name')),
            TextField(controller: _lastName, decoration: InputDecoration(labelText: 'Last Name')),
            TextField(controller: _phone, decoration: InputDecoration(labelText: 'Phone Number')),
            TextField(controller: _emailCtrl, decoration: InputDecoration(labelText: 'Email')),
            TextField(controller: _passCtrl, decoration: InputDecoration(labelText: 'Password'), obscureText: true),
            SizedBox(height: 20),
            ElevatedButton(onPressed: _loading ? null : _register, child: _loading ? CircularProgressIndicator() : Text('Register'))
          ]),
        ),
      ),
    );
  }
}
