import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../providers/app_provider.dart';
import '../services/trip_plans_api_service.dart';
import '../models/trip.dart';
import '../constants/app_constants.dart';

class TripSharingScreen extends StatefulWidget {
  final TripPlan tripPlan;
  
  const TripSharingScreen({super.key, required this.tripPlan});

  @override
  State<TripSharingScreen> createState() => _TripSharingScreenState();
}

class _TripSharingScreenState extends State<TripSharingScreen> {
  String? _shareUrl;
  bool _isGeneratingLink = false;
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Share Trip Plan'),
        backgroundColor: Color(AppConstants.colors['primary']!),
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Trip Preview Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.tripPlan.tripTitle ?? 'Trip Plan',
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text('${widget.tripPlan.destination} • ${widget.tripPlan.duration}'),
                    const SizedBox(height: 8),
                    Text(
                      '${widget.tripPlan.dailyPlans.length} days • ${_getTotalActivities()} activities',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Share Options
            const Text(
              'Share Options',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            
            // Generate Share Link
            Card(
              child: ListTile(
                leading: const Icon(Icons.link, color: Colors.blue),
                title: const Text('Generate Share Link'),
                subtitle: _shareUrl != null 
                    ? const Text('Link generated - tap to copy')
                    : const Text('Create a shareable link for this trip'),
                trailing: _isGeneratingLink 
                    ? const SizedBox(
                        width: 20, 
                        height: 20, 
                        child: CircularProgressIndicator(strokeWidth: 2)
                      )
                    : const Icon(Icons.arrow_forward_ios),
                onTap: _shareUrl != null ? _copyShareLink : _generateShareLink,
              ),
            ),
            
            // Direct Share
            Card(
              child: ListTile(
                leading: const Icon(Icons.share, color: Colors.green),
                title: const Text('Share Directly'),
                subtitle: const Text('Share via messaging apps, email, etc.'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: _shareDirectly,
              ),
            ),
            
            // Export Options
            Card(
              child: ListTile(
                leading: const Icon(Icons.download, color: Colors.orange),
                title: const Text('Export as Text'),
                subtitle: const Text('Copy trip details as formatted text'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: _exportAsText,
              ),
            ),
            
            if (_shareUrl != null) ...[
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.blue[600]),
                        const SizedBox(width: 8),
                        const Text(
                          'Share Link Generated',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Anyone with this link can view your trip plan. The link will remain active for 30 days.',
                      style: TextStyle(color: Colors.blue[700]),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey[300]!),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              _shareUrl!,
                              style: const TextStyle(fontFamily: 'monospace'),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.copy),
                            onPressed: _copyShareLink,
                            tooltip: 'Copy link',
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
  
  int _getTotalActivities() {
    return widget.tripPlan.dailyPlans
        .fold(0, (sum, day) => sum + day.activities.length);
  }
  
  Future<void> _generateShareLink() async {
    final appProvider = context.read<AppProvider>();
    if (appProvider.currentUser?.mongoId == null) {
      _showErrorSnackBar('Please sign in to generate share links');
      return;
    }
    
    setState(() => _isGeneratingLink = true);
    
    try {
      final shareUrl = await TripPlansApiService.shareTripPlan(
        widget.tripPlan.id,
      );
      
      if (shareUrl != null) {
        setState(() => _shareUrl = shareUrl);
        _showSuccessSnackBar('Share link generated successfully!');
      } else {
        _showErrorSnackBar('Failed to generate share link');
      }
    } catch (e) {
      _showErrorSnackBar('Error generating share link: $e');
    } finally {
      setState(() => _isGeneratingLink = false);
    }
  }
  
  Future<void> _copyShareLink() async {
    if (_shareUrl != null) {
      await Clipboard.setData(ClipboardData(text: _shareUrl!));
      _showSuccessSnackBar('Link copied to clipboard!');
    }
  }
  
  Future<void> _shareDirectly() async {
    final tripText = _generateTripText();
    
    try {
      await Share.share(
        tripText,
        subject: 'Check out my ${widget.tripPlan.destination} trip plan!',
      );
    } catch (e) {
      _showErrorSnackBar('Error sharing: $e');
    }
  }
  
  Future<void> _exportAsText() async {
    final tripText = _generateTripText();
    
    await Clipboard.setData(ClipboardData(text: tripText));
    _showSuccessSnackBar('Trip plan copied to clipboard!');
  }
  
  String _generateTripText() {
    final buffer = StringBuffer();
    
    buffer.writeln('🌍 ${widget.tripPlan.tripTitle}');
    buffer.writeln('📍 ${widget.tripPlan.destination} • ${widget.tripPlan.duration}');
    buffer.writeln();
    
    if (widget.tripPlan.introduction.isNotEmpty) {
      buffer.writeln(widget.tripPlan.introduction);
      buffer.writeln();
    }
    
    for (final day in widget.tripPlan.dailyPlans) {
      buffer.writeln('📅 Day ${day.day}: ${day.title}');
      if (day.theme?.isNotEmpty == true) {
        buffer.writeln('🎯 ${day.theme}');
      }
      buffer.writeln();
      
      for (final activity in day.activities) {
        buffer.writeln('⏰ ${activity.timeOfDay}');
        buffer.writeln('📍 ${activity.activityTitle}');
        if (activity.description.isNotEmpty) {
          buffer.writeln('   ${activity.description}');
        }
        if (activity.estimatedCost.isNotEmpty) {
          buffer.writeln('   💰 ${activity.estimatedCost}');
        }
        buffer.writeln();
      }
      
      buffer.writeln('---');
      buffer.writeln();
    }
    
    if (widget.tripPlan.conclusion.isNotEmpty) {
      buffer.writeln(widget.tripPlan.conclusion);
    }
    
    buffer.writeln();
    buffer.writeln('Generated by TravelBuddy Mobile App');
    
    return buffer.toString();
  }
  
  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
  
  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}