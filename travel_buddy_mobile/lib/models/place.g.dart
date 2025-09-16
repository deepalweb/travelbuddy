// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'place.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class PlaceAdapter extends TypeAdapter<Place> {
  @override
  final int typeId = 0;

  @override
  Place read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Place(
      id: fields[0] as String,
      name: fields[1] as String,
      type: fields[2] as String,
      rating: fields[3] as double,
      address: fields[4] as String,
      photoUrl: fields[5] as String,
      description: fields[6] as String,
      localTip: fields[7] as String,
      handyPhrase: fields[8] as String,
      latitude: fields[9] as double?,
      longitude: fields[10] as double?,
      isOpenNow: fields[11] as bool?,
      website: fields[12] as String?,
      phoneNumber: fields[13] as String?,
      priceLevel: fields[14] as int?,
      deal: fields[15] as Deal?,
    );
  }

  @override
  void write(BinaryWriter writer, Place obj) {
    writer
      ..writeByte(16)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.type)
      ..writeByte(3)
      ..write(obj.rating)
      ..writeByte(4)
      ..write(obj.address)
      ..writeByte(5)
      ..write(obj.photoUrl)
      ..writeByte(6)
      ..write(obj.description)
      ..writeByte(7)
      ..write(obj.localTip)
      ..writeByte(8)
      ..write(obj.handyPhrase)
      ..writeByte(9)
      ..write(obj.latitude)
      ..writeByte(10)
      ..write(obj.longitude)
      ..writeByte(11)
      ..write(obj.isOpenNow)
      ..writeByte(12)
      ..write(obj.website)
      ..writeByte(13)
      ..write(obj.phoneNumber)
      ..writeByte(14)
      ..write(obj.priceLevel)
      ..writeByte(15)
      ..write(obj.deal);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PlaceAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class DealAdapter extends TypeAdapter<Deal> {
  @override
  final int typeId = 1;

  @override
  Deal read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Deal(
      id: fields[0] as String,
      title: fields[1] as String,
      description: fields[2] as String,
      category: fields[3] as String,
      imageUrl: fields[4] as String,
      discount: fields[14] as String,
      placeName: fields[17] as String,
      bookingLink: fields[15] as String,
      isPremium: fields[16] as bool,
      originalPrice: fields[5] as double,
      discountedPrice: fields[6] as double,
      currency: fields[7] as String,
      validFrom: fields[8] as DateTime,
      validUntil: fields[9] as DateTime,
      location: fields[10] as String,
      details: (fields[11] as Map).cast<String, dynamic>(),
      terms: (fields[12] as List).cast<String>(),
      providerName: fields[13] as String,
    );
  }

  @override
  void write(BinaryWriter writer, Deal obj) {
    writer
      ..writeByte(18)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.title)
      ..writeByte(2)
      ..write(obj.description)
      ..writeByte(3)
      ..write(obj.category)
      ..writeByte(4)
      ..write(obj.imageUrl)
      ..writeByte(5)
      ..write(obj.originalPrice)
      ..writeByte(6)
      ..write(obj.discountedPrice)
      ..writeByte(7)
      ..write(obj.currency)
      ..writeByte(8)
      ..write(obj.validFrom)
      ..writeByte(9)
      ..write(obj.validUntil)
      ..writeByte(10)
      ..write(obj.location)
      ..writeByte(11)
      ..write(obj.details)
      ..writeByte(12)
      ..write(obj.terms)
      ..writeByte(13)
      ..write(obj.providerName)
      ..writeByte(14)
      ..write(obj.discount)
      ..writeByte(17)
      ..write(obj.placeName)
      ..writeByte(15)
      ..write(obj.bookingLink)
      ..writeByte(16)
      ..write(obj.isPremium);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DealAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
