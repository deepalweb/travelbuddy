import 'package:flutter/material.dart';

class ProfileCompletionWidget extends StatelessWidget {
  final dynamic user;
  final VoidCallback onTap;

  const ProfileCompletionWidget({
    super.key,
    required this.user,
    required this.onTap,
  });

  Map<String, dynamic> _calculateCompletion() {
    int completed = 0;
    int total = 5;
    List<String> missing = [];

    // Personal info (20%)
    if (user?.username != null && user!.username!.isNotEmpty) {
      completed++;
    } else {
      missing.add('Complete personal info');
    }

    // Profile picture (20%)
    if (user?.profilePicture != null && user!.profilePicture!.isNotEmpty) {
      completed++;
    } else {
      missing.add('Add profile picture');
    }

    // Travel preferences (20%) - TODO: Check when backend ready
    // For now, always mark as incomplete
    missing.add('Set travel preferences');

    // Security (20%) - TODO: Check when backend ready
    // For now, always mark as incomplete
    missing.add('Verify email');

    // Status/Bio (20%)
    if (user?.status != null && user!.status!.isNotEmpty) {
      completed++;
    } else {
      missing.add('Add status or bio');
    }

    return {
      'percentage': (completed / total * 100).round(),
      'completed': completed,
      'total': total,
      'missing': missing,
    };
  }

  @override
  Widget build(BuildContext context) {
    final completion = _calculateCompletion();
    final percentage = completion['percentage'] as int;
    final missing = completion['missing'] as List<String>;

    if (percentage == 100) return const SizedBox.shrink();

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.check_circle_outline, color: Colors.blue[600]),
                  const SizedBox(width: 8),
                  const Text(
                    'Complete Your Profile',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const Spacer(),
                  Text(
                    '$percentage%',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.blue[600],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: percentage / 100,
                  minHeight: 8,
                  backgroundColor: Colors.grey[200],
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.blue[600]!),
                ),
              ),
              if (missing.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  missing.first,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
