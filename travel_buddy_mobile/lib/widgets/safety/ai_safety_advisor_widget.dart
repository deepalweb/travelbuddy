import 'package:flutter/material.dart';
import '../../services/enhanced_safety_service.dart';

class AISafetyAdvisorWidget extends StatefulWidget {
  final double? latitude;
  final double? longitude;
  final String? location;

  const AISafetyAdvisorWidget({
    super.key,
    this.latitude,
    this.longitude,
    this.location,
  });

  @override
  State<AISafetyAdvisorWidget> createState() => _AISafetyAdvisorWidgetState();
}

class _AISafetyAdvisorWidgetState extends State<AISafetyAdvisorWidget> {
  final EnhancedSafetyService _safetyService = EnhancedSafetyService();
  final TextEditingController _questionController = TextEditingController();
  final List<Map<String, dynamic>> _conversation = [];
  bool _isLoading = false;

  final List<String> _quickQuestions = [
    'Is this area safe at night?',
    'What precautions should I take here?',
    'How to contact local embassy?',
    'What are common scams here?',
    'Emergency numbers for this location?',
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF29382F),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.psychology, color: Colors.blue, size: 20),
              ),
              const SizedBox(width: 12),
              const Text(
                'AI Safety Advisor',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Quick questions
          if (_conversation.isEmpty) ...[
            const Text(
              'Ask me anything about safety:',
              style: TextStyle(color: Colors.grey, fontSize: 14),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _quickQuestions.map((question) => 
                _buildQuickQuestionChip(question)
              ).toList(),
            ),
            const SizedBox(height: 16),
          ],
          
          // Conversation history
          if (_conversation.isNotEmpty) ...[
            Container(
              height: 200,
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.3),
                borderRadius: BorderRadius.circular(8),
              ),
              child: ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: _conversation.length,
                itemBuilder: (context, index) {
                  final message = _conversation[index];
                  return _buildMessageBubble(message);
                },
              ),
            ),
            const SizedBox(height: 16),
          ],
          
          // Input field
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _questionController,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'Ask about safety...',
                    hintStyle: const TextStyle(color: Colors.grey),
                    filled: true,
                    fillColor: Colors.black.withOpacity(0.3),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                  ),
                  onSubmitted: _isLoading ? null : _askQuestion,
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: _isLoading ? null : () => _askQuestion(_questionController.text),
                icon: _isLoading 
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send, color: Colors.blue),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickQuestionChip(String question) {
    return GestureDetector(
      onTap: () => _askQuestion(question),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.blue.withOpacity(0.2),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.blue.withOpacity(0.3)),
        ),
        child: Text(
          question,
          style: const TextStyle(
            color: Colors.blue,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

  Widget _buildMessageBubble(Map<String, dynamic> message) {
    final isUser = message['isUser'] as bool;
    final text = message['text'] as String;
    final confidence = message['confidence'] as int?;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: Colors.blue,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.psychology, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isUser ? Colors.blue : Colors.grey.withOpacity(0.3),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    text,
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                  ),
                  if (!isUser && confidence != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.verified,
                          color: _getConfidenceColor(confidence),
                          size: 12,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Confidence: $confidence/10',
                          style: TextStyle(
                            color: _getConfidenceColor(confidence),
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 8),
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: Colors.grey,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.person, color: Colors.white, size: 16),
            ),
          ],
        ],
      ),
    );
  }

  Color _getConfidenceColor(int confidence) {
    if (confidence >= 8) return Colors.green;
    if (confidence >= 6) return Colors.orange;
    return Colors.red;
  }

  Future<void> _askQuestion(String question) async {
    if (question.trim().isEmpty || _isLoading) return;

    setState(() {
      _isLoading = true;
      _conversation.add({
        'text': question,
        'isUser': true,
        'timestamp': DateTime.now(),
      });
    });

    _questionController.clear();

    try {
      final response = await _safetyService.askAISafetyAdvisor(
        question,
        latitude: widget.latitude,
        longitude: widget.longitude,
        location: widget.location,
      );

      if (response != null) {
        setState(() {
          _conversation.add({
            'text': response['answer'] ?? 'Sorry, I couldn\'t process that question.',
            'isUser': false,
            'confidence': response['confidence'],
            'timestamp': DateTime.now(),
          });
        });
      } else {
        setState(() {
          _conversation.add({
            'text': 'Sorry, I\'m having trouble connecting. Please try again.',
            'isUser': false,
            'confidence': 0,
            'timestamp': DateTime.now(),
          });
        });
      }
    } catch (e) {
      setState(() {
        _conversation.add({
          'text': 'An error occurred. Please try again.',
          'isUser': false,
          'confidence': 0,
          'timestamp': DateTime.now(),
        });
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _questionController.dispose();
    super.dispose();
  }
}