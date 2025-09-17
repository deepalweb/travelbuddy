import 'package:flutter/material.dart';

class EnhancedBudgetWidget extends StatefulWidget {
  final dynamic tripPlan;
  
  const EnhancedBudgetWidget({super.key, required this.tripPlan});

  @override
  State<EnhancedBudgetWidget> createState() => _EnhancedBudgetWidgetState();
}

class _EnhancedBudgetWidgetState extends State<EnhancedBudgetWidget> {
  String _selectedCurrency = 'USD';
  final Map<String, double> _exchangeRates = {
    'USD': 1.0,
    'EUR': 0.85,
    'GBP': 0.73,
    'JPY': 110.0,
  };

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildCurrencySelector(),
        const SizedBox(height: 16),
        _buildBudgetBreakdown(),
        const SizedBox(height: 16),
        _buildExpenseTracker(),
        const SizedBox(height: 16),
        _buildBudgetAlerts(),
      ],
    );
  }

  Widget _buildCurrencySelector() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.currency_exchange, color: Colors.green[600]),
                const SizedBox(width: 8),
                const Text('Currency & Exchange', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _selectedCurrency,
                    decoration: const InputDecoration(
                      labelText: 'Display Currency',
                      border: OutlineInputBorder(),
                    ),
                    items: _exchangeRates.keys.map((currency) => 
                      DropdownMenuItem(
                        value: currency,
                        child: Text('$currency (${_getCurrencySymbol(currency)})'),
                      )
                    ).toList(),
                    onChanged: (value) => setState(() => _selectedCurrency = value!),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.green[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Text('1 USD =', style: TextStyle(fontSize: 10, color: Colors.green[600])),
                      Text(
                        '${_exchangeRates[_selectedCurrency]!.toStringAsFixed(2)} $_selectedCurrency',
                        style: TextStyle(fontWeight: FontWeight.bold, color: Colors.green[700]),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBudgetBreakdown() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.pie_chart, color: Colors.blue[600]),
                const SizedBox(width: 8),
                const Text('Budget Breakdown', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 16),
            _buildBudgetCategory('🏨 Accommodation', 450, 500, Colors.blue),
            _buildBudgetCategory('🍽️ Food & Dining', 320, 400, Colors.orange),
            _buildBudgetCategory('🎯 Activities', 180, 200, Colors.green),
            _buildBudgetCategory('🚗 Transportation', 150, 200, Colors.purple),
            _buildBudgetCategory('🛍️ Shopping', 80, 150, Colors.red),
            const SizedBox(height: 12),
            const Divider(),
            _buildBudgetTotal(),
          ],
        ),
      ),
    );
  }

  Widget _buildBudgetCategory(String category, double spent, double budget, Color color) {
    final percentage = spent / budget;
    final convertedSpent = _convertCurrency(spent);
    final convertedBudget = _convertCurrency(budget);
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(category, style: const TextStyle(fontWeight: FontWeight.w500)),
              ),
              Text(
                '${_getCurrencySymbol(_selectedCurrency)}${convertedSpent.toStringAsFixed(0)} / ${_getCurrencySymbol(_selectedCurrency)}${convertedBudget.toStringAsFixed(0)}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: percentage > 0.9 ? Colors.red : color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          LinearProgressIndicator(
            value: percentage.clamp(0.0, 1.0),
            backgroundColor: Colors.grey[200],
            valueColor: AlwaysStoppedAnimation(
              percentage > 1.0 ? Colors.red : 
              percentage > 0.8 ? Colors.orange : color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${(percentage * 100).toStringAsFixed(0)}% used',
            style: TextStyle(
              fontSize: 11,
              color: percentage > 0.9 ? Colors.red : Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBudgetTotal() {
    final totalSpent = 1180.0;
    final totalBudget = 1450.0;
    final convertedSpent = _convertCurrency(totalSpent);
    final convertedBudget = _convertCurrency(totalBudget);
    final remaining = convertedBudget - convertedSpent;
    
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: remaining > 0 ? Colors.green[50] : Colors.red[50],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(
            remaining > 0 ? Icons.trending_up : Icons.warning,
            color: remaining > 0 ? Colors.green[600] : Colors.red[600],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Total: ${_getCurrencySymbol(_selectedCurrency)}${convertedSpent.toStringAsFixed(0)} / ${_getCurrencySymbol(_selectedCurrency)}${convertedBudget.toStringAsFixed(0)}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  remaining > 0 
                    ? 'Remaining: ${_getCurrencySymbol(_selectedCurrency)}${remaining.toStringAsFixed(0)}'
                    : 'Over budget by: ${_getCurrencySymbol(_selectedCurrency)}${(-remaining).toStringAsFixed(0)}',
                  style: TextStyle(
                    fontSize: 12,
                    color: remaining > 0 ? Colors.green[600] : Colors.red[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExpenseTracker() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.receipt_long, color: Colors.purple[600]),
                const SizedBox(width: 8),
                const Text('Recent Expenses', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const Spacer(),
                TextButton.icon(
                  onPressed: _addExpense,
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Add'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildExpenseItem('Hotel Check-in', 150, 'Accommodation', DateTime.now().subtract(const Duration(hours: 2))),
            _buildExpenseItem('Lunch at Cafe', 25, 'Food', DateTime.now().subtract(const Duration(hours: 4))),
            _buildExpenseItem('Metro Tickets', 12, 'Transportation', DateTime.now().subtract(const Duration(hours: 6))),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _scanReceipt,
                    icon: const Icon(Icons.camera_alt, size: 16),
                    label: const Text('Scan Receipt'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _viewAllExpenses,
                    icon: const Icon(Icons.list, size: 16),
                    label: const Text('View All'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExpenseItem(String item, double amount, String category, DateTime date) {
    final convertedAmount = _convertCurrency(amount);
    final timeAgo = _getTimeAgo(date);
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: _getCategoryColor(category).withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(
              _getCategoryIcon(category),
              size: 16,
              color: _getCategoryColor(category),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
                Text('$category • $timeAgo', style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
          ),
          Text(
            '${_getCurrencySymbol(_selectedCurrency)}${convertedAmount.toStringAsFixed(0)}',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildBudgetAlerts() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.notifications_active, color: Colors.orange[600]),
                const SizedBox(width: 8),
                const Text('Budget Alerts', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 12),
            _buildAlert('⚠️', 'Food budget 80% used', 'Consider cheaper dining options', Colors.orange),
            _buildAlert('💡', 'Save 15% on activities', 'City pass available for €45', Colors.blue),
            _buildAlert('📊', 'Daily spending: €95', 'On track with budget', Colors.green),
          ],
        ),
      ),
    );
  }

  Widget _buildAlert(String emoji, String title, String subtitle, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontWeight: FontWeight.w500, color: color)),
                Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  double _convertCurrency(double usdAmount) {
    return usdAmount * _exchangeRates[_selectedCurrency]!;
  }

  String _getCurrencySymbol(String currency) {
    switch (currency) {
      case 'USD': return '\$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      default: return '\$';
    }
  }

  Color _getCategoryColor(String category) {
    switch (category) {
      case 'Accommodation': return Colors.blue;
      case 'Food': return Colors.orange;
      case 'Transportation': return Colors.purple;
      case 'Activities': return Colors.green;
      default: return Colors.grey;
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'Accommodation': return Icons.hotel;
      case 'Food': return Icons.restaurant;
      case 'Transportation': return Icons.directions_car;
      case 'Activities': return Icons.local_activity;
      default: return Icons.receipt;
    }
  }

  String _getTimeAgo(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else {
      return '${difference.inDays}d ago';
    }
  }

  void _addExpense() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Expense'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              decoration: const InputDecoration(
                labelText: 'Description',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              decoration: InputDecoration(
                labelText: 'Amount (${_getCurrencySymbol(_selectedCurrency)})',
                border: const OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(
                labelText: 'Category',
                border: OutlineInputBorder(),
              ),
              items: ['Accommodation', 'Food', 'Transportation', 'Activities', 'Shopping']
                  .map((cat) => DropdownMenuItem(value: cat, child: Text(cat)))
                  .toList(),
              onChanged: (value) {},
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
                const SnackBar(content: Text('💰 Expense added successfully')),
              );
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  void _scanReceipt() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('📸 Receipt scanning feature coming soon!'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  void _viewAllExpenses() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const Text('All Expenses', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            const Expanded(
              child: Center(
                child: Text('Detailed expense history coming soon!'),
              ),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        ),
      ),
    );
  }
}