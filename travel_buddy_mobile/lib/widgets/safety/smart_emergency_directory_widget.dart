import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/enhanced_safety_service.dart';

class SmartEmergencyDirectoryWidget extends StatefulWidget {
  final double? latitude;
  final double? longitude;

  const SmartEmergencyDirectoryWidget({
    super.key,
    this.latitude,
    this.longitude,
  });

  @override
  State<SmartEmergencyDirectoryWidget> createState() => _SmartEmergencyDirectoryWidgetState();
}

class _SmartEmergencyDirectoryWidgetState extends State<SmartEmergencyDirectoryWidget> {
  final EnhancedSafetyService _safetyService = EnhancedSafetyService();
  Map<String, String> _emergencyNumbers = {};
  bool _isLoading = true;
  String _detectedCountry = '';

  @override
  void initState() {
    super.initState();
    _loadEmergencyNumbers();
  }

  Future<void> _loadEmergencyNumbers() async {
    try {
      final numbers = await _safetyService.getSmartEmergencyDirectory(
        latitude: widget.latitude,
        longitude: widget.longitude,
      );
      
      setState(() {
        _emergencyNumbers = numbers;
        _isLoading = false;
        _detectedCountry = _getCountryFromNumbers(numbers);
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _emergencyNumbers = {
          'police': '112',
          'ambulance': '112',
          'fire': '112',
        };
      });
    }
  }

  String _getCountryFromNumbers(Map<String, String> numbers) {
    final police = numbers['police'] ?? '';
    if (police == '911') return '🇺🇸 United States';
    if (police == '119') return '🇱🇰 Sri Lanka';
    if (police == '100') return '🇮🇳 India';
    if (police == '112') return '🇪🇺 Europe/International';
    return '🌍 International';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.1),
        border: Border.all(color: Colors.red.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.emergency, color: Colors.red, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Emergency Directory',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (_detectedCountry.isNotEmpty)
                      Text(
                        _detectedCountry,
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _isLoading ? Colors.orange : Colors.green,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _isLoading ? Icons.sync : Icons.offline_bolt,
                      color: Colors.white,
                      size: 12,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _isLoading ? 'Loading' : 'Offline Ready',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          if (_isLoading)
            const Center(child: CircularProgressIndicator())
          else ...[
            // Primary emergency numbers
            _buildEmergencyNumberRow(
              'Police',
              _emergencyNumbers['police'] ?? '112',
              Icons.local_police,
              Colors.blue,
            ),
            _buildEmergencyNumberRow(
              'Ambulance',
              _emergencyNumbers['ambulance'] ?? '112',
              Icons.local_hospital,
              Colors.red,
            ),
            _buildEmergencyNumberRow(
              'Fire Department',
              _emergencyNumbers['fire'] ?? '112',
              Icons.local_fire_department,
              Colors.orange,
            ),
            
            // Additional services
            if (_emergencyNumbers['embassy']?.isNotEmpty == true)
              _buildEmergencyNumberRow(
                'Embassy',
                _emergencyNumbers['embassy']!,
                Icons.account_balance,
                Colors.purple,
              ),
            if (_emergencyNumbers['tourist_hotline']?.isNotEmpty == true)
              _buildEmergencyNumberRow(
                'Tourist Hotline',
                _emergencyNumbers['tourist_hotline']!,
                Icons.support_agent,
                Colors.green,
              ),
          ],
        ],
      ),
    );
  }

  Widget _buildEmergencyNumberRow(
    String label,
    String number,
    IconData icon,
    Color color,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  number,
                  style: TextStyle(
                    color: Colors.grey.shade300,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                onPressed: () => _callNumber(number),
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.green,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(
                    Icons.phone,
                    color: Colors.white,
                    size: 16,
                  ),
                ),
                tooltip: 'Call $number',
              ),
              IconButton(
                onPressed: () => _copyNumber(number),
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.grey.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(
                    Icons.copy,
                    color: Colors.white,
                    size: 16,
                  ),
                ),
                tooltip: 'Copy number',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _callNumber(String phoneNumber) async {
    try {
      final uri = Uri.parse('tel:$phoneNumber');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else {
        _showError('Cannot make calls on this device');
      }
    } catch (e) {
      _showError('Failed to call $phoneNumber');
    }
  }

  Future<void> _copyNumber(String phoneNumber) async {
    try {
      await Clipboard.setData(ClipboardData(text: phoneNumber));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Copied $phoneNumber to clipboard'),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 2),
        ),
      );
    } catch (e) {
      _showError('Failed to copy number');
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 3),
      ),
    );
  }
}