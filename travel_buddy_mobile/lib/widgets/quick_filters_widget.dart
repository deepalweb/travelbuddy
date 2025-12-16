import 'package:flutter/material.dart';

class QuickFiltersWidget extends StatelessWidget {
  final Set<String> selectedFilters;
  final Function(String) onFilterToggle;

  const QuickFiltersWidget({
    super.key,
    required this.selectedFilters,
    required this.onFilterToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      children: [
        FilterChip(
          label: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [Icon(Icons.access_time, size: 14), SizedBox(width: 4), Text('Open Now')],
          ),
          selected: selectedFilters.contains('open_now'),
          onSelected: (_) => onFilterToggle('open_now'),
        ),
        FilterChip(
          label: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [Icon(Icons.star, size: 14), SizedBox(width: 4), Text('Top Rated')],
          ),
          selected: selectedFilters.contains('top_rated'),
          onSelected: (_) => onFilterToggle('top_rated'),
        ),
        FilterChip(
          label: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [Icon(Icons.attach_money, size: 14), SizedBox(width: 4), Text('Budget')],
          ),
          selected: selectedFilters.contains('budget'),
          onSelected: (_) => onFilterToggle('budget'),
        ),
      ],
    );
  }
}
