
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

class AuditTrailScreen extends StatelessWidget {
  final DateFormat _formatter = DateFormat('yyyy-MM-dd HH:mm');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Audit Trail'),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('transactions')
            .orderBy('timestamp', descending: true)
            .snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return Center(child: CircularProgressIndicator());
          }

          final transactions = snapshot.data!.docs;

          return ListView.builder(
            itemCount: transactions.length,
            itemBuilder: (context, index) {
              final tx = transactions[index].data() as Map<String, dynamic>;
              final timestamp = tx['timestamp'] as Timestamp?;
              final date = timestamp?.toDate();
              final formattedDate = date != null ? _formatter.format(date) : 'No date';

              return Card(
                margin: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: ListTile(
                  title: Text('${tx['type'].toUpperCase()}'),
                  subtitle: Text('Date: $formattedDate'),
                  trailing: Text( _getTrailingText(tx) ),
                ),
              );
            },
          );
        },
      ),
    );
  }

    String _getTrailingText(Map<String, dynamic> tx) {
    switch (tx['type']) {
      case 'credit':
        return '+${tx['pointsChange']} points';
      case 'redeem':
        return '${tx['pointsChange']} points';
      case 'config_update':
        return 'Config Changed';
      default:
        return '';
    }
  }
}
