import 'package:flutter/material.dart';
import 'package:cloud_functions/cloud_functions.dart';

class AdminScreen extends StatefulWidget {
  @override
  _AdminScreenState createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  final _creditPercent = TextEditingController();
  final _pointValue = TextEditingController();
  final _bunkName = TextEditingController();
  final _bunkLocation = TextEditingController();
  final _bunkDistrict = TextEditingController();
  final _bunkState = TextEditingController();
  final _bunkPincode = TextEditingController();
  bool _loading = false;

  Future<void> _updateConfig() async {
    setState(() => _loading = true);
    try {
      final callable = FirebaseFunctions.instance.httpsCallable('updateGlobalConfig');
      final data = {};
      if (_creditPercent.text.trim().isNotEmpty) data['creditPercentage'] = double.parse(_creditPercent.text.trim());
      if (_pointValue.text.trim().isNotEmpty) data['pointValue'] = double.parse(_pointValue.text.trim());
      final res = await callable.call({'updateData': data});
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res.data['message'] ?? 'Updated')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ' + e.toString())));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _createBunk() async {
    setState(() => _loading = true);
    try {
      final callable = FirebaseFunctions.instance.httpsCallable('createBunk'); // optional server function
      final bunk = {
        'name': _bunkName.text.trim(),
        'location': _bunkLocation.text.trim(),
        'district': _bunkDistrict.text.trim(),
        'state': _bunkState.text.trim(),
        'pincode': _bunkPincode.text.trim()
      };
      final res = await callable.call({'bunk': bunk});
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res.data['message'] ?? 'Created')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ' + e.toString())));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Admin')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            Text('Update Global Config', style: TextStyle(fontWeight: FontWeight.bold)),
            TextField(controller: _creditPercent, decoration: InputDecoration(labelText: 'Credit Percentage (0-100)')),
            TextField(controller: _pointValue, decoration: InputDecoration(labelText: 'Point Value (₹ per point)')),
            ElevatedButton(onPressed: _loading ? null : _updateConfig, child: Text('Update Config')),
            Divider(),
            Text('Create Bunk', style: TextStyle(fontWeight: FontWeight.bold)),
            TextField(controller: _bunkName, decoration: InputDecoration(labelText: 'Name')),
            TextField(controller: _bunkLocation, decoration: InputDecoration(labelText: 'Location')),
            TextField(controller: _bunkDistrict, decoration: InputDecoration(labelText: 'District')),
            TextField(controller: _bunkState, decoration: InputDecoration(labelText: 'State')),
            TextField(controller: _bunkPincode, decoration: InputDecoration(labelText: 'Pincode')),
            ElevatedButton(onPressed: _loading ? null : _createBunk, child: Text('Create Bunk')),
          ],
        ),
      ),
    );
  }
}
