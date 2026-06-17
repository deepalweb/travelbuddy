import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../config/environment.dart';

class MobileApiClient {
  MobileApiClient._();

  static final MobileApiClient instance = MobileApiClient._();

  late final Dio dio = Dio(
    BaseOptions(
      baseUrl: Environment.backendUrl,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 45),
      sendTimeout: const Duration(seconds: 30),
      headers: const {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    ),
  )..interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final user = FirebaseAuth.instance.currentUser;
          if (user != null) {
            final token = await user.getIdToken();
            if (token != null) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode != 401 ||
              error.requestOptions.extra['authRetried'] == true) {
            handler.next(error);
            return;
          }

          final user = FirebaseAuth.instance.currentUser;
          if (user == null) {
            handler.next(error);
            return;
          }

          try {
            final token = await user.getIdToken(true);
            if (token == null) {
              handler.next(error);
              return;
            }

            final request = error.requestOptions;
            request.extra['authRetried'] = true;
            request.headers['Authorization'] = 'Bearer $token';
            handler.resolve(await dio.fetch(request));
          } catch (_) {
            handler.next(error);
          }
        },
      ),
    );

  Future<bool> isBackendAvailable() async {
    try {
      final response = await dio.get<void>('/health');
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
