class AuthErrorHandler {
  static String getReadableError(dynamic error) {
    final errorString = error.toString().toLowerCase();
    
    if (errorString.contains('google sign-in failed')) {
      return 'Google Sign-In is not properly configured. Please check your setup.';
    }
    
    if (errorString.contains('network')) {
      return 'Network error. Please check your internet connection.';
    }
    
    if (errorString.contains('storage')) {
      return 'Storage initialization failed. Please restart the app.';
    }
    
    if (errorString.contains('hive')) {
      return 'Database error. Please clear app data and try again.';
    }
    
    if (errorString.contains('firebase')) {
      return 'Authentication service error. Please try again later.';
    }
    
    return 'Authentication failed. Please try again.';
  }
  
  static bool isRecoverableError(dynamic error) {
    final errorString = error.toString().toLowerCase();
    
    // These errors can be recovered from by retrying
    return errorString.contains('network') || 
           errorString.contains('timeout') ||
           errorString.contains('connection');
  }
}