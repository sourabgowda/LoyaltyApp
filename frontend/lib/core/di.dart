import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/repositories/auth_repository.dart';
import '../data/repositories/bunk_repository.dart';
import '../data/repositories/customer_repository.dart';
import '../data/repositories/loyalty_repository.dart';
import '../data/repositories/manager_repository.dart';
import '../data/repositories/sale_repository.dart';
import '../data/repositories/user_repository.dart';

// Firebase
final firebaseAuthProvider = Provider((ref) => FirebaseAuth.instance);
final firestoreProvider = Provider((ref) => FirebaseFirestore.instance);

// Repositories
final authRepositoryProvider = Provider((ref) => AuthRepository(ref.watch(firebaseAuthProvider)));
final userRepositoryProvider = Provider((ref) => UserRepository(ref.watch(firestoreProvider)));
final bunkRepositoryProvider = Provider((ref) => BunkRepository(ref.watch(firestoreProvider)));
final customerRepositoryProvider = Provider((ref) => CustomerRepository(ref.watch(firestoreProvider)));
final managerRepositoryProvider = Provider((ref) => ManagerRepository(ref.watch(firestoreProvider)));
final saleRepositoryProvider = Provider((ref) => SaleRepository(ref.watch(firestoreProvider)));
final loyaltyRepositoryProvider = Provider((ref) => LoyaltyRepository(ref.watch(firestoreProvider)));
