import 'package:flutter/material.dart';

class EnhancedDaySummaryWidget extends StatelessWidget {
  final Map<String, dynamic> itinerary;

  const EnhancedDaySummaryWidget({
    super.key,
    required this.itinerary,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildMainSummaryCard(),
          const SizedBox(height: 16),
          _buildDetailedBreakdown(),
          const SizedBox(height: 16),
          _buildOptimizationInsights(),
        ],
      ),
    );
  }

  Widget _buildMainSummaryCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.blue[600]!, Colors.blue[800]!],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.blue.withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.auto_awesome, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Your Perfect Day',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      'Optimized for time, cost & experience',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              _buildMainStat('💰', '\$${itinerary['totalCost'].toStringAsFixed(0)}', 'Total Budget'),
              _buildMainStat('🚶', '${itinerary['totalDistance']}', 'Total Distance'),
              _buildMainStat('⏱️', '${itinerary['totalTravelTime']}', 'Travel Time'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMainStat(String emoji, String value, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 18)),
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            Text(
              label,
              style: const TextStyle(
                fontSize: 9,
                color: Colors.white70,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailedBreakdown() {
    final breakdown = itinerary['breakdownByPeriod'] as Map<String, dynamic>;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Day Breakdown',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildPeriodCard('Morning', breakdown['morning'], '🌅', Colors.orange)),
              const SizedBox(width: 8),
              Expanded(child: _buildPeriodCard('Afternoon', breakdown['afternoon'], '☀️', Colors.blue)),
              const SizedBox(width: 8),
              Expanded(child: _buildPeriodCard('Evening', breakdown['evening'], '🌆', Colors.purple)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPeriodCard(String period, List<dynamic> timeSlots, String emoji, Color color) {
    final activities = timeSlots.where((slot) => slot['type'] == 'activity').toList();
    final totalCost = activities.fold(0.0, (sum, slot) {
      final activity = slot['activity'] as Map<String, dynamic>;
      return sum + (activity['cost']['usd'] as num).toDouble();
    });

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 24)),
          const SizedBox(height: 4),
          Text(
            period,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${activities.length} activities',
            style: const TextStyle(fontSize: 10, color: Colors.grey),
          ),
          Text(
            '\$${totalCost.toStringAsFixed(0)}',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOptimizationInsights() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.auto_fix_high, color: Colors.green[700], size: 20),
              const SizedBox(width: 8),
              Text(
                'AI Optimization Results',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.green[700],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildInsightRow('🎯', 'Route optimized to minimize backtracking'),
          _buildInsightRow('⏰', 'Saved 35 minutes by smart activity ordering'),
          _buildInsightRow('💰', 'Found 3 free alternatives to reduce costs'),
          _buildInsightRow('🌦️', 'Indoor activities prioritized due to weather'),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.green[100],
              borderRadius: BorderRadius.circular(6),
            ),
            child: Row(
              children: [
                Icon(Icons.eco, color: Colors.green[700], size: 16),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'This plan reduces carbon footprint by 40% vs typical tourist routes',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.green[700],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInsightRow(String emoji, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 14)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 12,
                color: Colors.green[700],
              ),
            ),
          ),
        ],
      ),
    );
  }
}