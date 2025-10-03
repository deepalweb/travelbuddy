import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../services/usage_limit_service.dart';

class UsageLimitWidget extends StatefulWidget {
  const UsageLimitWidget({super.key});

  @override
  State<UsageLimitWidget> createState() => _UsageLimitWidgetState();
}

class _UsageLimitWidgetState extends State<UsageLimitWidget> {
  final UsageLimitService _limitService = UsageLimitService();
  Map<String, dynamic>? _usageStatus;

  @override
  void initState() {
    super.initState();
    _loadUsageStatus();
  }

  Future<void> _loadUsageStatus() async {
    final user = context.read<AppProvider>().currentUser;
    if (user != null) {
      final status = await _limitService.getUsageStatus(user);
      setState(() => _usageStatus = status);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_usageStatus == null) {
      return const SizedBox.shrink();
    }

    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Today\'s Usage',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            _buildUsageBar('Places', _usageStatus!['places']),
            if (_usageStatus!['aiQueries']['limit'] > 0) ...[
              const SizedBox(height: 8),
              _buildUsageBar('AI Queries', _usageStatus!['aiQueries']),
            ],
            const SizedBox(height: 8),
            _buildUsageBar('Deals', _usageStatus!['deals']),
            const SizedBox(height: 8),
            _buildUsageBar('Posts', _usageStatus!['posts']),
          ],
        ),
      ),
    );
  }

  Widget _buildUsageBar(String label, Map<String, dynamic> data) {
    final used = data['used'] as int;
    final limit = data['limit'] as int;
    final percentage = data['percentage'] as int;
    
    if (limit == -1) {
      return Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text('$used (Unlimited)', style: const TextStyle(color: Colors.green)),
        ],
      );
    }

    Color barColor = Colors.green;
    if (percentage >= 90) barColor = Colors.red;
    else if (percentage >= 80) barColor = Colors.orange;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label),
            Text('$used/$limit', style: TextStyle(color: barColor)),
          ],
        ),
        const SizedBox(height: 4),
        LinearProgressIndicator(
          value: percentage / 100,
          backgroundColor: Colors.grey[300],
          valueColor: AlwaysStoppedAnimation<Color>(barColor),
        ),
      ],
    );
  }
}