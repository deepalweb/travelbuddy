import 'package:flutter/material.dart';

class SearchBarWidget extends StatefulWidget {
  final TextEditingController controller;
  final Function(String) onSearch;
  final String? hintText;

  const SearchBarWidget({
    super.key,
    required this.controller,
    required this.onSearch,
    this.hintText,
  });

  @override
  State<SearchBarWidget> createState() => _SearchBarWidgetState();
}

class _SearchBarWidgetState extends State<SearchBarWidget> {
  @override
  void initState() {
    super.initState();
    widget.controller.addListener(() {
      setState(() {}); // Rebuild when text changes
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: TextField(
        controller: widget.controller,
        onSubmitted: widget.onSearch,
        onChanged: (value) {
          // Trigger search on every change for real-time results
          if (value.length >= 2 || value.isEmpty) {
            widget.onSearch(value);
          }
        },
        decoration: InputDecoration(
          hintText: widget.hintText ?? 'Search restaurants, attractions...',
          prefixIcon: const Icon(Icons.search),
          suffixIcon: widget.controller.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    widget.controller.clear();
                    widget.onSearch('');
                  },
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
        ),
      ),
    );
  }
}