import 'package:json_annotation/json_annotation.dart';

part 'place.g.dart';

@JsonSerializable()
class Place {
  @JsonKey(name: 'place_id')
  final String placeId;
  final String name;
  @JsonKey(name: 'formatted_address')
  final String formattedAddress;
  final List<String> types;
  final PlaceGeometry geometry;
  final double? rating;
  @JsonKey(name: 'user_ratings_total')
  final int? userRatingsTotal;
  @JsonKey(name: 'business_status')
  final String businessStatus;
  final List<PlacePhoto> photos;
  @JsonKey(name: 'distance_m')
  final double? distanceM;

  Place({
    required this.placeId,
    required this.name,
    required this.formattedAddress,
    required this.types,
    required this.geometry,
    this.rating,
    this.userRatingsTotal,
    required this.businessStatus,
    required this.photos,
    this.distanceM,
  });

  factory Place.fromJson(Map<String, dynamic> json) => _$PlaceFromJson(json);
  Map<String, dynamic> toJson() => _$PlaceToJson(this);
}

@JsonSerializable()
class PlaceGeometry {
  final PlaceLocation location;

  PlaceGeometry({required this.location});

  factory PlaceGeometry.fromJson(Map<String, dynamic> json) => _$PlaceGeometryFromJson(json);
  Map<String, dynamic> toJson() => _$PlaceGeometryToJson(this);
}

@JsonSerializable()
class PlaceLocation {
  final double lat;
  final double lng;

  PlaceLocation({required this.lat, required this.lng});

  factory PlaceLocation.fromJson(Map<String, dynamic> json) => _$PlaceLocationFromJson(json);
  Map<String, dynamic> toJson() => _$PlaceLocationToJson(this);
}

@JsonSerializable()
class PlacePhoto {
  @JsonKey(name: 'photo_reference')
  final String photoReference;
  final int width;
  final int height;
  @JsonKey(name: 'html_attributions')
  final List<String> htmlAttributions;

  PlacePhoto({
    required this.photoReference,
    required this.width,
    required this.height,
    required this.htmlAttributions,
  });

  factory PlacePhoto.fromJson(Map<String, dynamic> json) => _$PlacePhotoFromJson(json);
  Map<String, dynamic> toJson() => _$PlacePhotoToJson(this);
}