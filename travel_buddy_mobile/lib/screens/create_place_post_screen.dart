import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../providers/community_provider.dart';
import '../providers/app_provider.dart';
import '../services/image_service.dart';
import '../widgets/location_autocomplete_field.dart';
import '../widgets/enhanced_location_picker_map.dart';

class CreatePlacePostScreen extends StatefulWidget {
  const CreatePlacePostScreen({super.key});

  @override
  State<CreatePlacePostScreen> createState() => _CreatePlacePostScreenState();
}

class _CreatePlacePostScreenState extends State<CreatePlacePostScreen> {
  int _currentStep = 0;
  final _placeController = TextEditingController();
  final _tipController = TextEditingController();
  bool _isPosting = false;
  List<XFile> _selectedImages = [];
  final ImageService _imageService = ImageService();
  DateTime? _visitDate;
  String _visitTime = 'morning';
  bool _verifiedVisit = false;
  String _tipQuality = '';

  @override
  void initState() {
    super.initState();
    _imageService.initialize();
    _tipController.addListener(_validateTip);
  }

  @override
  void dispose() {
    _placeController.dispose();
    _tipController.dispose();
    super.dispose();
  }

  void _validateTip() {
    final tip = _tipController.text;
    final tipLower = tip.toLowerCase();
    final actionVerbs = ['go', 'ask', 'bring', 'avoid', 'try', 'skip', 'order', 'visit', 'take', 'wear'];
    final hasActionVerb = actionVerbs.any((verb) => tipLower.startsWith(verb));
    
    setState(() {
      if (tip.isEmpty) {
        _tipQuality = '';
      } else if (tip.length < 10) {
        _tipQuality = 'short';
      } else if (!hasActionVerb) {
        _tipQuality = 'vague';
      } else if (tip.length >= 20) {
        _tipQuality = 'excellent';
      } else {
        _tipQuality = 'good';
      }
      print('Tip: "$tip" | Length: ${tip.length} | HasVerb: $hasActionVerb | Quality: $_tipQuality');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Place Tip'),
        backgroundColor: const Color(0xFF4361EE),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Column(
        children: [
          _buildProgressIndicator(),
          Expanded(
            child: SingleChildScrollView(
              child: _buildCurrentStep(),
            ),
          ),
          _buildBottomBar(),
        ],
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))],
      ),
      child: Row(
        children: [
          _buildStepIndicator(0, '📍', 'Place'),
          Expanded(child: Container(height: 2, color: _currentStep > 0 ? const Color(0xFF4361EE) : Colors.grey[300])),
          _buildStepIndicator(1, '💡', 'Tip'),
          Expanded(child: Container(height: 2, color: _currentStep > 1 ? const Color(0xFF4361EE) : Colors.grey[300])),
          _buildStepIndicator(2, '📸', 'Context'),
        ],
      ),
    );
  }

  Widget _buildStepIndicator(int step, String emoji, String label) {
    final isActive = _currentStep == step;
    final isCompleted = _currentStep > step;
    return Column(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: isCompleted ? const Color(0xFF2EC4B6) : (isActive ? const Color(0xFF4361EE) : Colors.grey[200]),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              isCompleted ? '✓' : emoji,
              style: TextStyle(fontSize: 20, color: isActive || isCompleted ? Colors.white : Colors.grey[600]),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 12, fontWeight: isActive ? FontWeight.bold : FontWeight.normal)),
      ],
    );
  }

  Widget _buildCurrentStep() {
    switch (_currentStep) {
      case 0:
        return _buildPlaceSelection();
      case 1:
        return _buildTipInput();
      case 2:
        return _buildContextInput();
      default:
        return const SizedBox();
    }
  }

  Widget _buildPlaceSelection() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('🗺️ SELECT PLACE', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Which place do you want to share a tip about?', style: TextStyle(fontSize: 14, color: Colors.grey)),
          const SizedBox(height: 24),
          Container(
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: LocationAutocompleteField(
              controller: _placeController,
              hintText: '🔍 Search places...',
              onLocationSelected: (location, lat, lng) {
                print('✅ Place selected: $location');
              },
            ),
          ),
          const SizedBox(height: 16),
          const Text('OR', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.grey), textAlign: TextAlign.center),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    // TODO: Get current location
                  },
                  icon: const Icon(Icons.my_location, size: 20),
                  label: const Text('Use Current Location'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF4361EE),
                    side: const BorderSide(color: Color(0xFF4361EE)),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => EnhancedLocationPickerMap(
                          onLocationSelected: (location, lat, lng) {
                            setState(() => _placeController.text = location);
                          },
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.map, size: 20),
                  label: const Text('Pick on Map'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF2EC4B6),
                    side: const BorderSide(color: Color(0xFF2EC4B6)),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ],
          ),
          if (_placeController.text.isNotEmpty) ...[
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF8F9FA),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF4361EE).withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF4361EE).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.place, color: Color(0xFF4361EE)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_placeController.text, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 4),
                        const Text('12 tips already shared', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTipInput() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('💡 SHARE YOUR INSIGHT', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('What\'s your #1 tip for travelers?', style: TextStyle(fontSize: 14, color: Colors.grey)),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF8E1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFF6B35).withOpacity(0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _tipController,
                  maxLines: 4,
                  maxLength: 100,
                  style: const TextStyle(fontSize: 16, height: 1.4),
                  decoration: const InputDecoration(
                    hintText: 'Go before 7PM to avoid crowds and get the best light for photos.',
                    hintStyle: TextStyle(color: Colors.grey),
                    border: InputBorder.none,
                    counterText: '',
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text('${_tipController.text.length}/100', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                    const Spacer(),
                    if (_tipQuality == 'excellent')
                      const Row(
                        children: [
                          Icon(Icons.check_circle, size: 16, color: Color(0xFF2EC4B6)),
                          SizedBox(width: 4),
                          Text('Actionable!', style: TextStyle(fontSize: 12, color: Color(0xFF2EC4B6), fontWeight: FontWeight.w600)),
                        ],
                      )
                    else if (_tipQuality == 'good')
                      const Row(
                        children: [
                          Icon(Icons.check_circle, size: 16, color: Color(0xFF2EC4B6)),
                          SizedBox(width: 4),
                          Text('Good tip!', style: TextStyle(fontSize: 12, color: Color(0xFF2EC4B6), fontWeight: FontWeight.w600)),
                        ],
                      )
                    else if (_tipQuality == 'short')
                      const Row(
                        children: [
                          Icon(Icons.warning, size: 16, color: Color(0xFFFF6B35)),
                          SizedBox(width: 4),
                          Text('Add more detail', style: TextStyle(fontSize: 12, color: Color(0xFFFF6B35))),
                        ],
                      )
                    else if (_tipQuality == 'vague')
                      const Row(
                        children: [
                          Icon(Icons.info, size: 16, color: Color(0xFFFF6B35)),
                          SizedBox(width: 4),
                          Text('Start with action verb', style: TextStyle(fontSize: 12, color: Color(0xFFFF6B35))),
                        ],
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFE3F2FD),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Row(
              children: [
                Icon(Icons.lightbulb_outline, size: 20, color: Color(0xFF4361EE)),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Good tips start with: Go, Ask, Bring, Avoid, Try, Skip, Order, Visit',
                    style: TextStyle(fontSize: 12, color: Color(0xFF4361EE)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContextInput() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('📸 ADD CONTEXT', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Optional but helps others trust your tip', style: TextStyle(fontSize: 14, color: Colors.grey)),
          const SizedBox(height: 24),
          const Text('Photos (Up to 4)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          const Text('Show the place, not selfies', style: TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 12),
          SizedBox(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _selectedImages.length + (_selectedImages.length < 4 ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _selectedImages.length) {
                  return Container(
                    width: 100,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey[300]!, width: 2),
                    ),
                    child: InkWell(
                      onTap: _pickImages,
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_photo_alternate, color: Colors.grey, size: 32),
                          SizedBox(height: 4),
                          Text('Add', style: TextStyle(fontSize: 12, color: Colors.grey)),
                        ],
                      ),
                    ),
                  );
                }
                return Container(
                  width: 100,
                  margin: const EdgeInsets.only(right: 8),
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.file(File(_selectedImages[index].path), width: 100, height: 100, fit: BoxFit.cover),
                      ),
                      Positioned(
                        top: 4,
                        right: 4,
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedImages.removeAt(index)),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                            child: const Icon(Icons.close, color: Colors.white, size: 16),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 24),
          const Text('When did you visit?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now(),
                      firstDate: DateTime(2020),
                      lastDate: DateTime.now(),
                    );
                    if (date != null) setState(() => _visitDate = date);
                  },
                  icon: const Icon(Icons.calendar_today, size: 18),
                  label: Text(_visitDate == null ? 'Select Date' : '${_visitDate!.day}/${_visitDate!.month}/${_visitDate!.year}'),
                  style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _visitTime,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'morning', child: Text('🌅 Morning')),
                    DropdownMenuItem(value: 'afternoon', child: Text('☀️ Afternoon')),
                    DropdownMenuItem(value: 'evening', child: Text('🌙 Evening')),
                  ],
                  onChanged: (value) => setState(() => _visitTime = value!),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          CheckboxListTile(
            value: _verifiedVisit,
            onChanged: (value) => setState(() => _verifiedVisit = value!),
            title: const Text('✅ I visited this place', style: TextStyle(fontSize: 14)),
            subtitle: const Text('Builds trust in your tip', style: TextStyle(fontSize: 12)),
            controlAffinity: ListTileControlAffinity.leading,
            contentPadding: EdgeInsets.zero,
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 8, offset: const Offset(0, -2))],
      ),
      child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => _currentStep--),
                style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                child: const Text('Back'),
              ),
            ),
          if (_currentStep > 0) const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: _canProceed() ? (_currentStep == 2 ? _submitPost : () => setState(() => _currentStep++)) : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4361EE),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                disabledBackgroundColor: Colors.grey[300],
              ),
              child: _isPosting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(_currentStep == 2 ? 'POST TIP' : 'NEXT', style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  bool _canProceed() {
    switch (_currentStep) {
      case 0:
        return _placeController.text.isNotEmpty;
      case 1:
        return _tipController.text.length >= 10 && (_tipQuality == 'excellent' || _tipQuality == 'good');
      case 2:
        return true;
      default:
        return false;
    }
  }

  Future<void> _pickImages() async {
    final images = await _imageService.pickImages(maxImages: 4);
    setState(() => _selectedImages = images);
  }

  Future<void> _submitPost() async {
    setState(() => _isPosting = true);

    List<String> imageUrls = [];
    if (_selectedImages.isNotEmpty) {
      try {
        imageUrls = await _imageService.uploadImages(_selectedImages);
      } catch (e) {
        print('Image upload failed: $e');
      }
    }

    final success = await context.read<CommunityProvider>().createPost(
      content: _tipController.text.trim(),
      location: _placeController.text.trim(),
      postType: 'tip',
      images: imageUrls,
      hashtags: [],
      allowComments: true,
      visibility: 'public',
      context: context,
    );

    setState(() => _isPosting = false);

    if (success) {
      Navigator.of(context).pop(true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('✅ Tip posted successfully!'), backgroundColor: Color(0xFF2EC4B6)),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Failed to post tip'), backgroundColor: Colors.red),
      );
    }
  }
}
