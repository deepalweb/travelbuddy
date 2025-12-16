import 'package:flutter/material.dart';
import '../services/api_service.dart';

class SocialLinksScreen extends StatefulWidget {
  const SocialLinksScreen({super.key});

  @override
  State<SocialLinksScreen> createState() => _SocialLinksScreenState();
}

class _SocialLinksScreenState extends State<SocialLinksScreen> {
  List<Map<String, String>> socialLinks = [];
  bool loading = false;

  @override
  void initState() {
    super.initState();
    _loadLinks();
  }

  Future<void> _loadLinks() async {
    try {
      final data = await ApiService().getSocialLinks();
      setState(() => socialLinks = List<Map<String, String>>.from(data));
    } catch (e) {
      // Ignore load errors
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Social Links'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _addLink,
          ),
        ],
      ),
      body: socialLinks.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.link, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('No social links added', style: TextStyle(fontSize: 18)),
                  Text('Tap + to add your social profiles'),
                ],
              ),
            )
          : ListView.builder(
              itemCount: socialLinks.length,
              itemBuilder: (context, index) {
                final link = socialLinks[index];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: ListTile(
                    leading: _getPlatformIcon(link['platform']!),
                    title: Text(link['platform']!.toUpperCase()),
                    subtitle: Text(link['url']!, maxLines: 1, overflow: TextOverflow.ellipsis),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete, color: Colors.red),
                      onPressed: () => _removeLink(index),
                    ),
                  ),
                );
              },
            ),
    );
  }

  void _addLink() {
    String platform = 'instagram';
    String url = '';
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Social Link'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              initialValue: platform,
              decoration: const InputDecoration(labelText: 'Platform'),
              items: ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube']
                  .map((p) => DropdownMenuItem(value: p, child: Text(p.toUpperCase())))
                  .toList(),
              onChanged: (v) => platform = v!,
            ),
            const SizedBox(height: 12),
            TextField(
              decoration: const InputDecoration(labelText: 'URL', hintText: 'https://...'),
              onChanged: (v) => url = v,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (url.isNotEmpty) {
                setState(() => socialLinks.add({'platform': platform, 'url': url}));
                _saveLinks();
                Navigator.pop(context);
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  void _removeLink(int index) {
    setState(() => socialLinks.removeAt(index));
    _saveLinks();
  }

  Future<void> _saveLinks() async {
    try {
      await ApiService().updateSocialLinks(socialLinks);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Social links updated!'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Icon _getPlatformIcon(String platform) {
    switch (platform.toLowerCase()) {
      case 'instagram': return const Icon(Icons.camera_alt, color: Colors.purple);
      case 'facebook': return const Icon(Icons.facebook, color: Colors.blue);
      case 'twitter': return const Icon(Icons.alternate_email, color: Colors.lightBlue);
      case 'linkedin': return const Icon(Icons.business, color: Colors.indigo);
      case 'tiktok': return const Icon(Icons.music_note, color: Colors.black);
      case 'youtube': return const Icon(Icons.play_circle, color: Colors.red);
      default: return const Icon(Icons.link);
    }
  }
}
