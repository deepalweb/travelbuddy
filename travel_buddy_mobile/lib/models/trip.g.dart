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
    );
  }

  @override
  void write(BinaryWriter writer, TripPlan obj) {
    writer
      ..writeByte(10)
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
      ..write(obj.budgetConsiderations);
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
    );
  }

  @override
  void write(BinaryWriter writer, DailyTripPlan obj) {
    writer
      ..writeByte(5)
      ..writeByte(0)
      ..write(obj.day)
      ..writeByte(1)
      ..write(obj.title)
      ..writeByte(2)
      ..write(obj.theme)
      ..writeByte(3)
      ..write(obj.activities)
      ..writeByte(4)
      ..write(obj.photoUrl);
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
    );
  }

  @override
  void write(BinaryWriter writer, ActivityDetail obj) {
    writer
      ..writeByte(8)
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
      ..write(obj.category);
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
