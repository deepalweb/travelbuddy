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

class PriceInfoAdapter extends TypeAdapter<PriceInfo> {
  @override
  final int typeId = 20;

  @override
  PriceInfo read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return PriceInfo(
      amount: fields[0] as double,
      currencyCode: fields[1] as String,
    );
  }

  @override
  void write(BinaryWriter writer, PriceInfo obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.amount)
      ..writeByte(1)
      ..write(obj.currencyCode);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PriceInfoAdapter &&
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
      discount: fields[3] as String,
      placeName: fields[4] as String,
      businessType: fields[5] as String,
      businessName: fields[6] as String,
      images: (fields[7] as List).cast<String>(),
      validUntil: fields[8] as DateTime,
      isActive: fields[9] as bool,
      views: fields[10] as int,
      claims: fields[11] as int,
      merchantId: fields[12] as String?,
      price: fields[13] as PriceInfo?,
      isPremium: fields[14] as bool,
      category: fields[15] as String?,
      imageUrl: fields[16] as String?,
      originalPrice: fields[17] as double?,
      discountedPrice: fields[18] as double?,
      currency: fields[19] as String?,
      location: fields[20] as DealLocation?,
    );
  }

  @override
  void write(BinaryWriter writer, Deal obj) {
    writer
      ..writeByte(21)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.title)
      ..writeByte(2)
      ..write(obj.description)
      ..writeByte(3)
      ..write(obj.discount)
      ..writeByte(4)
      ..write(obj.placeName)
      ..writeByte(5)
      ..write(obj.businessType)
      ..writeByte(6)
      ..write(obj.businessName)
      ..writeByte(7)
      ..write(obj.images)
      ..writeByte(8)
      ..write(obj.validUntil)
      ..writeByte(9)
      ..write(obj.isActive)
      ..writeByte(10)
      ..write(obj.views)
      ..writeByte(11)
      ..write(obj.claims)
      ..writeByte(12)
      ..write(obj.merchantId)
      ..writeByte(13)
      ..write(obj.price)
      ..writeByte(14)
      ..write(obj.isPremium)
      ..writeByte(15)
      ..write(obj.category)
      ..writeByte(16)
      ..write(obj.imageUrl)
      ..writeByte(17)
      ..write(obj.originalPrice)
      ..writeByte(18)
      ..write(obj.discountedPrice)
      ..writeByte(19)
      ..write(obj.currency)
      ..writeByte(20)
      ..write(obj.location);
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

class DealLocationAdapter extends TypeAdapter<DealLocation> {
  @override
  final int typeId = 21;

  @override
  DealLocation read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return DealLocation(
      type: fields[0] as String,
      coordinates: (fields[1] as List).cast<double>(),
    );
  }

  @override
  void write(BinaryWriter writer, DealLocation obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.type)
      ..writeByte(1)
      ..write(obj.coordinates);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DealLocationAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
