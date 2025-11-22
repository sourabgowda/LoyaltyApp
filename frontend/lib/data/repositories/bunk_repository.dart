import 'package:cloud_firestore/cloud_firestore.dart';
import '../../domain/models/bunk.dart';

class BunkRepository {
  final FirebaseFirestore _firestore;

  BunkRepository(this._firestore);

  Stream<List<Bunk>> getBunks() {
    return _firestore.collection('bunks').snapshots().map((snapshot) {
      return snapshot.docs.map((doc) => Bunk.fromJson(doc.data())).toList();
    });
  }

  Future<void> addBunk(Bunk bunk) {
    return _firestore.collection('bunks').doc(bunk.id).set(bunk.toJson());
  }
}
