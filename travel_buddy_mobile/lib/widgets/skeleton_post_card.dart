import 'package:flutter/material.dart';

class SkeletonPostCard extends StatelessWidget {
  const SkeletonPostCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          _buildImage(),
          _buildActions(),
          _buildText(),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          _shimmer(const CircleAvatar(radius: 16)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _shimmer(Container(height: 12, width: 120, color: Colors.grey[300])),
                const SizedBox(height: 4),
                _shimmer(Container(height: 10, width: 80, color: Colors.grey[300])),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImage() {
    return _shimmer(Container(height: 300, color: Colors.grey[300]));
  }

  Widget _buildActions() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          _shimmer(Container(height: 24, width: 24, color: Colors.grey[300])),
          const SizedBox(width: 16),
          _shimmer(Container(height: 24, width: 24, color: Colors.grey[300])),
          const SizedBox(width: 16),
          _shimmer(Container(height: 24, width: 24, color: Colors.grey[300])),
        ],
      ),
    );
  }

  Widget _buildText() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _shimmer(Container(height: 10, width: double.infinity, color: Colors.grey[300])),
          const SizedBox(height: 6),
          _shimmer(Container(height: 10, width: 200, color: Colors.grey[300])),
        ],
      ),
    );
  }

  Widget _shimmer(Widget child) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 1000),
      child: child,
    );
  }
}
