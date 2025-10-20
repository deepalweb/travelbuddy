import 'package:flutter/material.dart';
import '../models/place_model.dart';
import '../services/place_service.dart';

class PlaceDetailsWidget extends StatefulWidget {
  final Place place;

  const PlaceDetailsWidget({Key? key, required this.place}) : super(key: key);

  @override
  State<PlaceDetailsWidget> createState() => _PlaceDetailsWidgetState();
}

class _PlaceDetailsWidgetState extends State<PlaceDetailsWidget> {
  final PlaceService _placeService = PlaceService();
  Place? _detailedPlace;
  bool _isLoadingReviews = false;

  @override
  void initState() {
    super.initState();
    _detailedPlace = widget.place;
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Expanded(
                  child: Text(
                    _detailedPlace!.name,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                ),
                if (_detailedPlace!.priceLevel != null)
                  Text(
                    _detailedPlace!.priceLevel!,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),

            // Rating
            if (_detailedPlace!.rating != null)
              Row(
                children: [
                  ...List.generate(5, (index) {
                    return Icon(
                      index < _detailedPlace!.rating!.floor()
                          ? Icons.star
                          : Icons.star_border,
                      color: Colors.amber,
                      size: 20,
                    );
                  }),
                  const SizedBox(width: 8),
                  Text('${_detailedPlace!.rating!.toStringAsFixed(1)}'),
                  if (_detailedPlace!.reviewCount != null)
                    Text(' (${_detailedPlace!.reviewCount} reviews)'),
                ],
              ),

            const SizedBox(height: 16),

            // Address
            Row(
              children: [
                const Icon(Icons.location_on, size: 20),
                const SizedBox(width: 8),
                Expanded(child: Text(_detailedPlace!.address)),
              ],
            ),

            // Phone
            if (_detailedPlace!.phone != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.phone, size: 20),
                  const SizedBox(width: 8),
                  Text(_detailedPlace!.phone!),
                ],
              ),
            ],

            // Website
            if (_detailedPlace!.website != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.web, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _detailedPlace!.website!,
                      style: const TextStyle(
                        color: Colors.blue,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                ],
              ),
            ],

            // Opening Hours
            if (_detailedPlace!.openingHours != null) ...[
              const SizedBox(height: 16),
              Text(
                'Opening Hours',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: _detailedPlace!.openingHours!.openNow
                      ? Colors.green.shade50
                      : Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          _detailedPlace!.openingHours!.openNow
                              ? Icons.check_circle
                              : Icons.cancel,
                          color: _detailedPlace!.openingHours!.openNow
                              ? Colors.green
                              : Colors.red,
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _detailedPlace!.openingHours!.openNow
                              ? 'Open Now'
                              : 'Closed',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: _detailedPlace!.openingHours!.openNow
                                ? Colors.green
                                : Colors.red,
                          ),
                        ),
                      ],
                    ),
                    ...(_detailedPlace!.openingHours!.weekdayText
                        .map((day) => Text(day, style: const TextStyle(fontSize: 12)))),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 16),

            // Load Reviews Button
            if (!_detailedPlace!.hasReviews)
              Center(
                child: ElevatedButton.icon(
                  onPressed: _isLoadingReviews ? null : _loadReviews,
                  icon: _isLoadingReviews
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.star),
                  label: Text(_isLoadingReviews ? 'Loading...' : 'Load Reviews & Details'),
                ),
              ),

            // Reviews
            if (_detailedPlace!.reviews != null && _detailedPlace!.reviews!.isNotEmpty) ...[
              Text(
                'Reviews',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              ...(_detailedPlace!.reviews!.take(3).map((review) => ReviewCard(review: review))),
              if (_detailedPlace!.reviews!.length > 3)
                TextButton(
                  onPressed: () => _showAllReviews(context),
                  child: Text('View all ${_detailedPlace!.reviews!.length} reviews'),
                ),
            ],
          ],
        ),
      ),
    );
  }

  void _loadReviews() async {
    setState(() => _isLoadingReviews = true);

    try {
      final detailedPlace = await _placeService.getPlaceDetails(
        _detailedPlace!.id,
        includeReviews: true,
      );

      if (detailedPlace != null) {
        setState(() {
          _detailedPlace = detailedPlace;
          _isLoadingReviews = false;
        });
      } else {
        setState(() => _isLoadingReviews = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not load additional details')),
        );
      }
    } catch (e) {
      setState(() => _isLoadingReviews = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading reviews: $e')),
      );
    }
  }

  void _showAllReviews(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Text(
                'All Reviews',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 16),
              Expanded(
                child: ListView.builder(
                  controller: scrollController,
                  itemCount: _detailedPlace!.reviews!.length,
                  itemBuilder: (context, index) => ReviewCard(
                    review: _detailedPlace!.reviews![index],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ReviewCard extends StatelessWidget {
  final Review review;

  const ReviewCard({Key? key, required this.review}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    review.author,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                Row(
                  children: List.generate(5, (index) {
                    return Icon(
                      index < review.rating.floor()
                          ? Icons.star
                          : Icons.star_border,
                      color: Colors.amber,
                      size: 16,
                    );
                  }),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              review.text,
              style: const TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 4),
            Text(
              '${review.time.day}/${review.time.month}/${review.time.year}',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}