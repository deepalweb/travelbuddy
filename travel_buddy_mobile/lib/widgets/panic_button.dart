import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../models/safety_enums.dart';
import '../services/safety_service.dart';
import '../providers/app_provider.dart';

class PanicButton extends StatefulWidget {
  const PanicButton({super.key});

  @override
  State<PanicButton> createState() => _PanicButtonState();
}

class _PanicButtonState extends State<PanicButton>
    with SingleTickerProviderStateMixin {
  final SafetyService _safetyService = SafetyService();
  late AnimationController _animationController;
  late Animation<double> _pulseAnimation;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    _animationController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        return GestureDetector(
          onLongPressStart: (_) => _onPanicPressed(),
          onTap: () => _showPanicOptions(context, appProvider),
          child: AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: _isPressed ? 0.9 : _pulseAnimation.value,
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        Colors.red.shade400,
                        Colors.red.shade700,
                      ],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.red.withOpacity(0.4),
                        blurRadius: 15,
                        spreadRadius: 3,
                      ),
                    ],
                  ),
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.emergency,
                        color: Colors.white,
                        size: 28,
                      ),
                      SizedBox(height: 2),
                      Text(
                        'SOS',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  void _onPanicPressed() async {
    setState(() => _isPressed = true);
    HapticFeedback.heavyImpact();

    final appProvider = Provider.of<AppProvider>(context, listen: false);
    final location = appProvider.currentLocation;

    if (location != null) {
      final success = await _safetyService.triggerPanicButton(
        location: location,
        type: EmergencyType.general,
      );

      if (success) {
        _showSuccessDialog();
      } else {
        _showErrorDialog();
      }
    }

    setState(() => _isPressed = false);
  }

  void _showPanicOptions(BuildContext context, AppProvider appProvider) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1a1a1a),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(20),
          child: ListView(
            controller: scrollController,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    '🚨 Emergency SOS',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close, color: Colors.grey),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'Choose emergency type or use quick actions',
                style: TextStyle(color: Colors.grey, fontSize: 14),
              ),
              const SizedBox(height: 24),
              
              // Quick Actions
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.blue.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.flash_on, color: Colors.blue, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Quick Actions',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildQuickActionButton(
                            'Call 119',
                            Icons.phone,
                            Colors.green,
                            () {
                              Navigator.pop(context);
                              _safetyService.callEmergency('119');
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildQuickActionButton(
                            'Share Live',
                            Icons.my_location,
                            Colors.blue,
                            () {
                              Navigator.pop(context);
                              _shareLocation(appProvider);
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              
              // Emergency Types
              const Text(
                'Select Emergency Type',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              _buildEmergencyOption(
                'Medical Emergency',
                Icons.local_hospital,
                Colors.red,
                'Ambulance needed immediately',
                () => _triggerEmergency(EmergencyType.medical, appProvider),
              ),
              _buildEmergencyOption(
                'Security Issue',
                Icons.security,
                Colors.orange,
                'Feeling unsafe or threatened',
                () => _triggerEmergency(EmergencyType.security, appProvider),
              ),
              _buildEmergencyOption(
                'Accident',
                Icons.car_crash,
                Colors.yellow,
                'Vehicle or travel accident',
                () => _triggerEmergency(EmergencyType.accident, appProvider),
              ),
              _buildEmergencyOption(
                'Lost/Stranded',
                Icons.location_off,
                Colors.blue,
                'Need help finding way back',
                () => _triggerEmergency(EmergencyType.lost, appProvider),
              ),
              _buildEmergencyOption(
                'General Help',
                Icons.help_outline,
                Colors.purple,
                'Other emergency situation',
                () => _triggerEmergency(EmergencyType.general, appProvider),
              ),
              const SizedBox(height: 20),
              
              // Safety Note
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.grey, size: 16),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Your emergency contacts will be notified with your location',
                        style: TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildQuickActionButton(
    String label,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return ElevatedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 18),
      label: Text(label, style: const TextStyle(fontSize: 13)),
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
  
  void _shareLocation(AppProvider appProvider) async {
    final location = appProvider.currentLocation;
    if (location != null) {
      await _safetyService.shareLocation(location);
    }
  }

  Widget _buildEmergencyOption(
    String title,
    IconData icon,
    Color color,
    String subtitle,
    VoidCallback onTap,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF29382F),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 24),
        ),
        title: Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(color: Colors.grey, fontSize: 12),
        ),
        trailing: const Icon(Icons.arrow_forward_ios, color: Colors.grey, size: 16),
        onTap: () {
          Navigator.pop(context);
          onTap();
        },
      ),
    );
  }

  void _triggerEmergency(EmergencyType type, AppProvider appProvider) async {
    final location = appProvider.currentLocation;
    if (location != null) {
      await _safetyService.triggerPanicButton(
        location: location,
        type: type,
      );
      _showSuccessDialog();
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF29382F),
        title: const Text('Emergency Alert Sent', style: TextStyle(color: Colors.white)),
        content: const Text(
          'Your emergency contacts have been notified with your location.',
          style: TextStyle(color: Colors.grey),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showErrorDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF29382F),
        title: const Text('Alert Failed', style: TextStyle(color: Colors.white)),
        content: const Text(
          'Please add emergency contacts first or check your connection.',
          style: TextStyle(color: Colors.grey),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}