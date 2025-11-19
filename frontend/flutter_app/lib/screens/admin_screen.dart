
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import 'user_management_screen.dart';
import 'audit_trail_screen.dart';

class AdminScreen extends StatefulWidget {
  @override
  _AdminScreenState createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  final _creditPercentageCtrl = TextEditingController();
  final _pointValueCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;

  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  Future<void> _updateGlobalConfig() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() {
      _loading = true;
    });

    final updateData = {
      'creditPercentage': double.tryParse(_creditPercentageCtrl.text),
      'pointValue': double.tryParse(_pointValueCtrl.text),
    };

    try {
      final callable = _functions.httpsCallable('updateGlobalConfig');
      final result = await callable.call({'updateData': updateData});
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result.data['message']), backgroundColor: Colors.green),
      );
    } on FirebaseFunctionsException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.message}'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Admin Panel'),
        actions: [
          IconButton(
            icon: Icon(Icons.logout),
            onPressed: () => Provider.of<AuthService>(context, listen: false).signOut(),
          ),
        ],
      ),
      body: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance.collection('configs').doc('global').snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return Center(child: CircularProgressIndicator());
          }

          final config = snapshot.data!.data() as Map<String, dynamic>? ?? {};
          _creditPercentageCtrl.text = (config['creditPercentage'] ?? '').toString();
          _pointValueCtrl.text = (config['pointValue'] ?? '').toString();

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('System Configuration', style: Theme.of(context).textTheme.headline5),
                  SizedBox(height: 16),
                  TextFormField(
                    controller: _creditPercentageCtrl,
                    decoration: InputDecoration(
                      labelText: 'Credit Percentage (%)',
                      helperText: 'e.g., 1.5 for 1.5%',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.numberWithOptions(decimal: true),
                    validator: (value) {
                      final num? val = double.tryParse(value ?? '');
                      if (val == null || val < 0 || val > 100) {
                        return 'Must be a number between 0 and 100';
                      }
                      return null;
                    },
                  ),
                  SizedBox(height: 16),
                  TextFormField(
                    controller: _pointValueCtrl,
                    decoration: InputDecoration(
                      labelText: 'Point Value (in Rupees)',
                      helperText: 'e.g., 0.25 means 1 point = ₹0.25',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.numberWithOptions(decimal: true),
                    validator: (value) {
                      final num? val = double.tryParse(value ?? '');
                      if (val == null || val <= 0) {
                        return 'Must be a positive number';
                      }
                      return null;
                    },
                  ),
                  SizedBox(height: 24),
                  if (_loading)
                    Center(child: CircularProgressIndicator())
                  else
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        icon: Icon(Icons.save),
                        label: Text('Save Configuration'),
                        onPressed: _updateGlobalConfig,
                        style: ElevatedButton.styleFrom(padding: EdgeInsets.symmetric(vertical: 16)),
                      ),
                    ),
                  Divider(height: 40),
                  Text('User Management', style: Theme.of(context).textTheme.headline5),
                   SizedBox(height: 16),
                  SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        icon: Icon(Icons.people),
                        label: Text('Manage Users'),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => UserManagementScreen()),
                          );
                        },
                        style: ElevatedButton.styleFrom(padding: EdgeInsets.symmetric(vertical: 16)),
                      ),
                    ),
                    SizedBox(height: 16),
                  SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        icon: Icon(Icons.history),
                        label: Text('View Audit Trail'),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => AuditTrailScreen()),
                          );
                        },
                        style: ElevatedButton.styleFrom(padding: EdgeInsets.symmetric(vertical: 16)),
                      ),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
