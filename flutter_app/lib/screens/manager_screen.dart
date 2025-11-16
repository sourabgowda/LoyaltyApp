import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import 'package:cloud_functions/cloud_functions.dart';

class ManagerScreen extends StatefulWidget {
  @override
  _ManagerScreenState createState() => _ManagerScreenState();
}

class _ManagerScreenState extends State<ManagerScreen> {
  final _customerIdCtrl = TextEditingController();
  final _amountSpentCtrl = TextEditingController();
  final _pointsToRedeemCtrl = TextEditingController();
  bool _loading = false;

  Future<void> _creditPoints() async {
    if (_customerIdCtrl.text.isEmpty || _amountSpentCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Please fill all fields for crediting points.')));
      return;
    }
    setState(() => _loading = true);
    try {
      final callable = FirebaseFunctions.instance.httpsCallable('creditPoints');
      final result = await callable.call({
        'customerId': _customerIdCtrl.text,
        'amountSpent': double.parse(_amountSpentCtrl.text),
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result.data['message'])));
    } on FirebaseFunctionsException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${e.message}')));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _redeemPoints() async {
    if (_customerIdCtrl.text.isEmpty || _pointsToRedeemCtrl.text.isEmpty || _amountSpentCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Please fill customer ID, amount spent and points to redeem.')));
      return;
    }
    setState(() => _loading = true);
    try {
      final callable = FirebaseFunctions.instance.httpsCallable('redeemPoints');
      final result = await callable.call({
        'customerId': _customerIdCtrl.text,
        'pointsToRedeem': int.parse(_pointsToRedeemCtrl.text),
        'amountSpent': double.parse(_amountSpentCtrl.text),
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result.data['message'])));
    } on FirebaseFunctionsException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${e.message}')));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Manager Dashboard'),
        actions: [
          IconButton(
            icon: Icon(Icons.exit_to_app),
            onPressed: () => Provider.of<AuthService>(context, listen: false).signOut(),
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: SingleChildScrollView(
          child: Column(
            children: [
              Text('Credit Points', style: Theme.of(context).textTheme.headline6),
              TextField(controller: _customerIdCtrl, decoration: InputDecoration(labelText: 'Customer ID')),
              TextField(controller: _amountSpentCtrl, decoration: InputDecoration(labelText: 'Amount Spent'), keyboardType: TextInputType.number),
              SizedBox(height: 10),
              ElevatedButton(onPressed: _loading ? null : _creditPoints, child: _loading ? CircularProgressIndicator() : Text('Credit Points')),
              SizedBox(height: 30),
              Text('Redeem Points', style: Theme.of(context).textTheme.headline6),
              TextField(controller: _pointsToRedeemCtrl, decoration: InputDecoration(labelText: 'Points to Redeem'), keyboardType: TextInputType.number),
              SizedBox(height: 10),
              ElevatedButton(onPressed: _loading ? null : _redeemPoints, child: _loading ? CircularProgressIndicator() : Text('Redeem Points')),
            ],
          ),
        ),
      ),
    );
  }
}
