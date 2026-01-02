import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:convert';
import '../models/place.dart';
import '../constants/app_constants.dart';

class DealDetailScreen extends StatefulWidget {
  final Deal deal;

  const DealDetailScreen({super.key, required this.deal});

  @override
  State<DealDetailScreen> createState() => _DealDetailScreenState();
}

class _DealDetailScreenState extends State<DealDetailScreen> {
  int _currentImageIndex = 0;
  bool _showTerms = false;
  bool _showMap = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.deal.title),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () => _shareDeal(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Gallery
            if (widget.deal.images.isNotEmpty)
              Stack(
                children: [
                  SizedBox(
                    height: 250,
                    child: PageView.builder(
                      itemCount: widget.deal.images.length,
                      onPageChanged: (index) => setState(() => _currentImageIndex = index),
                      itemBuilder: (context, index) => _buildImage(widget.deal.images[index]),
                    ),
                  ),
                  if (widget.deal.images.length > 1)
                    Positioned(
                      bottom: 10,
                      right: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${_currentImageIndex + 1}/${widget.deal.images.length}',
                          style: const TextStyle(color: Colors.white, fontSize: 12),
                        ),
                      ),
                    ),
                ],
              ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Discount Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      widget.deal.discount,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Title & Business
                  Text(
                    widget.deal.title,
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'at ${widget.deal.businessName}',
                    style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 16),

                  // Pricing
                  if (widget.deal.price != null)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.green[50],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.attach_money, color: Colors.green),
                          Text(
                            '${widget.deal.price!.amount.toStringAsFixed(2)} ${widget.deal.price!.currencyCode}',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 16),

                  // Description
                  Text(
                    'Description',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.deal.description,
                    style: const TextStyle(fontSize: 16, height: 1.5),
                  ),
                  const SizedBox(height: 16),

                  // Business Info
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.deal.businessName,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          widget.deal.businessType.toUpperCase(),
                          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                        ),
                        if (widget.deal.businessAddress != null) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(Icons.location_on, size: 16, color: Colors.grey[600]),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  widget.deal.businessAddress!,
                                  style: TextStyle(fontSize: 14, color: Colors.grey[700]),
                                ),
                              ),
                            ],
                          ),
                        ],
                        if (widget.deal.businessPhone != null) ...[
                          const SizedBox(height: 8),
                          GestureDetector(
                            onTap: () => _makeCall(context, widget.deal.businessPhone!),
                            child: Row(
                              children: [
                                Icon(Icons.phone, size: 16, color: Colors.blue[700]),
                                const SizedBox(width: 6),
                                Text(
                                  widget.deal.businessPhone!,
                                  style: TextStyle(fontSize: 14, color: Colors.blue[700]),
                                ),
                              ],
                            ),
                          ),
                        ],
                        if (widget.deal.businessWebsite != null) ...[
                          const SizedBox(height: 8),
                          GestureDetector(
                            onTap: () => _openWebsite(context, widget.deal.businessWebsite!),
                            child: Row(
                              children: [
                                Icon(Icons.language, size: 16, color: Colors.blue[700]),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    widget.deal.businessWebsite!,
                                    style: TextStyle(fontSize: 14, color: Colors.blue[700]),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Social Links
                  if (widget.deal.contactInfo != null && _hasSocialLinks())
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Connect',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 12,
                            children: [
                              if (widget.deal.contactInfo!.whatsapp != null)
                                _buildSocialIcon(Icons.chat, Colors.green, () => _openUrl('https://wa.me/${widget.deal.contactInfo!.whatsapp}')),
                              if (widget.deal.contactInfo!.facebook != null)
                                _buildSocialIcon(Icons.facebook, Colors.blue[800]!, () => _openUrl(widget.deal.contactInfo!.facebook!)),
                              if (widget.deal.contactInfo!.instagram != null)
                                _buildSocialIcon(Icons.camera_alt, Colors.pink, () => _openUrl(widget.deal.contactInfo!.instagram!)),
                              if (widget.deal.contactInfo!.email != null)
                                _buildSocialIcon(Icons.email, Colors.red, () => _openUrl('mailto:${widget.deal.contactInfo!.email}')),
                            ],
                          ),
                        ],
                      ),
                    ),
                  if (widget.deal.contactInfo != null && _hasSocialLinks())
                    const SizedBox(height: 16),

                  // Location Map Toggle
                  if (widget.deal.location?.lat != null)
                    GestureDetector(
                      onTap: () => setState(() => _showMap = !_showMap),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.blue[50],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.map, color: Colors.blue[700]),
                            const SizedBox(width: 8),
                            Text(
                              _showMap ? 'Hide Map' : 'Show Location Map',
                              style: TextStyle(color: Colors.blue[700], fontWeight: FontWeight.bold),
                            ),
                            const Spacer(),
                            Icon(_showMap ? Icons.expand_less : Icons.expand_more, color: Colors.blue[700]),
                          ],
                        ),
                      ),
                    ),
                  if (_showMap && widget.deal.location?.lat != null)
                    Container(
                      margin: const EdgeInsets.only(top: 8),
                      height: 200,
                      decoration: BoxDecoration(
                        color: Colors.grey[200],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey[300]!),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.map, size: 48, color: Colors.grey[600]),
                            const SizedBox(height: 8),
                            Text('Map View', style: TextStyle(color: Colors.grey[600])),
                            Text('${widget.deal.location!.lat}, ${widget.deal.location!.lng}', 
                              style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                          ],
                        ),
                      ),
                    ),
                  if (widget.deal.location?.lat != null)
                    const SizedBox(height: 16),

                  // Terms & Conditions Toggle
                  GestureDetector(
                    onTap: () => setState(() => _showTerms = !_showTerms),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.orange[50],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.info_outline, color: Colors.orange[700]),
                          const SizedBox(width: 8),
                          Text(
                            'Terms & Conditions',
                            style: TextStyle(color: Colors.orange[700], fontWeight: FontWeight.bold),
                          ),
                          const Spacer(),
                          Icon(_showTerms ? Icons.expand_less : Icons.expand_more, color: Colors.orange[700]),
                        ],
                      ),
                    ),
                  ),
                  if (_showTerms)
                    Container(
                      margin: const EdgeInsets.only(top: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey[300]!),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildTermItem('Valid until ${_formatDate(widget.deal.validUntil)}'),
                          _buildTermItem('One redemption per customer'),
                          _buildTermItem('Cannot be combined with other offers'),
                          _buildTermItem('Subject to availability'),
                          _buildTermItem('Present this deal at time of purchase'),
                        ],
                      ),
                    ),
                  const SizedBox(height: 16),

                  // Stats
                  Row(
                    children: [
                      _buildStat(Icons.visibility, '${widget.deal.views}', 'Views'),
                      const SizedBox(width: 20),
                      _buildStat(Icons.local_offer, '${widget.deal.claims}', 'Claimed'),
                      const SizedBox(width: 20),
                      _buildStat(Icons.schedule, _formatDate(widget.deal.validUntil), 'Valid Until'),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Action Buttons
                  SafeArea(
                    child: Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _claimDeal(context),
                            icon: const Icon(Icons.local_offer),
                            label: const Text('Claim Deal'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Color(AppConstants.colors['primary']!),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        OutlinedButton.icon(
                          onPressed: () => _getDirections(context),
                          icon: const Icon(Icons.directions),
                          label: const Text('Directions'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool _hasSocialLinks() {
    final contact = widget.deal.contactInfo;
    return contact?.whatsapp != null || contact?.facebook != null || 
           contact?.instagram != null || contact?.email != null;
  }

  Widget _buildSocialIcon(IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: color, size: 24),
      ),
    );
  }

  Widget _buildTermItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('• ', style: TextStyle(color: Colors.grey[700], fontSize: 16)),
          Expanded(
            child: Text(
              text,
              style: TextStyle(color: Colors.grey[700], fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImage(String imageData) {
    if (imageData.startsWith('data:image')) {
      try {
        final base64String = imageData.split(',')[1];
        final bytes = base64Decode(base64String);
        return Image.memory(
          bytes,
          fit: BoxFit.cover,
          width: double.infinity,
        );
      } catch (e) {
        return Container(
          color: Colors.grey[300],
          child: const Icon(Icons.image, size: 50),
        );
      }
    }
    
    return Image.network(
      imageData,
      fit: BoxFit.cover,
      width: double.infinity,
      errorBuilder: (context, error, stackTrace) => Container(
        color: Colors.grey[300],
        child: const Icon(Icons.image, size: 50),
      ),
    );
  }

  Widget _buildStat(IconData icon, String value, String label) {
    return Column(
      children: [
        Icon(icon, size: 20, color: Colors.grey[600]),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        Text(
          label,
          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  void _claimDeal(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.qr_code, color: Color(AppConstants.colors['primary']!)),
            const SizedBox(width: 8),
            const Text('Claim Deal'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Icon(Icons.qr_code_2, size: 120, color: Colors.grey[800]),
                  const SizedBox(height: 8),
                  Text(
                    'Redemption Code',
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                  Text(
                    'DEAL${widget.deal.id.substring(0, 8).toUpperCase()}',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 2),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Show this code at ${widget.deal.businessName} to redeem your deal',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Colors.grey[700]),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Deal claimed successfully!'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            child: const Text('Claim'),
          ),
        ],
      ),
    );
  }

  void _getDirections(BuildContext context) async {
    print('DEBUG: deal.location = ${widget.deal.location}');
    print('DEBUG: deal.location?.lat = ${widget.deal.location?.lat}');
    print('DEBUG: deal.location?.lng = ${widget.deal.location?.lng}');
    print('DEBUG: deal.location?.coordinates = ${widget.deal.location?.coordinates}');
    
    // Use GPS coordinates if available
    if (widget.deal.location?.lat != null && widget.deal.location?.lng != null) {
      final lat = widget.deal.location!.lat;
      final lng = widget.deal.location!.lng;
      print('DEBUG: Using coordinates: $lat, $lng');
      
      final url = 'https://maps.google.com/maps?q=$lat,$lng';
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    } else if (widget.deal.location?.coordinates != null && widget.deal.location!.coordinates.length >= 2) {
      // Try coordinates array [lng, lat]
      final lng = widget.deal.location!.coordinates[0];
      final lat = widget.deal.location!.coordinates[1];
      print('DEBUG: Using coordinates array: $lat, $lng');
      
      final url = 'https://maps.google.com/maps?q=$lat,$lng';
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    } else if (widget.deal.businessAddress != null) {
      print('DEBUG: Using address: ${widget.deal.businessAddress}');
      final url = 'https://maps.google.com/?q=${Uri.encodeComponent(widget.deal.businessAddress!)}';
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    } else {
      print('DEBUG: Using business name: ${widget.deal.businessName}');
      final url = 'https://maps.google.com/?q=${Uri.encodeComponent(widget.deal.businessName)}';
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    }
  }

  void _makeCall(BuildContext context, String phoneNumber) async {
    final url = 'tel:$phoneNumber';
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cannot make call')),
      );
    }
  }

  void _openWebsite(BuildContext context, String website) async {
    String url = website;
    if (!url.startsWith('http')) {
      url = 'https://$url';
    }
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cannot open website')),
      );
    }
  }

  void _openUrl(String url) async {
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    }
  }

  void _shareDeal(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Sharing ${widget.deal.title}...'),
        backgroundColor: Color(AppConstants.colors['primary']!),
      ),
    );
  }
}
