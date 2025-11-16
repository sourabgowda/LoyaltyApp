import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';

class DashboardScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);
    final user = auth.currentUser;
    return Scaffold(
      appBar: AppBar(title: Text('Dashboard'), actions: [IconButton(icon: Icon(Icons.logout), onPressed: () => auth.signOut())]),
      body: Center(child: Text('Welcome ${user?.email ?? ''}')),
    );
  }
}
