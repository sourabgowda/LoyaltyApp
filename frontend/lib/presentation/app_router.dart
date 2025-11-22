import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/signup_screen.dart';
import '../features/customer/presentation/screens/customer_home_screen.dart';
import '../features/manager/presentation/screens/manager_home_screen.dart';
import '../features/admin/presentation/screens/admin_home_screen.dart';
import '../../core/di.dart';

final goRouterProvider = Provider((ref) {
  final authState = ref.watch(authRepositoryProvider);

  return GoRouter(
    initialLocation: '/login',
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: '/customer',
        builder: (context, state) => const CustomerHomeScreen(),
      ),
      GoRoute(
        path: '/manager',
        builder: (context, state) => const ManagerHomeScreen(),
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) => const AdminHomeScreen(),
      ),
    ],
    redirect: (context, state) async {
      final user = await authState.authStateChanges().first;
      final loggingIn = state.matchedLocation == '/login' || state.matchedLocation == '/signup';

      if (user == null) {
        return loggingIn ? null : '/login';
      }

      if (loggingIn) {
        final claims = (await user.getIdTokenResult()).claims;
        final role = claims?['role'];

        switch (role) {
          case 'admin':
            return '/admin';
          case 'manager':
            return '/manager';
          case 'customer':
            return '/customer';
          default:
            return '/login';
        }
      }

      return null;
    },
  );
});
