import 'package:flutter/foundation.dart';
import '../models/event_model.dart';
import '../services/event_service.dart';

class EventProvider extends ChangeNotifier {
  List<EventModel> _events = [];
  bool _isLoading = false;
  String? _selectedCategory;
  String? _selectedLocation;

  List<EventModel> get events => _events;
  bool get isLoading => _isLoading;
  String? get selectedCategory => _selectedCategory;
  String? get selectedLocation => _selectedLocation;

  List<EventModel> get filteredEvents {
    return _events.where((event) {
      if (_selectedCategory != null && event.category != _selectedCategory) {
        return false;
      }
      if (_selectedLocation != null && !event.location.contains(_selectedLocation!)) {
        return false;
      }
      return true;
    }).toList();
  }

  Future<void> loadEvents() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      _events = await EventService.getEvents(
        category: _selectedCategory,
        location: _selectedLocation,
      );
    } catch (e) {
      print('Error loading events: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setCategory(String? category) {
    _selectedCategory = category;
    notifyListeners();
  }

  void setLocation(String? location) {
    _selectedLocation = location;
    notifyListeners();
  }

  void clearFilters() {
    _selectedCategory = null;
    _selectedLocation = null;
    notifyListeners();
  }
}
