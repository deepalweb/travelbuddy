import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/place.dart';
import '../config/environment.dart';

class AzureBlobService {
  static final AzureBlobService _instance = AzureBlobService._internal();
  factory AzureBlobService() => _instance;
  AzureBlobService._internal();

  // Use backend API for Azure Blob operations
  final String _backendUrl = Environment.backendUrl;

  // Save places data to Azure Blob via backend
  Future<bool> savePlacesToBlob(String cacheKey, List<Place> places) async {
    try {
      final response = await http.post(
        Uri.parse('$_backendUrl/api/cache/places'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'cacheKey': cacheKey,
          'timestamp': DateTime.now().toIso8601String(),
          'places': places.map((p) => {
            'id': p.id,
            'name': p.name,
            'type': p.type,
            'rating': p.rating,
            'address': p.address,
            'photoUrl': p.photoUrl,
            'description': p.description,
            'localTip': p.localTip,
            'latitude': p.latitude,
            'longitude': p.longitude,
          }).toList(),
        }),
      );

      if (response.statusCode == 200) {
        print('✅ Saved ${places.length} places to Azure Blob via backend');
        return true;
      }
      return false;
    } catch (e) {
      print('❌ Azure Blob save error: $e');
      return false;
    }
  }

  // Load places data from Azure Blob via backend
  Future<List<Place>> loadPlacesFromBlob(String cacheKey) async {
    try {
      final response = await http.get(
        Uri.parse('$_backendUrl/api/cache/places/$cacheKey'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> placesJson = data['places'];
        final places = placesJson.map((json) => Place.fromJson(json)).toList();
        print('✅ Loaded ${places.length} places from Azure Blob');
        return places;
      }
      return [];
    } catch (e) {
      print('❌ Azure Blob load error: $e');
      return [];
    }
  }
}
