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
    return EventModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      category: json['category']?.toString() ?? '',
      imageUrl: json['imageUrl']?.toString() ?? json['image']?.toString() ?? '',
      location: json['location']?.toString() ?? '',
      startDate: DateTime.parse(json['startDate'] ?? DateTime.now().toIso8601String()),
      endDate: DateTime.parse(json['endDate'] ?? DateTime.now().toIso8601String()),
      venue: json['venue']?.toString() ?? '',
      ticketPrice: json['ticketPrice'] != null ? double.tryParse(json['ticketPrice'].toString()) : null,
      ticketUrl: json['ticketUrl']?.toString(),
      isFree: json['isFree'] ?? false,
      tags: List<String>.from(json['tags'] ?? []),
      organizer: json['organizer']?.toString() ?? '',
    );
  }
}
