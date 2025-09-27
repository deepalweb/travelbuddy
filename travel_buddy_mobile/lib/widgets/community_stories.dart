import 'package:flutter/material.dart';

class CommunityStories extends StatelessWidget {
  const CommunityStories({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 100,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 8),
        itemCount: _getStories().length,
        itemBuilder: (context, index) {
          final story = _getStories()[index];
          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 4),
            child: GestureDetector(
              onTap: () => _viewStory(context, story),
              child: Column(
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: story['hasStory'] 
                          ? const LinearGradient(
                              colors: [Colors.purple, Colors.pink, Colors.orange],
                            )
                          : null,
                      color: story['hasStory'] ? null : Colors.grey[300],
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: Container(
                      margin: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: story['hasStory'] ? Colors.grey[300] : Colors.grey[200],
                        image: story['avatar'] != null 
                            ? DecorationImage(
                                image: NetworkImage(story['avatar']),
                                fit: BoxFit.cover,
                              )
                            : null,
                      ),
                      child: story['avatar'] == null 
                          ? Icon(
                              story['isOwn'] ? Icons.add : Icons.person,
                              color: Colors.grey[600],
                              size: story['isOwn'] ? 24 : 20,
                            )
                          : null,
                    ),
                  ),
                  const SizedBox(height: 4),
                  SizedBox(
                    width: 68,
                    child: Text(
                      story['name'],
                      style: const TextStyle(fontSize: 12),
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  List<Map<String, dynamic>> _getStories() {
    return [
      {
        'name': 'Your Story',
        'isOwn': true,
        'hasStory': false,
        'avatar': null,
      },
      {
        'name': 'Alex',
        'isOwn': false,
        'hasStory': true,
        'avatar': null,
        'location': 'Paris, France',
        'time': '2h ago',
      },
      {
        'name': 'Sarah',
        'isOwn': false,
        'hasStory': true,
        'avatar': null,
        'location': 'Tokyo, Japan',
        'time': '4h ago',
      },
      {
        'name': 'Mike',
        'isOwn': false,
        'hasStory': true,
        'avatar': null,
        'location': 'Bali, Indonesia',
        'time': '6h ago',
      },
      {
        'name': 'Emma',
        'isOwn': false,
        'hasStory': false,
        'avatar': null,
        'location': 'New York, USA',
        'time': '8h ago',
      },
    ];
  }

  void _viewStory(BuildContext context, Map<String, dynamic> story) {
    if (story['isOwn'] && !story['hasStory']) {
      // Show create story options
      _showCreateStoryOptions(context);
    } else {
      // Show story viewer
      _showStoryViewer(context, story);
    }
  }

  void _showCreateStoryOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Create Story',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.photo_camera, color: Colors.blue),
              title: const Text('Take Photo'),
              onTap: () {
                Navigator.pop(context);
                // Implement camera functionality
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library, color: Colors.green),
              title: const Text('Choose from Gallery'),
              onTap: () {
                Navigator.pop(context);
                // Implement gallery functionality
              },
            ),
            ListTile(
              leading: const Icon(Icons.text_fields, color: Colors.purple),
              title: const Text('Text Story'),
              onTap: () {
                Navigator.pop(context);
                // Implement text story functionality
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showStoryViewer(BuildContext context, Map<String, dynamic> story) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => StoryViewerScreen(story: story),
      ),
    );
  }
}

class StoryViewerScreen extends StatefulWidget {
  final Map<String, dynamic> story;

  const StoryViewerScreen({super.key, required this.story});

  @override
  State<StoryViewerScreen> createState() => _StoryViewerScreenState();
}

class _StoryViewerScreenState extends State<StoryViewerScreen>
    with TickerProviderStateMixin {
  late AnimationController _progressController;
  
  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      duration: const Duration(seconds: 5),
      vsync: this,
    );
    _progressController.forward();
    _progressController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        Navigator.pop(context);
      }
    });
  }

  @override
  void dispose() {
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTap: () => Navigator.pop(context),
        child: Stack(
          children: [
            // Story content
            Center(
              child: Container(
                width: double.infinity,
                height: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.purple[400]!, Colors.blue[600]!],
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: Colors.white.withOpacity(0.3),
                      child: const Icon(Icons.person, size: 40, color: Colors.white),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      '${widget.story['name']} is in',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                      ),
                    ),
                    Text(
                      widget.story['location'] ?? 'Unknown Location',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      '🌍 Exploring new places!',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Progress bar
            Positioned(
              top: MediaQuery.of(context).padding.top + 10,
              left: 10,
              right: 10,
              child: AnimatedBuilder(
                animation: _progressController,
                builder: (context, child) {
                  return LinearProgressIndicator(
                    value: _progressController.value,
                    backgroundColor: Colors.white.withOpacity(0.3),
                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                  );
                },
              ),
            ),
            
            // Header
            Positioned(
              top: MediaQuery.of(context).padding.top + 30,
              left: 10,
              right: 10,
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: Colors.white.withOpacity(0.3),
                    child: const Icon(Icons.person, size: 16, color: Colors.white),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    widget.story['name'],
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    widget.story['time'] ?? 'now',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.8),
                      fontSize: 12,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close, color: Colors.white),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}