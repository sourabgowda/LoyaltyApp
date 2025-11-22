import 'package:cloud_firestore/cloud_firestore.dart';
import '../../domain/models/customer.dart';

class CustomerRepository {
  final FirebaseFirestore _firestore;

  CustomerRepository(this._firestore);

  Stream<List<Customer>> getCustomers() {
    return _firestore.collection('customers').snapshots().map((snapshot) {
      return snapshot.docs
          .map((doc) => Customer.fromJson(doc.data()))
          .toList();
    });
  }

  Future<void> addCustomer(Customer customer) {
    return _firestore
        .collection('customers')
        .doc(customer.id)
        .set(customer.toJson());
  }
}
