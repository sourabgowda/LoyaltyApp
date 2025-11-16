import 'package:flutter/material.dart';
import 'package:cloud_functions/cloud_functions.dart';

class ManagerScreen extends StatefulWidget {
  @override
  _ManagerScreenState createState() => _ManagerScreenState();
}

class _ManagerScreenState extends State<ManagerScreen> {
  final _customerId = TextEditingController();
  final _amount = TextEditingController();
  final _pointsToRedeem = TextEditingController();
  bool _loading = false;

  Future<void> _credit() async {
    setState(() => _loading = true);
    try {
      final callable = FirebaseFunctions.instance.httpsCallable('creditPoints');
      final res = await callable.call({'customerId': _customerId.text.trim(), 'amountSpent': double.parse(_amount.text)});
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res.data['message'] ?? 'Success')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ' + e.toString())));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _redeem() async {
    setState(() => _loading = true);
    try {
      final callable = FirebaseFunctions.instance.httpsCallable('redeemPoints');
      final res = await callable.call({
        'customerId': _customerId.text.trim(),
        'pointsToRedeem': int.parse(_pointsToRedeem.text),
        'amountSpent': double.parse(_amount.text)
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res.data['message'] ?? 'Success')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ' + e.toString())));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Manager')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(controller: _customerId, decoration: InputDecoration(labelText: 'Customer UID')),
            TextField(controller: _amount, decoration: InputDecoration(labelText: 'Amount Spent (₹)')),
            SizedBox(height: 12),
            ElevatedButton(onPressed: _loading ? null : _credit, child: _loading ? CircularProgressIndicator() : Text('Credit Points')),
            Divider(),
            TextField(controller: _pointsToRedeem, decoration: InputDecoration(labelText: 'Points to Redeem')),
            ElevatedButton(onPressed: _loading ? null : _redeem, child: _loading ? CircularProgressIndicator() : Text('Redeem Points')),
          ],
        ),
      ),
    );
  }
}
