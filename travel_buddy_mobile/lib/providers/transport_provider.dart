import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/transport_service_model.dart';
import '../models/transport_booking.dart';
import '../services/transport_service.dart';
import '../utils/debug_logger.dart';

class TransportProvider extends ChangeNotifier {
  List<TransportServiceModel> _services = [];
  List<TransportBooking> _userBookings = [];
  List<Map<String, dynamic>> _popularRoutes = [];
  Map<String, dynamic> _systemStatus = {};
  List<Map<String, dynamic>> _liveUpdates = [];
  Map<String, dynamic> _performanceMetrics = {};
  bool _isLoading = false;
  bool _isBookingLoading = false;
  String? _error;
  
  // Filters
  String? _selectedVehicleType;
  String? _fromLocation;
  String? _toLocation;
  double? _maxPrice;
  double? _minRating;
  bool _verifiedOnly = false;
  bool _instantBookingOnly = false;
  bool _ecoFriendlyOnly = false;

  // Getters
  List<TransportServiceModel> get services => _services;
  List<TransportBooking> get userBookings => _userBookings;
  List<Map<String, dynamic>> get popularRoutes => _popularRoutes;
  Map<String, dynamic> get systemStatus => _systemStatus;
  List<Map<String, dynamic>> get liveUpdates => _liveUpdates;
  Map<String, dynamic> get performanceMetrics => _performanceMetrics;
  bool get isLoading => _isLoading;
  bool get isBookingLoading => _isBookingLoading;
  String? get error => _error;
  
  // Filter getters
  String? get selectedVehicleType => _selectedVehicleType;
  String? get fromLocation => _fromLocation;
  String? get toLocation => _toLocation;
  double? get maxPrice => _maxPrice;
  double? get minRating => _minRating;
  bool get verifiedOnly => _verifiedOnly;
  bool get instantBookingOnly => _instantBookingOnly;
  bool get ecoFriendlyOnly => _ecoFriendlyOnly;

  // Computed getters
  List<TransportServiceModel> get filteredServices {
    return _services.where((service) {
      if (_selectedVehicleType != null && _selectedVehicleType != 'All' && 
          service.vehicleType != _selectedVehicleType) return false;
      if (_fromLocation != null && _fromLocation!.isNotEmpty &&
          !service.fromLocation.toLowerCase().contains(_fromLocation!.toLowerCase())) return false;
      if (_toLocation != null && _toLocation!.isNotEmpty &&
          !service.toLocation.toLowerCase().contains(_toLocation!.toLowerCase())) return false;
      if (_maxPrice != null && service.price > _maxPrice!) return false;
      if (_minRating != null && service.rating < _minRating!) return false;
      if (_verifiedOnly && !service.isVerified) return false;
      if (_instantBookingOnly && !service.instantBooking) return false;
      if (_ecoFriendlyOnly && !service.ecoFriendly) return false;
      return true;
    }).toList();
  }

  List<TransportBooking> get activeBookings {
    return _userBookings.where((booking) => booking.isActive).toList();
  }

  List<TransportBooking> get completedBookings {
    return _userBookings.where((booking) => booking.isCompleted).toList();
  }

  List<TransportBooking> get cancelledBookings {
    return _userBookings.where((booking) => booking.isCancelled).toList();
  }

  /// Load all transport services
  Future<void> loadServices() async {
    _setLoading(true);
    _clearError();
    
    try {
      _services = await TransportService.getTransportServices();
      DebugLogger.info('📱 Loaded ${_services.length} transport services');
    } catch (e) {
      _setError('Failed to load transport services: $e');
      DebugLogger.error('❌ Failed to load services: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Search services with current filters
  Future<void> searchServices() async {
    _setLoading(true);
    _clearError();
    
    try {
      _services = await TransportService.searchServices(
        fromLocation: _fromLocation,
        toLocation: _toLocation,
        vehicleType: _selectedVehicleType,
        maxPrice: _maxPrice,
        minRating: _minRating,
        verifiedOnly: _verifiedOnly,
        instantBookingOnly: _instantBookingOnly,
        ecoFriendlyOnly: _ecoFriendlyOnly,
      );
      DebugLogger.info('🔍 Found ${_services.length} services matching filters');
    } catch (e) {
      _setError('Search failed: $e');
      DebugLogger.error('❌ Search failed: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Get AI recommendations
  Future<void> getAIRecommendations(String from, String to, {String? preferences}) async {
    _setLoading(true);
    _clearError();
    
    try {
      _services = await TransportService.getAIRecommendations(
        from: from,
        to: to,
        preferences: preferences,
      );
      DebugLogger.info('🤖 Got ${_services.length} AI recommendations');
    } catch (e) {
      _setError('AI recommendations failed: $e');
      DebugLogger.error('❌ AI recommendations failed: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Load popular routes
  Future<void> loadPopularRoutes() async {
    try {
      _popularRoutes = await TransportService.getPopularRoutes();
      notifyListeners();
    } catch (e) {
      DebugLogger.error('❌ Failed to load popular routes: $e');
    }
  }

  /// Book a service
  Future<Map<String, dynamic>> bookService({
    required String serviceId,
    required String userId,
    required DateTime travelDate,
    required int passengers,
    String? pickupLocation,
    String? dropoffLocation,
    String? contactNumber,
    Map<String, dynamic>? additionalInfo,
  }) async {
    _setBookingLoading(true);
    
    try {
      final result = await TransportService.bookService(
        serviceId: serviceId,
        userId: userId,
        travelDate: travelDate,
        passengers: passengers,
        pickupLocation: pickupLocation,
        dropoffLocation: dropoffLocation,
        contactNumber: contactNumber,
        additionalInfo: additionalInfo,
      );
      
      if (result['success'] == true) {
        // Refresh user bookings after successful booking
        await loadUserBookings(userId);
      }
      
      return result;
    } catch (e) {
      DebugLogger.error('❌ Booking failed: $e');
      return {
        'success': false,
        'message': 'Booking failed: $e',
      };
    } finally {
      _setBookingLoading(false);
    }
  }

  /// Load user bookings
  Future<void> loadUserBookings(String userId) async {
    try {
      _userBookings = await TransportService.getUserBookings(userId);
      notifyListeners();
      DebugLogger.info('📋 Loaded ${_userBookings.length} user bookings');
    } catch (e) {
      DebugLogger.error('❌ Failed to load user bookings: $e');
    }
  }

  /// Cancel a booking
  Future<Map<String, dynamic>> cancelBooking(String bookingId, {String? reason}) async {
    try {
      final result = await TransportService.cancelBooking(bookingId, reason: reason);
      
      if (result['success'] == true) {
        // Update local booking status
        final bookingIndex = _userBookings.indexWhere((b) => b.id == bookingId);
        if (bookingIndex != -1) {
          _userBookings[bookingIndex] = _userBookings[bookingIndex].copyWith(
            status: 'cancelled',
            cancellationReason: reason,
            cancellationTime: DateTime.now(),
          );
          notifyListeners();
        }
      }
      
      return result;
    } catch (e) {
      DebugLogger.error('❌ Cancellation failed: $e');
      return {
        'success': false,
        'message': 'Cancellation failed: $e',
      };
    }
  }

  /// Get nearby services
  Future<void> getNearbyServices(double latitude, double longitude, {double radius = 10.0}) async {
    _setLoading(true);
    _clearError();
    
    try {
      _services = await TransportService.getNearbyServices(
        latitude: latitude,
        longitude: longitude,
        radius: radius,
      );
      DebugLogger.info('📍 Found ${_services.length} nearby services');
    } catch (e) {
      _setError('Failed to get nearby services: $e');
      DebugLogger.error('❌ Failed to get nearby services: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Get price estimate
  Future<Map<String, dynamic>?> getPriceEstimate({
    required String from,
    required String to,
    String? vehicleType,
    int passengers = 1,
  }) async {
    try {
      return await TransportService.getPriceEstimate(
        from: from,
        to: to,
        vehicleType: vehicleType,
        passengers: passengers,
      );
    } catch (e) {
      DebugLogger.error('❌ Price estimate failed: $e');
      return null;
    }
  }

  /// Load system status
  Future<void> loadSystemStatus() async {
    try {
      _systemStatus = await TransportService.getSystemStatus();
      notifyListeners();
      DebugLogger.info('📊 System status loaded');
    } catch (e) {
      DebugLogger.error('❌ Failed to load system status: $e');
    }
  }

  /// Load live updates
  Future<void> loadLiveUpdates() async {
    try {
      _liveUpdates = await TransportService.getLiveUpdates();
      notifyListeners();
      DebugLogger.info('📶 Live updates loaded: ${_liveUpdates.length} updates');
    } catch (e) {
      DebugLogger.error('❌ Failed to load live updates: $e');
    }
  }

  /// Load performance metrics
  Future<void> loadPerformanceMetrics() async {
    try {
      _performanceMetrics = await TransportService.getPerformanceMetrics();
      notifyListeners();
      DebugLogger.info('📈 Performance metrics loaded');
    } catch (e) {
      DebugLogger.error('❌ Failed to load performance metrics: $e');
    }
  }

  /// Load all status data
  Future<void> loadAllStatusData() async {
    await Future.wait([
      loadSystemStatus(),
      loadLiveUpdates(),
      loadPerformanceMetrics(),
      loadPopularRoutes(),
    ]);
  }

  /// Refresh transport data
  Future<void> refreshTransportData() async {
    _setLoading(true);
    _clearError();
    
    try {
      await Future.wait([
        loadServices(),
        loadAllStatusData(),
      ]);
      DebugLogger.info('✨ Transport data refreshed successfully');
    } catch (e) {
      _setError('Failed to refresh transport data: $e');
      DebugLogger.error('❌ Failed to refresh transport data: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Get current service status summary
  Map<String, dynamic> getServiceStatusSummary() {
    final totalServices = _services.length;
    final liveServices = _services.where((s) => s.isLive).length;
    final verifiedServices = _services.where((s) => s.isVerified).length;
    final availableSeats = _services.fold<int>(0, (sum, s) => sum + s.availableSeats);
    
    return {
      'totalServices': totalServices,
      'liveServices': liveServices,
      'offlineServices': totalServices - liveServices,
      'verifiedServices': verifiedServices,
      'availableSeats': availableSeats,
      'lastUpdate': DateTime.now().toIso8601String(),
    };
  }

  // Filter methods
  void setVehicleType(String? vehicleType) {
    _selectedVehicleType = vehicleType;
    notifyListeners();
  }

  void setFromLocation(String? location) {
    _fromLocation = location;
    notifyListeners();
  }

  void setToLocation(String? location) {
    _toLocation = location;
    notifyListeners();
  }

  void setMaxPrice(double? price) {
    _maxPrice = price;
    notifyListeners();
  }

  void setMinRating(double? rating) {
    _minRating = rating;
    notifyListeners();
  }

  void setVerifiedOnly(bool value) {
    _verifiedOnly = value;
    notifyListeners();
  }

  void setInstantBookingOnly(bool value) {
    _instantBookingOnly = value;
    notifyListeners();
  }

  void setEcoFriendlyOnly(bool value) {
    _ecoFriendlyOnly = value;
    notifyListeners();
  }

  void clearFilters() {
    _selectedVehicleType = null;
    _fromLocation = null;
    _toLocation = null;
    _maxPrice = null;
    _minRating = null;
    _verifiedOnly = false;
    _instantBookingOnly = false;
    _ecoFriendlyOnly = false;
    notifyListeners();
  }

  // Private helper methods
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setBookingLoading(bool loading) {
    _isBookingLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }

  /// Start periodic status updates
  void startPeriodicUpdates() {
    // Update status every 30 seconds
    Timer.periodic(const Duration(seconds: 30), (timer) {
      if (!_isLoading) {
        loadLiveUpdates();
      }
    });
  }

  @override
  void dispose() {
    super.dispose();
  }
}