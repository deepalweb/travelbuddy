class EventModel {
  final String id;
  final String title;
  final String description;
  final String category;
  final String imageUrl;
  final String location;
  final DateTime startDate;
  final DateTime endDate;
  final String venue;
  final double? ticketPrice;
  final String? ticketUrl;
  final bool isFree;
  final List<String> tags;
  final String organizer;

  EventModel({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.imageUrl,
    required this.location,
    required this.startDate,
    required this.endDate,
    required this.venue,
    this.ticketPrice,
    this.ticketUrl,
    required this.isFree,
    required this.tags,
    required this.organizer,
  });

  factory EventModel.fromJson(Map<String, dynamic> json) {
    final location = json['location'];
    final locationStr = location is Map 
        ? '${location['city'] ?? ''}, ${location['country'] ?? ''}'
        : location?.toString() ?? '';
    
    return EventModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? json['name']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      category: json['category']?.toString() ?? '',
      imageUrl: json['imageUrl']?.toString() ?? json['image']?.toString() ?? '',
      location: locationStr,
      startDate: DateTime.tryParse(json['startDate'] ?? json['date'] ?? '') ?? DateTime.now(),
      endDate: DateTime.tryParse(json['endDate'] ?? json['date'] ?? '') ?? DateTime.now(),
      venue: json['venue']?.toString() ?? (location is Map ? location['address']?.toString() : null) ?? locationStr,
      ticketPrice: json['ticketPrice'] != null ? double.tryParse(json['ticketPrice'].toString()) : (json['price'] != null ? double.tryParse(json['price'].toString()) : null),
      ticketUrl: json['ticketUrl']?.toString(),
      isFree: json['isFree'] ?? (json['price'] == 0),
      tags: List<String>.from(json['tags'] ?? []),
      organizer: json['organizer']?.toString() ?? json['organizerName']?.toString() ?? '',
    );
  }
}
