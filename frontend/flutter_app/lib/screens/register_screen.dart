import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';

class RegisterScreen extends StatefulWidget {
  @override
  _RegisterScreenState createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  bool _loading = false;

  void _register() async {
    setState(() => _loading = true);
    try {
      final auth = Provider.of<AuthService>(context, listen: false);

      final customerData = {
        'firstName': _firstName.text.trim(),
        'lastName': _lastName.text.trim(),
        'email': _emailCtrl.text.trim(),
        'password': _passCtrl.text.trim(),
      };

      await auth.registerCustomer(customerData);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Registration successful! Please check your email to verify your account.')),
      );

      Navigator.pop(context); // Go back to the login screen

    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
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
