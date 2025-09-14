// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'place.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Place _$PlaceFromJson(Map<String, dynamic> json) => Place(
      placeId: json['place_id'] as String,
      name: json['name'] as String,
      formattedAddress: json['formatted_address'] as String,
      types: (json['types'] as List<dynamic>).map((e) => e as String).toList(),
      geometry:
          PlaceGeometry.fromJson(json['geometry'] as Map<String, dynamic>),
      rating: (json['rating'] as num?)?.toDouble(),
      userRatingsTotal: (json['user_ratings_total'] as num?)?.toInt(),
      businessStatus: json['business_status'] as String,
      photos: (json['photos'] as List<dynamic>)
          .map((e) => PlacePhoto.fromJson(e as Map<String, dynamic>))
          .toList(),
      distanceM: (json['distance_m'] as num?)?.toDouble(),
    );

Map<String, dynamic> _$PlaceToJson(Place instance) => <String, dynamic>{
      'place_id': instance.placeId,
      'name': instance.name,
      'formatted_address': instance.formattedAddress,
      'types': instance.types,
      'geometry': instance.geometry,
      'rating': instance.rating,
      'user_ratings_total': instance.userRatingsTotal,
      'business_status': instance.businessStatus,
      'photos': instance.photos,
      'distance_m': instance.distanceM,
    };

PlaceGeometry _$PlaceGeometryFromJson(Map<String, dynamic> json) =>
    PlaceGeometry(
      location:
          PlaceLocation.fromJson(json['location'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$PlaceGeometryToJson(PlaceGeometry instance) =>
    <String, dynamic>{
      'location': instance.location,
    };

PlaceLocation _$PlaceLocationFromJson(Map<String, dynamic> json) =>
    PlaceLocation(
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
    );

Map<String, dynamic> _$PlaceLocationToJson(PlaceLocation instance) =>
    <String, dynamic>{
      'lat': instance.lat,
      'lng': instance.lng,
    };

PlacePhoto _$PlacePhotoFromJson(Map<String, dynamic> json) => PlacePhoto(
      photoReference: json['photo_reference'] as String,
      width: (json['width'] as num).toInt(),
      height: (json['height'] as num).toInt(),
      htmlAttributions: (json['html_attributions'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
    );

Map<String, dynamic> _$PlacePhotoToJson(PlacePhoto instance) =>
    <String, dynamic>{
      'photo_reference': instance.photoReference,
      'width': instance.width,
      'height': instance.height,
      'html_attributions': instance.htmlAttributions,
    };
