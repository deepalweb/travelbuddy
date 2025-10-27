import '../config/environment.dart';

class DebugLogger {
  static void log(String message) {
    if (Environment.enableDebugLogging) {
      print(message);
    }
  }
  
  static void error(String message) {
    // Always log errors, even in production
    print('ERROR: $message');
  }
  
  static void info(String message) {
    if (Environment.enableDebugLogging) {
      print('INFO: $message');
    }
  }
}