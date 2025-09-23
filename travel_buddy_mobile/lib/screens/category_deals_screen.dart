import 'package:flutter/material.dart';
import '../models/place.dart';
import '../widgets/deal_card.dart';
import '../constants/app_constants.dart';

class CategoryDealsScreen extends StatefulWidget {
  final String category;
  final List<Deal> deals;

  const CategoryDealsScreen({
    super.key,
    required this.category,
    required this.deals,
  });

  @override
  State<CategoryDealsScreen> createState() => _CategoryDealsScreenState();
}

class _CategoryDealsScreenState extends State<CategoryDealsScreen> {
  List<Deal> _displayedDeals = [];
  bool _isLoadingMore = false;
  int _currentPage = 1;
  static const int _dealsPerPage = 10;

  @override
  void initState() {
    super.initState();
    _loadInitialDeals();
  }

  void _loadInitialDeals() {
    _displayedDeals = widget.deals.take(_dealsPerPage).toList();
  }

  void _loadMoreDeals() {
    if (_isLoadingMore) return;
    
    setState(() {
      _isLoadingMore = true;
    });

    // Simulate loading delay
    Future.delayed(const Duration(milliseconds: 500), () {
      final startIndex = _currentPage * _dealsPerPage;
      final endIndex = (startIndex + _dealsPerPage).clamp(0, widget.deals.length);
      
      if (startIndex < widget.deals.length) {
        final newDeals = widget.deals.sublist(startIndex, endIndex);
        setState(() {
          _displayedDeals.addAll(newDeals);
          _currentPage++;
          _isLoadingMore = false;
        });
      } else {
        setState(() {
          _isLoadingMore = false;
        });
      }
    });
  }

  String _getCategoryEmoji(String category) {
    switch (category) {
      case 'Stay & Travel': return '🏨';
      case 'Food & Drink': return '🍴';
      case 'Shopping': return '🛍️';
      case 'Experiences': return '🎉';
      case 'Wellness': return '💆';
      default: return '🎯';
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasMoreDeals = _displayedDeals.length < widget.deals.length;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Text(_getCategoryEmoji(widget.category), style: const TextStyle(fontSize: 20)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                widget.category,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 1,
      ),
      body: Column(
        children: [
          // Header Stats
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Color(AppConstants.colors['primary']!).withOpacity(0.1),
                  Color(AppConstants.colors['primary']!).withOpacity(0.05),
                ],
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${widget.deals.length} ${widget.category} Deals',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Save up to 70% on ${widget.category.toLowerCase()}',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          
          // Deals Grid
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.75,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: _displayedDeals.length + (hasMoreDeals ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _displayedDeals.length) {
                  // Load More Button
                  return _buildLoadMoreCard();
                }
                
                final deal = _displayedDeals[index];
                return DealCard(
                  deal: deal,
                  onTap: () => _showDealDetails(deal),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadMoreCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: _isLoadingMore ? null : _loadMoreDeals,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: Color(AppConstants.colors['primary']!).withOpacity(0.3),
              width: 2,
              style: BorderStyle.solid,
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (_isLoadingMore)
                const CircularProgressIndicator()
              else ...[
                Icon(
                  Icons.add_circle_outline,
                  size: 48,
                  color: Color(AppConstants.colors['primary']!),
                ),
                const SizedBox(height: 8),
                Text(
                  'Load More',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(AppConstants.colors['primary']!),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${widget.deals.length - _displayedDeals.length} more deals',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _showDealDetails(Deal deal) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              
              // Deal details
              Text(
                deal.title,
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'at ${deal.placeName}',
                style: TextStyle(fontSize: 16, color: Colors.grey[600]),
              ),
              const SizedBox(height: 16),
              
              // Price
              Row(
                children: [
                  Text(
                    deal.originalPrice != null ? '\$${deal.originalPrice!.toInt()}' : 'N/A',
                    style: const TextStyle(
                      decoration: TextDecoration.lineThrough,
                      fontSize: 18,
                      color: Colors.grey,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    deal.discountedPrice != null ? '\$${deal.discountedPrice!.toInt()}' : deal.price?.amount.toStringAsFixed(0) ?? 'N/A',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      deal.discount,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              // Description
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  child: Text(
                    deal.description,
                    style: const TextStyle(fontSize: 16, height: 1.5),
                  ),
                ),
              ),
              
              // Action buttons
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Close'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _purchaseDeal(deal);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(AppConstants.colors['primary']!),
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Get Deal'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _purchaseDeal(Deal deal) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Purchase ${deal.title}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (deal.originalPrice != null) Text('Original Price: \$${deal.originalPrice!.toInt()}'),
            if (deal.discountedPrice != null) Text('Deal Price: \$${deal.discountedPrice!.toInt()}'),
            const SizedBox(height: 16),
            const Text('This feature requires a subscription plan.'),
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
                  content: Text('Purchase feature coming soon!'),
                  backgroundColor: Colors.blue,
                ),
              );
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}