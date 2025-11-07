import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../services/enhanced_safety_service.dart';
import '../../providers/app_provider.dart';

class EnhancedPanicButton extends StatefulWidget {
  final String? tripName;

  const EnhancedPanicButton({
    super.key,
    this.tripName,
  });

  @override
  State<EnhancedPanicButton> createState() => _EnhancedPanicButtonState();
}

class _EnhancedPanicButtonState extends State<EnhancedPanicButton>
    with TickerProviderStateMixin {
  final EnhancedSafetyService _safetyService = EnhancedSafetyService();
  late AnimationController _pulseController;
  late AnimationController _pressController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _scaleAnimation;
  
  bool _isPressed = false;
  bool _isLongPressing = false;
  int _longPressProgress = 0;

  @override
  void initState() {
    super.initState();
    
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    
    _pressController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.15,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.9,
    ).animate(CurvedAnimation(
      parent: _pressController,
      curve: Curves.easeInOut,
    ));
    
    _pulseController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _pressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        return GestureDetector(
          onTapDown: (_) => _onPressStart(),
          onTapUp: (_) => _onPressEnd(),
          onTapCancel: () => _onPressEnd(),
          onLongPressStart: (_) => _onLongPressStart(),
          onLongPressEnd: (_) => _onLongPressEnd(),
          child: AnimatedBuilder(
            animation: Listenable.merge([_pulseAnimation, _scaleAnimation]),
            builder: (context, child) {
              return Transform.scale(
                scale: _scaleAnimation.value * _pulseAnimation.value,
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        Colors.red.shade400,
                        Colors.red.shade700,
                        Colors.red.shade900,
                      ],
                      stops: const [0.0, 0.7, 1.0],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.red.withOpacity(0.6),
                        blurRadius: 20,
                        spreadRadius: _isLongPressing ? 8 : 4,
                      ),
                    ],
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Progress indicator for long press
                      if (_isLongPressing)
                        SizedBox(
                          width: 90,
                          height: 90,
                          child: CircularProgressIndicator(
                            value: _longPressProgress / 100,
                            strokeWidth: 3,
                            valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                            backgroundColor: Colors.white.withOpacity(0.3),
                          ),
                        ),
                      
                      // Main content
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _isLongPressing ? Icons.emergency : Icons.emergency,
                            color: Colors.white,
                            size: _isLongPressing ? 32 : 28,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _isLongPressing ? 'SENDING...' : 'SOS',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: _isLongPressing ? 10 : 12,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ],
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

  void _onPressStart() {
    setState(() => _isPressed = true);
    _pressController.forward();
    HapticFeedback.mediumImpact();
  }

  void _onPressEnd() {
    setState(() => _isPressed = false);
    _pressController.reverse();
    
    if (!_isLongPressing) {
      _showQuickSOSOptions();
    }
  }

  void _onLongPressStart() {
    setState(() => _isLongPressing = true);
    HapticFeedback.heavyImpact();
    _startLongPressProgress();
  }

  void _onLongPressEnd() {
    setState(() {
      _isLongPressing = false;
      _longPressProgress = 0;
    });
  }

  void _startLongPressProgress() {
    const duration = Duration(milliseconds: 50);
    Timer.periodic(duration, (timer) {
      if (!_isLongPressing) {
        timer.cancel();
        return;
      }
      
      setState(() {
        _longPressProgress += 2;
      });
      
      if (_longPressProgress >= 100) {
        timer.cancel();
        _triggerEmergencySOS();
      }
    });
  }

  void _showQuickSOSOptions() {
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
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Emergency SOS Options',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Hold button for 3 seconds for instant SOS',
              style: TextStyle(color: Colors.grey, fontSize: 14),
            ),
            const SizedBox(height: 24),
            
            _buildSOSOption(
              'Medical Emergency',
              Icons.local_hospital,
              Colors.red,
              'Send medical emergency alert',
              () => _triggerTypedSOS('medical'),
            ),
            _buildSOSOption(
              'Security Threat',
              Icons.security,
              Colors.orange,
              'Alert for security issues',
              () => _triggerTypedSOS('security'),
            ),
            _buildSOSOption(
              'Accident',
              Icons.car_crash,
              Colors.yellow.shade700,
              'Report accident or injury',
              () => _triggerTypedSOS('accident'),
            ),
            _buildSOSOption(
              'Lost/Stranded',
              Icons.location_off,
              Colors.blue,
              'Need help with location',
              () => _triggerTypedSOS('lost'),
            ),
            _buildSOSOption(
              'Silent Alert',
              Icons.volume_off,
              Colors.purple,
              'Discreet emergency signal',
              () => _triggerSilentSOS(),
            ),
            
            const SizedBox(height: 16),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'Cancel',
                style: TextStyle(color: Colors.grey, fontSize: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSOSOption(
    String title,
    IconData icon,
    Color color,
    String description,
    VoidCallback onTap,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        onTap: () {
          Navigator.pop(context);
          onTap();
        },
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color, size: 24),
        ),
        title: Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: Text(
          description,
          style: const TextStyle(color: Colors.grey, fontSize: 12),
        ),
        trailing: const Icon(Icons.arrow_forward_ios, color: Colors.grey, size: 16),
      ),
    );
  }

  Future<void> _triggerEmergencySOS() async {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    final location = appProvider.currentLocation;
    
    if (location != null) {
      HapticFeedback.heavyImpact();
      
      final success = await _safetyService.triggerSmartSOS(
        location: location,
        tripName: widget.tripName,
      );
      
      if (success) {
        _showSOSConfirmation('Emergency SOS sent successfully!');
      } else {
        _showSOSError('Failed to send SOS. Please add emergency contacts.');
      }
    }
  }

  Future<void> _triggerTypedSOS(String type) async {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    final location = appProvider.currentLocation;
    
    if (location != null) {
      final success = await _safetyService.triggerSmartSOS(
        location: location,
        tripName: widget.tripName,
        customMessage: 'Emergency Type: ${type.toUpperCase()}',
      );
      
      if (success) {
        _showSOSConfirmation('$type emergency alert sent!');
      } else {
        _showSOSError('Failed to send alert. Please check your settings.');
      }
    }
  }

  Future<void> _triggerSilentSOS() async {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    final location = appProvider.currentLocation;
    
    if (location != null) {
      // Enable silent mode temporarily
      _safetyService.enableSilentSOS();
      
      final success = await _safetyService.triggerSmartSOS(
        location: location,
        tripName: widget.tripName,
        customMessage: 'SILENT EMERGENCY - Discreet help needed',
      );
      
      if (success) {
        // Minimal feedback for silent mode
        HapticFeedback.selectionClick();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Silent alert sent'),
            duration: Duration(seconds: 1),
            backgroundColor: Colors.grey,
          ),
        );
      }
    }
  }

  void _showSOSConfirmation(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF29382F),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.check_circle, color: Colors.green),
            ),
            const SizedBox(width: 12),
            const Text('SOS Sent', style: TextStyle(color: Colors.white)),
          ],
        ),
        content: Text(
          message,
          style: const TextStyle(color: Colors.grey),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK', style: TextStyle(color: Colors.green)),
          ),
        ],
      ),
    );
  }

  void _showSOSError(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF29382F),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.error, color: Colors.red),
            ),
            const SizedBox(width: 12),
            const Text('SOS Failed', style: TextStyle(color: Colors.white)),
          ],
        ),
        content: Text(
          message,
          style: const TextStyle(color: Colors.grey),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}