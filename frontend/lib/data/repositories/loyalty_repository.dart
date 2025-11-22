import 'package:cloud_firestore/cloud_firestore.dart';
import '../../domain/models/loyalty.dart';

class LoyaltyRepository {
  final FirebaseFirestore _firestore;

  LoyaltyRepository(this._firestore);

  Stream<Loyalty?> getLoyalty(String customerId) {
    return _firestore
        .collection('loyalty')
        .doc(customerId)
        .snapshots()
        .map((doc) => doc.exists ? Loyalty.fromJson(doc.data()!) : null);
  }

  Future<void> updateLoyalty(Loyalty loyalty) {
    return _firestore
        .collection('loyalty')
        .doc(loyalty.customerId)
        .set(loyalty.toJson());
  }
}
