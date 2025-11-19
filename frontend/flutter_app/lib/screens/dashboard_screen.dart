import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/auth_service.dart';

class DashboardScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final user = Provider.of<User?>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('Dashboard'),
        actions: [
          IconButton(
            icon: Icon(Icons.exit_to_app),
            onPressed: () => Provider.of<AuthService>(context, listen: false).signOut(),
          )
        ],
      ),
      body: user == null
          ? Center(child: CircularProgressIndicator())
          : StreamBuilder<DocumentSnapshot>(
              stream: FirebaseFirestore.instance.collection('users').doc(user.uid).snapshots(),
              builder: (context, snapshot) {
                if (!snapshot.hasData) return Center(child: CircularProgressIndicator());
                final userData = snapshot.data!.data() as Map<String, dynamic>;
                return Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Welcome, ${userData['firstName']}', style: Theme.of(context).textTheme.headline5),
                      SizedBox(height: 10),
                      Text('Points: ${userData['points']}', style: Theme.of(context).textTheme.headline6),
                      SizedBox(height: 20),
                      Text('Transaction History', style: Theme.of(context).textTheme.headline6),
                      Expanded(
                        child: StreamBuilder<QuerySnapshot>(
                          stream: FirebaseFirestore.instance
                              .collection('transactions')
                              .where('customerId', isEqualTo: user.uid)
                              .orderBy('timestamp', descending: true)
                              .snapshots(),
                          builder: (context, snapshot) {
                            if (!snapshot.hasData) return Center(child: CircularProgressIndicator());
                            final transactions = snapshot.data!.docs;
                            return ListView.builder(
                              itemCount: transactions.length,
                              itemBuilder: (context, index) {
                                final tx = transactions[index].data() as Map<String, dynamic>;
                                return ListTile(
                                  title: Text('${tx['type']}'),
                                  subtitle: Text('Points: ${tx['pointsChange']}'),
                                  trailing: Text(tx['amountSpent'] != null ? '\$${tx['amountSpent']}' : ''),
                                );
                              },
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
