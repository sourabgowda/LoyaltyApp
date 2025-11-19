
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';

class UserManagementScreen extends StatefulWidget {
  @override
  _UserManagementScreenState createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen> {
  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  Future<void> _updateUserRole(String uid, String newRole) async {
    // Show a loading indicator while the function is called
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return Center(child: CircularProgressIndicator());
      },
    );

    try {
      final callable = _functions.httpsCallable('setUserRole');
      final result = await callable.call({
        'targetUid': uid,
        'newRole': newRole,
      });

      Navigator.of(context).pop(); // Dismiss loading indicator

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(result.data['message'] ?? 'Role updated successfully.'),
        backgroundColor: Colors.green,
      ));
    } on FirebaseFunctionsException catch (e) {
      Navigator.of(context).pop(); // Dismiss loading indicator

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.message ?? 'An unknown error occurred.'),
        backgroundColor: Colors.red,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('User Management'),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('users').orderBy('firstName').snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return Center(child: CircularProgressIndicator());
          }

          final users = snapshot.data!.docs;

          return ListView.builder(
            itemCount: users.length,
            itemBuilder: (context, index) {
              final user = users[index];
              final userData = user.data() as Map<String, dynamic>;
              final String currentRole = userData['role'] ?? 'customer';

              return Card(
                margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                elevation: 2,
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${userData['firstName']} ${userData['lastName']}',
                        style: Theme.of(context).textTheme.headline6,
                      ),
                      SizedBox(height: 4),
                      Text(userData['phoneNumber'] ?? 'No phone number'),
                      SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Role:', style: TextStyle(fontWeight: FontWeight.bold)),
                          DropdownButton<String>(
                            value: currentRole,
                            underline: Container(),
                            items: ['customer', 'manager', 'admin']
                                .map((role) => DropdownMenuItem(
                                      value: role,
                                      child: Text(role.toUpperCase()),
                                    ))
                                .toList(),
                            onChanged: (String? newRole) {
                              if (newRole != null && newRole != currentRole) {
                                _updateUserRole(user.id, newRole);
                              }
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
