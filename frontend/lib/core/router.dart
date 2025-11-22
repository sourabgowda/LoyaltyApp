import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/signup_screen.dart';
import '../features/admin/presentation/screens/admin_home_screen.dart';
import '../features/customer/presentation/screens/customer_home_screen.dart';
import '../features/manager/presentation/screens/manager_home_screen.dart';
import '../core/di.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateChangesProvider);

  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const LoginScreen(),
        redirect: (context, state) {
          if (authState.asData?.value != null) {
            // TODO: get user role
            return '/admin'; // temp
          }
          return null;
        },
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) => const AdminHomeScreen(),
      ),
      GoRoute(
        path: '/customer',
        builder: (context, state) => const CustomerHomeScreen(),
      ),
      GoRoute(
        path: '/manager',
        builder: (context, state) => const ManagerHomeScreen(),
      ),
    ],
  );
});

final authStateChangesProvider = StreamProvider(
  (ref) => ref.watch(authRepositoryProvider).authStateChanges(),
);
