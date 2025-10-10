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
                  width: 120,
                  height: 120,
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
                        blurRadius: 20,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.emergency,
                        color: Colors.white,
                        size: 40,
                      ),
                      SizedBox(height: 4),
                      Text(
                        'SOS',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
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
      backgroundColor: const Color(0xFF29382F),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Emergency Options',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            _buildEmergencyOption(
              'Medical Emergency',
              Icons.local_hospital,
              Colors.red,
              () => _triggerEmergency(EmergencyType.medical, appProvider),
            ),
            _buildEmergencyOption(
              'Security Issue',
              Icons.security,
              Colors.orange,
              () => _triggerEmergency(EmergencyType.security, appProvider),
            ),
            _buildEmergencyOption(
              'Accident',
              Icons.car_crash,
              Colors.yellow,
              () => _triggerEmergency(EmergencyType.accident, appProvider),
            ),
            _buildEmergencyOption(
              'Lost/Stranded',
              Icons.location_off,
              Colors.blue,
              () => _triggerEmergency(EmergencyType.lost, appProvider),
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmergencyOption(
    String title,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(title, style: const TextStyle(color: Colors.white)),
      onTap: () {
        Navigator.pop(context);
        onTap();
      },
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