import 'package:flutter/material.dart';

class TravelStyleFilter extends StatefulWidget {
  final List<String> selectedStyles;
  final Function(List<String>) onStylesChanged;

  const TravelStyleFilter({
    super.key,
    required this.selectedStyles,
    required this.onStylesChanged,
  });

  @override
  State<TravelStyleFilter> createState() => _TravelStyleFilterState();
}

class _TravelStyleFilterState extends State<TravelStyleFilter> {
  final Map<String, FilterOption> _filters = {
    'Foodie': FilterOption(
      icon: Icons.restaurant,
      color: const Color(0xFFFF6B35),
      gradient: const LinearGradient(
        colors: [Color(0xFFFF6B35), Color(0xFFFF8C42)],
      ),
    ),
    'Explorer': FilterOption(
      icon: Icons.explore,
      color: const Color(0xFF4361EE),
      gradient: const LinearGradient(
        colors: [Color(0xFF4361EE), Color(0xFF2EC4B6)],
      ),
    ),
    'Relaxer': FilterOption(
      icon: Icons.spa,
      color: const Color(0xFF2EC4B6),
      gradient: const LinearGradient(
        colors: [Color(0xFF2EC4B6), Color(0xFF4ECDC4)],
      ),
    ),
    'Budget': FilterOption(
      icon: Icons.attach_money,
      color: const Color(0xFF06D6A0),
      gradient: const LinearGradient(
        colors: [Color(0xFF06D6A0), Color(0xFF26D6A0)],
      ),
    ),
    'Family': FilterOption(
      icon: Icons.family_restroom,
      color: const Color(0xFFEF476F),
      gradient: const LinearGradient(
        colors: [Color(0xFFEF476F), Color(0xFFFF6B9D)],
      ),
    ),
    'Solo Safe': FilterOption(
      icon: Icons.shield,
      color: const Color(0xFF7209B7),
      gradient: const LinearGradient(
        colors: [Color(0xFF7209B7), Color(0xFF9D4EDD)],
      ),
    ),
    'Wheelchair': FilterOption(
      icon: Icons.accessible,
      color: const Color(0xFF118AB2),
      gradient: const LinearGradient(
        colors: [Color(0xFF118AB2), Color(0xFF06D6A0)],
      ),
    ),
    'Quiet': FilterOption(
      icon: Icons.volume_off,
      color: const Color(0xFF8D99AE),
      gradient: const LinearGradient(
        colors: [Color(0xFF8D99AE), Color(0xFFADB5BD)],
      ),
    ),
  };

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: _filters.entries.map((entry) {
            final isSelected = widget.selectedStyles.contains(entry.key);
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: _buildFilterChip(
                entry.key,
                entry.value,
                isSelected,
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, FilterOption option, bool isSelected) {
    return GestureDetector(
      onTap: () {
        setState(() {
          final newStyles = List<String>.from(widget.selectedStyles);
          if (isSelected) {
            newStyles.remove(label);
          } else {
            newStyles.add(label);
          }
          widget.onStylesChanged(newStyles);
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          gradient: isSelected ? option.gradient : null,
          color: isSelected ? null : Colors.grey[100],
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isSelected ? Colors.transparent : Colors.grey[300]!,
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              option.icon,
              size: 18,
              color: isSelected ? Colors.white : option.color,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isSelected ? Colors.white : Colors.grey[800],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class FilterOption {
  final IconData icon;
  final Color color;
  final Gradient gradient;

  FilterOption({
    required this.icon,
    required this.color,
    required this.gradient,
  });
}
