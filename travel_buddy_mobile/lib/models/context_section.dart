import 'place.dart';

class ContextSection {
  final String id;
  final String title;
  final String subtitle;
  final String icon;
  final List<Place> places;
  final SectionType type;

  ContextSection({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.places,
    required this.type,
  });
}

enum SectionType {
  hotNow,
  weatherAware,
  onTrip,
  travelStyle,
  tonightIn,
  category
}
