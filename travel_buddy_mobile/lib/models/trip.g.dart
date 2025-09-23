// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'trip.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class TripPlanAdapter extends TypeAdapter<TripPlan> {
  @override
  final int typeId = 3;

  @override
  TripPlan read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return TripPlan(
      id: fields[0] as String,
      tripTitle: fields[1] as String,
      destination: fields[2] as String,
      duration: fields[3] as String,
      introduction: fields[4] as String,
      dailyPlans: (fields[5] as List).cast<DailyTripPlan>(),
      conclusion: fields[6] as String,
      accommodationSuggestions: (fields[7] as List?)?.cast<String>(),
      transportationTips: (fields[8] as List?)?.cast<String>(),
      budgetConsiderations: fields[9] as String?,
      durationDays: fields[10] as int,
      totalEstimatedCost: fields[11] as String,
      estimatedWalkingDistance: fields[12] as String,
      mapPolyline: fields[13] as String?,
      metadata: (fields[14] as Map?)?.cast<String, dynamic>(),
    );
  }

  @override
  void write(BinaryWriter writer, TripPlan obj) {
    writer
      ..writeByte(15)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.tripTitle)
      ..writeByte(2)
      ..write(obj.destination)
      ..writeByte(3)
      ..write(obj.duration)
      ..writeByte(4)
      ..write(obj.introduction)
      ..writeByte(5)
      ..write(obj.dailyPlans)
      ..writeByte(6)
      ..write(obj.conclusion)
      ..writeByte(7)
      ..write(obj.accommodationSuggestions)
      ..writeByte(8)
      ..write(obj.transportationTips)
      ..writeByte(9)
      ..write(obj.budgetConsiderations)
      ..writeByte(10)
      ..write(obj.durationDays)
      ..writeByte(11)
      ..write(obj.totalEstimatedCost)
      ..writeByte(12)
      ..write(obj.estimatedWalkingDistance)
      ..writeByte(13)
      ..write(obj.mapPolyline)
      ..writeByte(14)
      ..write(obj.metadata);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TripPlanAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class DailyTripPlanAdapter extends TypeAdapter<DailyTripPlan> {
  @override
  final int typeId = 4;

  @override
  DailyTripPlan read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return DailyTripPlan(
      day: fields[0] as int,
      title: fields[1] as String,
      theme: fields[2] as String?,
      activities: (fields[3] as List).cast<ActivityDetail>(),
      photoUrl: fields[4] as String?,
      dayEstimatedCost: fields[5] as String,
      dayWalkingDistance: fields[6] as String,
    );
  }

  @override
  void write(BinaryWriter writer, DailyTripPlan obj) {
    writer
      ..writeByte(7)
      ..writeByte(0)
      ..write(obj.day)
      ..writeByte(1)
      ..write(obj.title)
      ..writeByte(2)
      ..write(obj.theme)
      ..writeByte(3)
      ..write(obj.activities)
      ..writeByte(4)
      ..write(obj.photoUrl)
      ..writeByte(5)
      ..write(obj.dayEstimatedCost)
      ..writeByte(6)
      ..write(obj.dayWalkingDistance);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DailyTripPlanAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class ActivityDetailAdapter extends TypeAdapter<ActivityDetail> {
  @override
  final int typeId = 5;

  @override
  ActivityDetail read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ActivityDetail(
      timeOfDay: fields[0] as String,
      activityTitle: fields[1] as String,
      description: fields[2] as String,
      estimatedDuration: fields[3] as String?,
      location: fields[4] as String?,
      notes: fields[5] as String?,
      icon: fields[6] as String?,
      category: fields[7] as String?,
      startTime: fields[8] as String,
      endTime: fields[9] as String,
      duration: fields[10] as String,
      place: fields[11] as PlaceInfo?,
      type: fields[12] as String,
      estimatedCost: fields[13] as String,
      costBreakdown: (fields[14] as Map?)?.cast<String, String>(),
      transportFromPrev: fields[15] as TransportInfo?,
      tips: (fields[16] as List?)?.cast<String>(),
      weatherBackup: fields[17] as WeatherBackup?,
      crowdLevel: fields[18] as String,
      imageURL: fields[19] as String?,
      bookingLinks: (fields[20] as Map?)?.cast<String, String>(),
    );
  }

  @override
  void write(BinaryWriter writer, ActivityDetail obj) {
    writer
      ..writeByte(21)
      ..writeByte(0)
      ..write(obj.timeOfDay)
      ..writeByte(1)
      ..write(obj.activityTitle)
      ..writeByte(2)
      ..write(obj.description)
      ..writeByte(3)
      ..write(obj.estimatedDuration)
      ..writeByte(4)
      ..write(obj.location)
      ..writeByte(5)
      ..write(obj.notes)
      ..writeByte(6)
      ..write(obj.icon)
      ..writeByte(7)
      ..write(obj.category)
      ..writeByte(8)
      ..write(obj.startTime)
      ..writeByte(9)
      ..write(obj.endTime)
      ..writeByte(10)
      ..write(obj.duration)
      ..writeByte(11)
      ..write(obj.place)
      ..writeByte(12)
      ..write(obj.type)
      ..writeByte(13)
      ..write(obj.estimatedCost)
      ..writeByte(14)
      ..write(obj.costBreakdown)
      ..writeByte(15)
      ..write(obj.transportFromPrev)
      ..writeByte(16)
      ..write(obj.tips)
      ..writeByte(17)
      ..write(obj.weatherBackup)
      ..writeByte(18)
      ..write(obj.crowdLevel)
      ..writeByte(19)
      ..write(obj.imageURL)
      ..writeByte(20)
      ..write(obj.bookingLinks);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ActivityDetailAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class OneDayItineraryAdapter extends TypeAdapter<OneDayItinerary> {
  @override
  final int typeId = 6;

  @override
  OneDayItinerary read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return OneDayItinerary(
      id: fields[0] as String,
      title: fields[1] as String,
      introduction: fields[2] as String,
      dailyPlan: (fields[3] as List).cast<ActivityDetail>(),
      conclusion: fields[4] as String,
      travelTips: (fields[5] as List).cast<String>(),
    );
  }

  @override
  void write(BinaryWriter writer, OneDayItinerary obj) {
    writer
      ..writeByte(6)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.title)
      ..writeByte(2)
      ..write(obj.introduction)
      ..writeByte(3)
      ..write(obj.dailyPlan)
      ..writeByte(4)
      ..write(obj.conclusion)
      ..writeByte(5)
      ..write(obj.travelTips);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OneDayItineraryAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class PlaceInfoAdapter extends TypeAdapter<PlaceInfo> {
  @override
  final int typeId = 7;

  @override
  PlaceInfo read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return PlaceInfo(
      placeId: fields[0] as String?,
      name: fields[1] as String,
      address: fields[2] as String,
      coords: fields[3] as Coordinates,
    );
  }

  @override
  void write(BinaryWriter writer, PlaceInfo obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.placeId)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.address)
      ..writeByte(3)
      ..write(obj.coords);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PlaceInfoAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class CoordinatesAdapter extends TypeAdapter<Coordinates> {
  @override
  final int typeId = 8;

  @override
  Coordinates read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Coordinates(
      lat: fields[0] as double,
      lng: fields[1] as double,
    );
  }

  @override
  void write(BinaryWriter writer, Coordinates obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.lat)
      ..writeByte(1)
      ..write(obj.lng);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CoordinatesAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class TransportInfoAdapter extends TypeAdapter<TransportInfo> {
  @override
  final int typeId = 9;

  @override
  TransportInfo read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return TransportInfo(
      mode: fields[0] as String,
      duration: fields[1] as String,
      distance: fields[2] as String,
      cost: fields[3] as String,
      instructions: fields[4] as String,
    );
  }

  @override
  void write(BinaryWriter writer, TransportInfo obj) {
    writer
      ..writeByte(5)
      ..writeByte(0)
      ..write(obj.mode)
      ..writeByte(1)
      ..write(obj.duration)
      ..writeByte(2)
      ..write(obj.distance)
      ..writeByte(3)
      ..write(obj.cost)
      ..writeByte(4)
      ..write(obj.instructions);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TransportInfoAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class WeatherBackupAdapter extends TypeAdapter<WeatherBackup> {
  @override
  final int typeId = 10;

  @override
  WeatherBackup read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return WeatherBackup(
      title: fields[0] as String,
      reason: fields[1] as String,
    );
  }

  @override
  void write(BinaryWriter writer, WeatherBackup obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.title)
      ..writeByte(1)
      ..write(obj.reason);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is WeatherBackupAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
