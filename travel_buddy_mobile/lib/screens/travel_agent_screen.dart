import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/travel_agent_provider.dart';
import '../models/travel_agent_model.dart';
import '../widgets/loading_spinner.dart';

class TravelAgentScreen extends StatefulWidget {
  const TravelAgentScreen({super.key});

  @override
  State<TravelAgentScreen> createState() => _TravelAgentScreenState();
}

class _TravelAgentScreenState extends State<TravelAgentScreen> with TickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TravelAgentProvider>().loadAgents();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Travel Agents'),
        backgroundColor: Colors.orange[600],
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(text: 'Find Agents', icon: Icon(Icons.search)),
            Tab(text: 'Top Rated', icon: Icon(Icons.star)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildFindAgentsTab(),
          _buildTopRatedTab(),
        ],
      ),
    );
  }

  Widget _buildFindAgentsTab() {
    return Consumer<TravelAgentProvider>(
      builder: (context, provider, child) {
        return Column(
          children: [
            _buildSearchBar(provider),
            _buildFilters(provider),
            Expanded(
              child: provider.isLoading
                  ? const Center(child: LoadingSpinner())
                  : provider.filteredAgents.isEmpty
                      ? _buildEmptyState()
                      : _buildAgentsList(provider.filteredAgents),
            ),
          ],
        );
      },
    );
  }

  Widget _buildTopRatedTab() {
    return Consumer<TravelAgentProvider>(
      builder: (context, provider, child) {
        final topRated = provider.agents.where((a) => a.rating >= 4.5).toList()
          ..sort((a, b) => b.rating.compareTo(a.rating));
        
        return provider.isLoading
            ? const Center(child: LoadingSpinner())
            : topRated.isEmpty
                ? _buildEmptyState()
                : _buildAgentsList(topRated);
      },
    );
  }

  Widget _buildSearchBar(TravelAgentProvider provider) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.orange[50],
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Search by location...',
          prefixIcon: const Icon(Icons.search),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    provider.setLocation(null);
                    provider.loadAgents();
                  },
                )
              : null,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          filled: true,
          fillColor: Colors.white,
        ),
        onChanged: (value) {
          provider.setLocation(value);
        },
        onSubmitted: (value) {
          provider.loadAgents();
        },
      ),
    );
  }

  Widget _buildFilters(TravelAgentProvider provider) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _buildFilterChip(
              'Specialty',
              provider.selectedSpecialty ?? 'All',
              () => _showSpecialtyDialog(provider),
            ),
            const SizedBox(width: 8),
            _buildFilterChip(
              'Language',
              provider.selectedLanguage ?? 'All',
              () => _showLanguageDialog(provider),
            ),
            const SizedBox(width: 8),
            _buildFilterChip(
              'Rating',
              provider.minRating != null ? '${provider.minRating}+' : 'All',
              () => _showRatingDialog(provider),
            ),
            const SizedBox(width: 8),
            if (provider.selectedSpecialty != null ||
                provider.selectedLanguage != null ||
                provider.minRating != null)
              TextButton.icon(
                onPressed: () {
                  provider.clearFilters();
                  provider.loadAgents();
                },
                icon: const Icon(Icons.clear, size: 16),
                label: const Text('Clear'),
                style: TextButton.styleFrom(
                  foregroundColor: Colors.orange[700],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, String value, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.orange[100],
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.orange[300]!),
        ),
        child: Text(
          '$label: $value',
          style: TextStyle(
            color: Colors.orange[700],
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildAgentsList(List<TravelAgentModel> agents) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: agents.length,
      itemBuilder: (context, index) {
        final agent = agents[index];
        return _buildAgentCard(agent);
      },
    );
  }

  Widget _buildAgentCard(TravelAgentModel agent) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () => _showAgentDetails(agent),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundImage: NetworkImage(agent.photo),
                    onBackgroundImageError: (_, __) {},
                    child: agent.photo.isEmpty
                        ? const Icon(Icons.person, size: 30)
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                agent.name,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                            if (agent.verified)
                              const Icon(
                                Icons.verified,
                                color: Colors.blue,
                                size: 20,
                              ),
                          ],
                        ),
                        Text(
                          agent.agency,
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.star, color: Colors.amber, size: 16),
                            const SizedBox(width: 4),
                            Text(
                              '${agent.rating} (${agent.reviewCount})',
                              style: const TextStyle(fontSize: 12),
                            ),
                            const SizedBox(width: 12),
                            const Icon(Icons.work, size: 14, color: Colors.grey),
                            const SizedBox(width: 4),
                            Text(
                              '${agent.experience} years',
                              style: const TextStyle(fontSize: 12),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.location_on, size: 14, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    agent.location,
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: agent.specializations.take(3).map((spec) {
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.orange[100],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      spec,
                      style: TextStyle(
                        color: Colors.orange[700],
                        fontSize: 10,
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _showAgentDetails(agent),
                      icon: const Icon(Icons.info_outline, size: 16),
                      label: const Text('Details'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _contactAgent(agent),
                      icon: const Icon(Icons.message, size: 16),
                      label: const Text('Contact'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange[600],
                        foregroundColor: Colors.white,
                      ),
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

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'No travel agents found',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Try adjusting your search criteria',
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }

  void _showSpecialtyDialog(TravelAgentProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Specialty'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            'All',
            'Adventure',
            'Cultural',
            'Wildlife',
            'Beach',
            'Historical',
            'Luxury'
          ].map((spec) => ListTile(
                title: Text(spec),
                onTap: () {
                  provider.setSpecialty(spec == 'All' ? null : spec);
                  provider.loadAgents();
                  Navigator.pop(context);
                },
              )).toList(),
        ),
      ),
    );
  }

  void _showLanguageDialog(TravelAgentProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Language'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: ['All', 'English', 'Sinhala', 'Tamil', 'Hindi']
              .map((lang) => ListTile(
                    title: Text(lang),
                    onTap: () {
                      provider.setLanguage(lang == 'All' ? null : lang);
                      provider.loadAgents();
                      Navigator.pop(context);
                    },
                  ))
              .toList(),
        ),
      ),
    );
  }

  void _showRatingDialog(TravelAgentProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Minimum Rating'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('All Ratings'),
              onTap: () {
                provider.setMinRating(null);
                provider.loadAgents();
                Navigator.pop(context);
              },
            ),
            ListTile(
              title: const Text('4.0+ Stars'),
              onTap: () {
                provider.setMinRating(4.0);
                provider.loadAgents();
                Navigator.pop(context);
              },
            ),
            ListTile(
              title: const Text('4.5+ Stars'),
              onTap: () {
                provider.setMinRating(4.5);
                provider.loadAgents();
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showAgentDetails(TravelAgentModel agent) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SingleChildScrollView(
            controller: scrollController,
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
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
                Center(
                  child: CircleAvatar(
                    radius: 50,
                    backgroundImage: NetworkImage(agent.photo),
                  ),
                ),
                const SizedBox(height: 16),
                Center(
                  child: Column(
                    children: [
                      Text(
                        agent.name,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        agent.agency,
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                _buildDetailRow('Location', agent.location),
                _buildDetailRow('Experience', '${agent.experience} years'),
                _buildDetailRow('Price Range', agent.priceRange),
                _buildDetailRow('Response Time', agent.responseTime),
                _buildDetailRow('Total Trips', agent.totalTrips.toString()),
                const SizedBox(height: 20),
                const Text(
                  'About',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(agent.description),
                const SizedBox(height: 20),
                const Text(
                  'Specializations',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: agent.specializations.map((spec) => Chip(
                    label: Text(spec),
                    backgroundColor: Colors.orange[100],
                  )).toList(),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Languages',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: agent.languages.map((lang) => Chip(
                    label: Text(lang),
                    backgroundColor: Colors.blue[100],
                  )).toList(),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _callAgent(agent),
                        icon: const Icon(Icons.phone),
                        label: const Text('Call'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _emailAgent(agent),
                        icon: const Icon(Icons.email),
                        label: const Text('Email'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.orange[600],
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(
            child: Text(value),
          ),
        ],
      ),
    );
  }

  void _contactAgent(TravelAgentModel agent) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Contact ${agent.name}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.phone, color: Colors.green),
              title: const Text('Call'),
              onTap: () {
                Navigator.pop(context);
                _callAgent(agent);
              },
            ),
            ListTile(
              leading: const Icon(Icons.email, color: Colors.orange),
              title: const Text('Email'),
              onTap: () {
                Navigator.pop(context);
                _emailAgent(agent);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _callAgent(TravelAgentModel agent) async {
    final Uri phoneUri = Uri(scheme: 'tel', path: agent.phone);
    if (await canLaunchUrl(phoneUri)) {
      await launchUrl(phoneUri);
    }
  }

  void _emailAgent(TravelAgentModel agent) async {
    final Uri emailUri = Uri(
      scheme: 'mailto',
      path: agent.email,
      query: 'subject=Travel Inquiry',
    );
    if (await canLaunchUrl(emailUri)) {
      await launchUrl(emailUri);
    }
  }
}
