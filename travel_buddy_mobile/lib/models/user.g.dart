// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class CurrentUserAdapter extends TypeAdapter<CurrentUser> {
  @override
  final int typeId = 2;

  @override
  CurrentUser read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return CurrentUser(
      username: fields[0] as String?,
      uid: fields[13] as String?,
      email: fields[1] as String?,
      isAdmin: fields[2] as bool,
      subscriptionStatus: fields[3] as SubscriptionStatus,
      tier: fields[4] as SubscriptionTier,
      trialEndDate: fields[5] as String?,
      subscriptionEndDate: fields[6] as String?,
      homeCurrency: fields[7] as String?,
      language: fields[8] as String?,
      selectedInterests: (fields[9] as List?)?.cast<UserInterest>(),
      hasCompletedWizard: fields[10] as bool,
      mongoId: fields[11] as String?,
      profilePicture: fields[12] as String?,
      bio: fields[14] as String?,
      website: fields[15] as String?,
      location: fields[16] as String?,
      birthday: fields[17] as String?,
      languages: (fields[18] as List?)?.cast<String>(),
      travelInterests: (fields[19] as List?)?.cast<String>(),
      budgetPreference: fields[20] as String?,
      interests: (fields[21] as List?)?.cast<String>(),
      budgetPreferences: (fields[22] as List?)?.cast<String>(),
      showBirthdayToOthers: fields[23] as bool,
      showLocationToOthers: fields[24] as bool,
      travelStyle: fields[25] as TravelStyle?,
      status: fields[26] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, CurrentUser obj) {
    writer
      ..writeByte(27)
      ..writeByte(0)
      ..write(obj.username)
      ..writeByte(1)
      ..write(obj.email)
      ..writeByte(2)
      ..write(obj.isAdmin)
      ..writeByte(3)
      ..write(obj.subscriptionStatus)
      ..writeByte(4)
      ..write(obj.tier)
      ..writeByte(5)
      ..write(obj.trialEndDate)
      ..writeByte(6)
      ..write(obj.subscriptionEndDate)
      ..writeByte(7)
      ..write(obj.homeCurrency)
      ..writeByte(8)
      ..write(obj.language)
      ..writeByte(9)
      ..write(obj.selectedInterests)
      ..writeByte(10)
      ..write(obj.hasCompletedWizard)
      ..writeByte(11)
      ..write(obj.mongoId)
      ..writeByte(12)
      ..write(obj.profilePicture)
      ..writeByte(13)
      ..write(obj.uid)
      ..writeByte(14)
      ..write(obj.bio)
      ..writeByte(15)
      ..write(obj.website)
      ..writeByte(16)
      ..write(obj.location)
      ..writeByte(17)
      ..write(obj.birthday)
      ..writeByte(18)
      ..write(obj.languages)
      ..writeByte(19)
      ..write(obj.travelInterests)
      ..writeByte(20)
      ..write(obj.budgetPreference)
      ..writeByte(21)
      ..write(obj.interests)
      ..writeByte(22)
      ..write(obj.budgetPreferences)
      ..writeByte(23)
      ..write(obj.showBirthdayToOthers)
      ..writeByte(24)
      ..write(obj.showLocationToOthers)
      ..writeByte(25)
      ..write(obj.travelStyle)
      ..writeByte(26)
      ..write(obj.status);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CurrentUserAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class SubscriptionStatusAdapter extends TypeAdapter<SubscriptionStatus> {
  @override
  final int typeId = 7;

  @override
  SubscriptionStatus read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return SubscriptionStatus.none;
      case 1:
        return SubscriptionStatus.trial;
      case 2:
        return SubscriptionStatus.active;
      case 3:
        return SubscriptionStatus.expired;
      case 4:
        return SubscriptionStatus.canceled;
      default:
        return SubscriptionStatus.none;
    }
  }

  @override
  void write(BinaryWriter writer, SubscriptionStatus obj) {
    switch (obj) {
      case SubscriptionStatus.none:
        writer.writeByte(0);
        break;
      case SubscriptionStatus.trial:
        writer.writeByte(1);
        break;
      case SubscriptionStatus.active:
        writer.writeByte(2);
        break;
      case SubscriptionStatus.expired:
        writer.writeByte(3);
        break;
      case SubscriptionStatus.canceled:
        writer.writeByte(4);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SubscriptionStatusAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class SubscriptionTierAdapter extends TypeAdapter<SubscriptionTier> {
  @override
  final int typeId = 8;

  @override
  SubscriptionTier read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return SubscriptionTier.free;
      case 1:
        return SubscriptionTier.basic;
      case 2:
        return SubscriptionTier.premium;
      case 3:
        return SubscriptionTier.pro;
      default:
        return SubscriptionTier.free;
    }
  }

  @override
  void write(BinaryWriter writer, SubscriptionTier obj) {
    switch (obj) {
      case SubscriptionTier.free:
        writer.writeByte(0);
        break;
      case SubscriptionTier.basic:
        writer.writeByte(1);
        break;
      case SubscriptionTier.premium:
        writer.writeByte(2);
        break;
      case SubscriptionTier.pro:
        writer.writeByte(3);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SubscriptionTierAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class UserInterestAdapter extends TypeAdapter<UserInterest> {
  @override
  final int typeId = 9;

  @override
  UserInterest read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return UserInterest.adventure;
      case 1:
        return UserInterest.history;
      case 2:
        return UserInterest.foodie;
      case 3:
        return UserInterest.artCulture;
      case 4:
        return UserInterest.natureOutdoors;
      case 5:
        return UserInterest.shopping;
      case 6:
        return UserInterest.nightlife;
      case 7:
        return UserInterest.relaxationWellness;
      default:
        return UserInterest.adventure;
    }
  }

  @override
  void write(BinaryWriter writer, UserInterest obj) {
    switch (obj) {
      case UserInterest.adventure:
        writer.writeByte(0);
        break;
      case UserInterest.history:
        writer.writeByte(1);
        break;
      case UserInterest.foodie:
        writer.writeByte(2);
        break;
      case UserInterest.artCulture:
        writer.writeByte(3);
        break;
      case UserInterest.natureOutdoors:
        writer.writeByte(4);
        break;
      case UserInterest.shopping:
        writer.writeByte(5);
        break;
      case UserInterest.nightlife:
        writer.writeByte(6);
        break;
      case UserInterest.relaxationWellness:
        writer.writeByte(7);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UserInterestAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
