import 'package:cloud_firestore/cloud_firestore.dart';
import '../../domain/models/manager.dart';

class ManagerRepository {
  final FirebaseFirestore _firestore;

  ManagerRepository(this._firestore);

  Stream<List<Manager>> getManagers() {
    return _firestore.collection('managers').snapshots().map((snapshot) {
      return snapshot.docs.map((doc) => Manager.fromJson(doc.data())).toList();
    });
  }

  Future<void> addManager(Manager manager) {
    return _firestore.collection('managers').doc(manager.id).set(manager.toJson());
  }
}
