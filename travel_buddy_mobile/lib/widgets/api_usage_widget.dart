import 'package:flutter/material.dart';
import '../services/places_service.dart';

class ApiUsageWidget extends StatefulWidget {
  const ApiUsageWidget({Key? key}) : super(key: key);

  @override
  State<ApiUsageWidget> createState() => _ApiUsageWidgetState();
}

class _ApiUsageWidgetState extends State<ApiUsageWidget> {
  Map<String, dynamic>? _usageStats;

  @override
  void initState() {
    super.initState();
    _loadUsageStats();
  }

  void _loadUsageStats() {
    setState(() {
      _usageStats = PlacesService().getApiUsageStats();
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_usageStats == null) return const SizedBox.shrink();

    final used = _usageStats!['used'] as int;
    final limit = _usageStats!['limit'] as int;
    final percentage = _usageStats!['percentage'] as int;
    final tier = _usageStats!['tier'] as String;

    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Daily API Usage',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Chip(
                  label: Text(tier.toUpperCase()),
                  backgroundColor: _getTierColor(tier),
                ),
              ],
            ),
            const SizedBox(height: 12),
            LinearProgressIndicator(
              value: percentage / 100,
              backgroundColor: Colors.grey[300],
              valueColor: AlwaysStoppedAnimation<Color>(
                percentage > 80 ? Colors.red : Colors.green,
              ),
            ),
            const SizedBox(height: 8),
            Text('$used / $limit calls used ($percentage%)'),
            if (percentage > 80) ...[
              const SizedBox(height: 8),
              Text(
                'Approaching daily limit!',
                style: TextStyle(color: Colors.red[700], fontWeight: FontWeight.bold),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Color _getTierColor(String tier) {
    switch (tier) {
      case 'free': return Colors.grey;
      case 'basic': return Colors.blue;
      case 'premium': return Colors.purple;
      case 'pro': return Colors.gold;
      default: return Colors.grey;
    }
  }
}