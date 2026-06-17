import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../services/mobile_api_client.dart';
import 'ai_plan_screen.dart';

const _discoverPrimary = Color(0xFF176B5B);
const _discoverNavy = Color(0xFF10233F);
const _discoverSurface = Color(0xFFF5F7F6);
const _discoverBorder = Color(0xFFE1E8E5);

class ExploreScreenRedesigned extends StatefulWidget {
  const ExploreScreenRedesigned({super.key});

  @override
  State<ExploreScreenRedesigned> createState() =>
      _ExploreScreenRedesignedState();
}

class _ExploreScreenRedesignedState extends State<ExploreScreenRedesigned> {
  final _originController = TextEditingController(text: 'Colombo, Sri Lanka');
  final _notesController = TextEditingController();

  int _step = 0;
  bool _isLoading = false;
  String? _error;
  List<_DestinationMatch> _matches = [];

  String _month = _monthNames[DateTime.now().month - 1];
  int _durationDays = 5;
  String _budget = 'mid-range';
  String _travelerType = 'couple';
  final Set<String> _interests = {'food', 'culture'};
  final Set<String> _avoid = {};

  static const _monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  static const _interestOptions = [
    ('beach', 'Beach', Icons.beach_access_outlined),
    ('food', 'Food', Icons.restaurant_outlined),
    ('culture', 'Culture', Icons.museum_outlined),
    ('nature', 'Nature', Icons.terrain_outlined),
    ('romantic', 'Romantic', Icons.favorite_border),
    ('adventure', 'Adventure', Icons.hiking_outlined),
    ('history', 'History', Icons.account_balance_outlined),
    ('relaxation', 'Relaxation', Icons.spa_outlined),
  ];

  static const _avoidOptions = [
    ('crowds', 'Crowds'),
    ('long flights', 'Long flights'),
    ('bad weather', 'Bad weather'),
    ('party nightlife', 'Party areas'),
    ('too much walking', 'Heavy walking'),
    ('high costs', 'High costs'),
  ];

  @override
  void dispose() {
    _originController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _discoverSurface,
      appBar: AppBar(
        backgroundColor: _discoverSurface,
        surfaceTintColor: _discoverSurface,
        elevation: 0,
        title: const Text(
          'Discover',
          style: TextStyle(
            color: _discoverNavy,
            fontWeight: FontWeight.w800,
          ),
        ),
        actions: [
          if (_matches.isNotEmpty)
            TextButton(
              onPressed: _startOver,
              child: const Text('Start over'),
            ),
        ],
      ),
      body: _isLoading
          ? _buildLoading()
          : _matches.isNotEmpty
              ? _buildResults()
              : _buildWizard(),
    );
  }

  Widget _buildWizard() {
    return Column(
      children: [
        _buildProgress(),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(18, 12, 18, 120),
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 220),
              child: KeyedSubtree(
                key: ValueKey(_step),
                child: switch (_step) {
                  0 => _buildTripBasics(),
                  1 => _buildTravelStyle(),
                  _ => _buildPreferences(),
                },
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProgress() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 8, 18, 8),
      child: Row(
        children: List.generate(3, (index) {
          final active = index <= _step;
          return Expanded(
            child: Container(
              height: 5,
              margin: EdgeInsets.only(right: index == 2 ? 0 : 7),
              decoration: BoxDecoration(
                color: active ? _discoverPrimary : const Color(0xFFDDE4E1),
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildTripBasics() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _heading(
          'Where could your next trip take you?',
          'Start with the practical details. We will rank destinations that genuinely fit.',
        ),
        const SizedBox(height: 24),
        _fieldLabel('Leaving from'),
        TextField(
          controller: _originController,
          textCapitalization: TextCapitalization.words,
          decoration: _inputDecoration(
            hint: 'City or country',
            icon: Icons.flight_takeoff_rounded,
          ),
        ),
        const SizedBox(height: 18),
        _fieldLabel('Travel month'),
        DropdownButtonFormField<String>(
          initialValue: _month,
          decoration: _inputDecoration(
            hint: 'Select month',
            icon: Icons.calendar_month_outlined,
          ),
          items: _monthNames
              .map(
                  (month) => DropdownMenuItem(value: month, child: Text(month)))
              .toList(),
          onChanged: (value) => setState(() => _month = value!),
        ),
        const SizedBox(height: 18),
        _fieldLabel('Trip length'),
        _choiceWrap(
          values: const [3, 5, 7, 10, 14],
          selected: _durationDays,
          label: (days) => '$days days',
          onSelected: (days) => setState(() => _durationDays = days),
        ),
        const SizedBox(height: 18),
        _fieldLabel('Budget style'),
        _choiceWrap(
          values: const ['budget', 'mid-range', 'luxury'],
          selected: _budget,
          label: (value) => switch (value) {
            'mid-range' => 'Mid-range',
            'luxury' => 'Luxury',
            _ => 'Budget',
          },
          onSelected: (value) => setState(() => _budget = value),
        ),
        const SizedBox(height: 30),
        _primaryButton(
          label: 'Next: your travel style',
          onPressed: _originController.text.trim().isEmpty
              ? null
              : () => setState(() => _step = 1),
        ),
      ],
    );
  }

  Widget _buildTravelStyle() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _heading(
          'What should this trip feel like?',
          'Choose the traveler type and the experiences that matter most.',
        ),
        const SizedBox(height: 24),
        _fieldLabel('Who is traveling?'),
        _choiceWrap(
          values: const ['solo', 'couple', 'friends', 'family'],
          selected: _travelerType,
          label: (value) => '${value[0].toUpperCase()}${value.substring(1)}',
          onSelected: (value) => setState(() => _travelerType = value),
        ),
        const SizedBox(height: 24),
        _fieldLabel('Travel vibe'),
        const Text(
          'Pick at least one. Your strongest interests influence the ranking.',
          style: TextStyle(color: Colors.black54, fontSize: 13),
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _interestOptions.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 2.45,
          ),
          itemBuilder: (context, index) {
            final option = _interestOptions[index];
            final selected = _interests.contains(option.$1);
            return _selectableTile(
              label: option.$2,
              icon: option.$3,
              selected: selected,
              onTap: () {
                setState(() {
                  selected
                      ? _interests.remove(option.$1)
                      : _interests.add(option.$1);
                });
              },
            );
          },
        ),
        const SizedBox(height: 30),
        Row(
          children: [
            Expanded(child: _backButton()),
            const SizedBox(width: 10),
            Expanded(
              flex: 2,
              child: _primaryButton(
                label: 'Next: avoid bad fits',
                onPressed:
                    _interests.isEmpty ? null : () => setState(() => _step = 2),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPreferences() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _heading(
          'What could ruin the trip?',
          'These preferences help TravelBuddy expose tradeoffs instead of recommending famous places blindly.',
        ),
        const SizedBox(height: 24),
        _fieldLabel('Try to avoid'),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _avoidOptions.map((option) {
            final selected = _avoid.contains(option.$1);
            return FilterChip(
              label: Text(option.$2),
              selected: selected,
              showCheckmark: true,
              selectedColor: const Color(0xFFDDEFEA),
              checkmarkColor: _discoverPrimary,
              side: BorderSide(
                color: selected ? _discoverPrimary : _discoverBorder,
              ),
              onSelected: (_) {
                setState(() {
                  selected ? _avoid.remove(option.$1) : _avoid.add(option.$1);
                });
              },
            );
          }).toList(),
        ),
        const SizedBox(height: 22),
        _fieldLabel('Anything else?'),
        TextField(
          controller: _notesController,
          minLines: 3,
          maxLines: 5,
          decoration: _inputDecoration(
            hint: 'Example: quiet beaches, easy public transport...',
            icon: Icons.edit_note_rounded,
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFECE8),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              _error!,
              style: const TextStyle(color: Color(0xFF9C3425)),
            ),
          ),
        ],
        const SizedBox(height: 30),
        Row(
          children: [
            Expanded(child: _backButton()),
            const SizedBox(width: 10),
            Expanded(
              flex: 2,
              child: _primaryButton(
                label: 'Find My Next Trip',
                icon: Icons.auto_awesome_rounded,
                onPressed: _findDestinations,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildLoading() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(34),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(
              width: 54,
              height: 54,
              child: CircularProgressIndicator(
                color: _discoverPrimary,
                strokeWidth: 5,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Finding destinations that fit',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: _discoverNavy,
                fontSize: 21,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Checking season, budget, travel effort, and your priorities.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600], height: 1.4),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResults() {
    return RefreshIndicator(
      onRefresh: _findDestinations,
      color: _discoverPrimary,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 6, 16, 34),
        children: [
          Text(
            '${_matches.length} destinations matched',
            style: const TextStyle(
              color: _discoverNavy,
              fontSize: 25,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            'Ranked for $_month, $_durationDays days, and a ${_budget.replaceAll('-', ' ')} budget.',
            style: const TextStyle(color: Colors.black54, height: 1.35),
          ),
          const SizedBox(height: 18),
          ..._matches.asMap().entries.map(
                (entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: _destinationCard(entry.value, entry.key),
                ),
              ),
        ],
      ),
    );
  }

  Widget _destinationCard(_DestinationMatch match, int index) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _discoverBorder),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            height: 185,
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (match.image.isNotEmpty)
                  Image.network(
                    match.image,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) =>
                        Container(color: const Color(0xFFDDEFEA)),
                  )
                else
                  Container(color: const Color(0xFFDDEFEA)),
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, Color(0xD910233F)],
                    ),
                  ),
                ),
                Positioned(
                  top: 14,
                  left: 14,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      index == 0 ? 'Best match' : '#${index + 1} match',
                      style: const TextStyle(
                        color: _discoverNavy,
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  right: 14,
                  top: 14,
                  child: _scoreBadge(match.matchScore),
                ),
                Positioned(
                  left: 16,
                  right: 16,
                  bottom: 15,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        match.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        [match.parentDestination, match.country]
                            .where((value) => value.isNotEmpty)
                            .join(', '),
                        style: const TextStyle(
                          color: Color(0xFFE7EFED),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  match.tagline,
                  style: const TextStyle(
                    color: _discoverNavy,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 7,
                  runSpacing: 7,
                  children: [
                    if (match.estimatedCost.isNotEmpty)
                      _infoChip(Icons.payments_outlined, match.estimatedCost),
                    if (match.weatherLabel.isNotEmpty)
                      _infoChip(Icons.wb_sunny_outlined, match.weatherLabel),
                    if (match.flightLabel.isNotEmpty)
                      _infoChip(Icons.flight_outlined, match.flightLabel),
                    if (match.budgetFit.isNotEmpty)
                      _fitChip('Budget', match.budgetFit),
                    if (match.weatherFit.isNotEmpty)
                      _fitChip('Weather', match.weatherFit),
                    if (match.crowdRisk.isNotEmpty)
                      _fitChip('Crowds', match.crowdRisk),
                  ],
                ),
                if (match.tripFeeling.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 7,
                    runSpacing: 7,
                    children: match.tripFeeling
                        .take(3)
                        .map((feeling) => _softLabel(feeling))
                        .toList(),
                  ),
                ],
                if (match.whyFits.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  const Text(
                    'Why it fits',
                    style: TextStyle(
                      color: _discoverNavy,
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 7),
                  ...match.whyFits.take(3).map(
                        (reason) => _reasonRow(
                          Icons.check_circle_outline_rounded,
                          reason,
                          _discoverPrimary,
                        ),
                      ),
                ],
                if (match.bestVersion.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEAF3FF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Best version',
                          style: TextStyle(
                            color: Color(0xFF0B4F8A),
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 5),
                        Text(
                          match.bestVersion,
                          style: const TextStyle(
                            color: Color(0xFF244A68),
                            fontSize: 12,
                            height: 1.35,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                if (match.risks.isNotEmpty || match.caution.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF5DF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Watchouts',
                          style: TextStyle(
                            color: Color(0xFF9A6300),
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 5),
                        ...match.risks.take(2).map(
                              (risk) => _reasonRow(
                                Icons.warning_amber_rounded,
                                risk,
                                const Color(0xFFC47C00),
                              ),
                            ),
                        if (match.risks.isEmpty)
                          Text(
                            match.caution,
                            style: const TextStyle(
                              color: Color(0xFF6B542B),
                              fontSize: 12,
                              height: 1.35,
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: () => _planTrip(match),
                    style: FilledButton.styleFrom(
                      backgroundColor: _discoverPrimary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    icon: const Icon(Icons.route_rounded),
                    label: const Text(
                      'Plan This Trip',
                      style: TextStyle(fontWeight: FontWeight.w800),
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

  Widget _scoreBadge(int score) {
    return Container(
      width: 58,
      height: 58,
      decoration: BoxDecoration(
        color: _discoverPrimary,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 3),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            '$score%',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w900,
            ),
          ),
          const Text(
            'MATCH',
            style: TextStyle(
              color: Color(0xFFD9EEE9),
              fontSize: 7,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _findDestinations() async {
    FocusScope.of(context).unfocus();
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await MobileApiClient.instance.dio.post<dynamic>(
        '/api/ai/discovery-recommendations',
        data: {
          'origin': _originController.text.trim(),
          'month': _month,
          'durationDays': _durationDays,
          'budget': _budget,
          'travelerType': _travelerType,
          'interests': _interests.toList(),
          'avoid': _avoid.toList(),
          'tripNotes': _notesController.text.trim(),
        },
        options: Options(receiveTimeout: const Duration(seconds: 90)),
      );

      final body = response.data;
      final rawMatches = body is Map
          ? (body['recommendations'] as List? ?? const [])
          : const [];
      final matches = rawMatches
          .whereType<Map>()
          .map((item) =>
              _DestinationMatch.fromJson(Map<String, dynamic>.from(item)))
          .where((item) => item.name.isNotEmpty)
          .toList();

      if (matches.isEmpty) {
        throw Exception('No strong destination matches were found.');
      }

      if (!mounted) return;
      setState(() {
        _matches = matches;
        _isLoading = false;
      });
    } on DioException catch (error) {
      final message = error.response?.data is Map
          ? error.response?.data['error']?.toString()
          : null;
      _showDiscoveryError(
        message ?? 'Could not reach destination discovery. Please try again.',
      );
    } catch (error) {
      _showDiscoveryError(error.toString().replaceFirst('Exception: ', ''));
    }
  }

  void _showDiscoveryError(String message) {
    if (!mounted) return;
    setState(() {
      _isLoading = false;
      _error = message;
      _step = 2;
    });
  }

  void _planTrip(_DestinationMatch match) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AIPlanScreen(
          initialDestination: match.destination,
          initialDurationDays: _durationDays,
          initialBudget: _budget,
          initialTravelerType: _travelerType,
          initialInterests: _interests.toList(),
          initialAvoid: _avoid.toList(),
          autoGenerateOnOpen: true,
        ),
      ),
    );
  }

  void _startOver() {
    setState(() {
      _matches = [];
      _step = 0;
      _error = null;
    });
  }

  Widget _heading(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: _discoverNavy,
            fontSize: 27,
            fontWeight: FontWeight.w800,
            height: 1.08,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          subtitle,
          style: const TextStyle(
            color: Colors.black54,
            fontSize: 14,
            height: 1.45,
          ),
        ),
      ],
    );
  }

  Widget _fieldLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        label,
        style: const TextStyle(
          color: _discoverNavy,
          fontSize: 14,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }

  InputDecoration _inputDecoration({
    required String hint,
    required IconData icon,
  }) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(icon, color: _discoverPrimary),
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: _discoverBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: _discoverPrimary, width: 1.5),
      ),
    );
  }

  Widget _choiceWrap<T>({
    required List<T> values,
    required T selected,
    required String Function(T value) label,
    required ValueChanged<T> onSelected,
  }) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: values.map((value) {
        final isSelected = value == selected;
        return ChoiceChip(
          label: Text(label(value)),
          selected: isSelected,
          selectedColor: const Color(0xFFDDEFEA),
          side: BorderSide(
            color: isSelected ? _discoverPrimary : _discoverBorder,
          ),
          labelStyle: TextStyle(
            color: isSelected ? _discoverPrimary : _discoverNavy,
            fontWeight: FontWeight.w700,
          ),
          onSelected: (_) => onSelected(value),
        );
      }).toList(),
    );
  }

  Widget _selectableTile({
    required String label,
    required IconData icon,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return Material(
      color: selected ? const Color(0xFFDDEFEA) : Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? _discoverPrimary : _discoverBorder,
            ),
          ),
          child: Row(
            children: [
              Icon(icon, color: _discoverPrimary, size: 21),
              const SizedBox(width: 9),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    color: _discoverNavy,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              if (selected)
                const Icon(Icons.check_circle,
                    color: _discoverPrimary, size: 18),
            ],
          ),
        ),
      ),
    );
  }

  Widget _primaryButton({
    required String label,
    required VoidCallback? onPressed,
    IconData? icon,
  }) {
    return SizedBox(
      width: double.infinity,
      child: FilledButton(
        onPressed: onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: _discoverPrimary,
          disabledBackgroundColor: const Color(0xFFB7C7C2),
          padding: const EdgeInsets.symmetric(vertical: 15),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(13),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 19),
              const SizedBox(width: 8),
            ],
            Text(label, style: const TextStyle(fontWeight: FontWeight.w800)),
          ],
        ),
      ),
    );
  }

  Widget _backButton() {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(
        onPressed: () => setState(() => _step = (_step - 1).clamp(0, 2)),
        style: OutlinedButton.styleFrom(
          foregroundColor: _discoverNavy,
          padding: const EdgeInsets.symmetric(vertical: 15),
          side: const BorderSide(color: _discoverBorder),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(13),
          ),
        ),
        child: const Text('Back'),
      ),
    );
  }

  Widget _infoChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: _discoverSurface,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: _discoverPrimary, size: 15),
          const SizedBox(width: 5),
          Text(
            label,
            style: const TextStyle(
              color: _discoverNavy,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _fitChip(String label, String value) {
    final tone = value.toLowerCase();
    final isWarning = tone.contains('weak') ||
        tone.contains('stretch') ||
        tone.contains('high');
    final isStrong = tone.contains('strong') ||
        tone.contains('excellent') ||
        tone.contains('low');
    final background = isWarning
        ? const Color(0xFFFFF5DF)
        : isStrong
            ? const Color(0xFFEAF8EF)
            : const Color(0xFFEAF3FF);
    final foreground = isWarning
        ? const Color(0xFF9A6300)
        : isStrong
            ? const Color(0xFF176B5B)
            : const Color(0xFF0B4F8A);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        '$label: $value',
        style: TextStyle(
          color: foreground,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _softLabel(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF2F4F3),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.black54,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _reasonRow(IconData icon, String text, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 17),
          const SizedBox(width: 7),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: Colors.black87,
                fontSize: 12,
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DestinationMatch {
  final String destination;
  final String name;
  final String parentDestination;
  final String country;
  final String image;
  final String tagline;
  final int matchScore;
  final String estimatedCost;
  final String weatherLabel;
  final String flightLabel;
  final String budgetFit;
  final String weatherFit;
  final String crowdRisk;
  final List<String> tripFeeling;
  final List<String> whyFits;
  final List<String> risks;
  final String bestVersion;
  final String caution;

  const _DestinationMatch({
    required this.destination,
    required this.name,
    required this.parentDestination,
    required this.country,
    required this.image,
    required this.tagline,
    required this.matchScore,
    required this.estimatedCost,
    required this.weatherLabel,
    required this.flightLabel,
    required this.budgetFit,
    required this.weatherFit,
    required this.crowdRisk,
    required this.tripFeeling,
    required this.whyFits,
    required this.risks,
    required this.bestVersion,
    required this.caution,
  });

  factory _DestinationMatch.fromJson(Map<String, dynamic> json) {
    List<String> strings(dynamic value) {
      return value is List
          ? value
              .map((item) => item.toString())
              .where((item) => item.isNotEmpty)
              .toList()
          : const [];
    }

    return _DestinationMatch(
      destination: (json['destination'] ?? json['name'] ?? '').toString(),
      name: (json['name'] ?? json['destination'] ?? '').toString(),
      parentDestination: (json['parentDestination'] ?? '').toString(),
      country: (json['country'] ?? '').toString(),
      image: (json['image'] ?? '').toString(),
      tagline: (json['tagline'] ?? 'A strong fit for your travel priorities.')
          .toString(),
      matchScore: ((json['matchScore'] ?? json['score'] ?? 0) as num)
          .round()
          .clamp(0, 100),
      estimatedCost: (json['estimatedTripCost'] ?? '').toString(),
      weatherLabel: (json['weatherLabel'] ?? '').toString(),
      flightLabel: (json['flightLabel'] ?? '').toString(),
      budgetFit: (json['budgetFit'] ?? '').toString(),
      weatherFit: (json['weatherFit'] ?? '').toString(),
      crowdRisk: (json['crowdRisk'] ?? '').toString(),
      tripFeeling: strings(json['tripFeeling']),
      whyFits: strings(json['whyItFits'] ?? json['whyFits']),
      risks: strings(json['risks']),
      bestVersion: (json['bestVersion'] ?? json['bestVersionOfThisTrip'] ?? '')
          .toString(),
      caution: (json['caution'] ?? '').toString(),
    );
  }
}
