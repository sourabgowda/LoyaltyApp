import 'package:cloud_firestore/cloud_firestore.dart';
import '../../domain/models/sale.dart';

class SaleRepository {
  final FirebaseFirestore _firestore;

  SaleRepository(this._firestore);

  Stream<List<Sale>> getSales(String bunkId) {
    return _firestore
        .collection('bunks')
        .doc(bunkId)
        .collection('sales')
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) => Sale.fromJson(doc.data())).toList();
    });
  }

  Future<void> addSale(String bunkId, Sale sale) {
    return _firestore
        .collection('bunks')
        .doc(bunkId)
        .collection('sales')
        .doc(sale.id)
        .set(sale.toJson());
  }
}
