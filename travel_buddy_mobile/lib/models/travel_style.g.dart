// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'travel_style.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class TravelStyleAdapter extends TypeAdapter<TravelStyle> {
  @override
  final int typeId = 25;

  @override
  TravelStyle read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return TravelStyle.foodie;
      case 1:
        return TravelStyle.explorer;
      case 2:
        return TravelStyle.relaxer;
      case 3:
        return TravelStyle.nightOwl;
      case 4:
        return TravelStyle.culture;
      case 5:
        return TravelStyle.nature;
      default:
        return TravelStyle.explorer;
    }
  }

  @override
  void write(BinaryWriter writer, TravelStyle obj) {
    switch (obj) {
      case TravelStyle.foodie:
        writer.writeByte(0);
        break;
      case TravelStyle.explorer:
        writer.writeByte(1);
        break;
      case TravelStyle.relaxer:
        writer.writeByte(2);
        break;
      case TravelStyle.nightOwl:
        writer.writeByte(3);
        break;
      case TravelStyle.culture:
        writer.writeByte(4);
        break;
      case TravelStyle.nature:
        writer.writeByte(5);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TravelStyleAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}