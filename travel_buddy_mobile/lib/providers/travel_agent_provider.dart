import 'package:flutter/foundation.dart';
import '../models/travel_agent_model.dart';
import '../services/travel_agent_service.dart';
import '../utils/debug_logger.dart';

class TravelAgentProvider extends ChangeNotifier {
  List<TravelAgentModel> _agents = [];
  bool _isLoading = false;
  String? _error;
  
  String? _selectedLocation;
  String? _selectedSpecialty;
  String? _selectedLanguage;
  double? _minRating;

  List<TravelAgentModel> get agents => _agents;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  String? get selectedLocation => _selectedLocation;
  String? get selectedSpecialty => _selectedSpecialty;
  String? get selectedLanguage => _selectedLanguage;
  double? get minRating => _minRating;

  List<TravelAgentModel> get filteredAgents {
    return _agents.where((agent) {
      if (_selectedLocation != null && _selectedLocation!.isNotEmpty &&
          !agent.location.toLowerCase().contains(_selectedLocation!.toLowerCase())) {
        return false;
      }
      if (_selectedSpecialty != null && _selectedSpecialty!.isNotEmpty &&
          !agent.specializations.contains(_selectedSpecialty)) {
        return false;
      }
      if (_selectedLanguage != null && _selectedLanguage!.isNotEmpty &&
          !agent.languages.contains(_selectedLanguage)) {
        return false;
      }
      if (_minRating != null && agent.rating < _minRating!) {
        return false;
      }
      return true;
    }).toList();
  }

  Future<void> loadAgents() async {
    _setLoading(true);
    _clearError();
    
    try {
      _agents = await TravelAgentService.getTravelAgents(
        location: _selectedLocation,
        specialty: _selectedSpecialty,
        language: _selectedLanguage,
        minRating: _minRating,
      );
      DebugLogger.info('📱 Loaded ${_agents.length} travel agents');
    } catch (e) {
      _setError('Failed to load travel agents: $e');
      DebugLogger.error('❌ Failed to load agents: $e');
    } finally {
      _setLoading(false);
    }
  }

  Future<TravelAgentModel?> getAgentById(String id) async {
    try {
      return await TravelAgentService.getAgentById(id);
    } catch (e) {
      DebugLogger.error('❌ Failed to get agent: $e');
      return null;
    }
  }

  void setLocation(String? location) {
    _selectedLocation = location;
    notifyListeners();
  }

  void setSpecialty(String? specialty) {
    _selectedSpecialty = specialty;
    notifyListeners();
  }

  void setLanguage(String? language) {
    _selectedLanguage = language;
    notifyListeners();
  }

  void setMinRating(double? rating) {
    _minRating = rating;
    notifyListeners();
  }

  void clearFilters() {
    _selectedLocation = null;
    _selectedSpecialty = null;
    _selectedLanguage = null;
    _minRating = null;
    notifyListeners();
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
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
}
