
import 'package:flutter/material.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';

class OTPScreen extends StatefulWidget {
  final String phoneNumber;
  final String sessionId;

  OTPScreen({required this.phoneNumber, required this.sessionId});

  @override
  _OTPScreenState createState() => _OTPScreenState();
}

class _OTPScreenState extends State<OTPScreen> {
  final _otpController = TextEditingController();
  bool _loading = false;
  String? _currentSessionId;

  @override
  void initState() {
    super.initState();
    if (widget.sessionId != 'resend') {
      _currentSessionId = widget.sessionId;
    }
  }

  Future<void> _requestOtp() async {
    setState(() => _loading = true);
    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final result = await authService.sendOtp(widget.phoneNumber);
      if (result.data['status'] == 'success') {
        setState(() {
          _currentSessionId = result.data['sessionId'];
        });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('OTP sent successfully.')));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to send OTP.')));
      }
    } on FirebaseFunctionsException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${e.message}')));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _verifyOtp() async {
    if (_otpController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Please enter the OTP.')));
      return;
    }
    if (_currentSessionId == null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Please request an OTP first.')));
      return;
    }

    setState(() => _loading = true);
    try {
      final callable = FirebaseFunctions.instance.httpsCallable('verifyOtp');
      final result = await callable.call({
        'sessionId': _currentSessionId,
        'otp': _otpController.text,
      });

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result.data['message'])));

      if (result.data['status'] == 'success') {
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } on FirebaseFunctionsException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${e.message}')));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Verify Phone Number')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text('A verification code will be sent to your number: ${widget.phoneNumber}.'),
            SizedBox(height: 20),
            if (_currentSessionId != null)
              TextField(
                controller: _otpController,
                decoration: InputDecoration(labelText: 'OTP Code'),
                keyboardType: TextInputType.number,
              ),
            SizedBox(height: 20),
            if (_loading)
              CircularProgressIndicator()
            else
              Column(
                children: [
                  if (_currentSessionId != null)
                    ElevatedButton(
                      onPressed: _verifyOtp,
                      child: Text('Verify OTP'),
                    ),
                  SizedBox(height: 10),
                  TextButton(
                    onPressed: _requestOtp,
                    child: Text(_currentSessionId == null ? 'Send OTP' : 'Resend OTP'),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
