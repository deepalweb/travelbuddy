enum SOSAction {
  callPolice,
  sendAlertOnly,
  both,
}

enum AlertChannel {
  sms,
  push,
  email,
  whatsapp,
}

enum SafetyTimerStatus {
  active,
  paused,
  expired,
  completed,
}

enum EmergencyType {
  medical,
  security,
  accident,
  lost,
  general,
}

class MedicalInfo {
  final String bloodType;
  final List<String> allergies;
  final List<String> medications;
  final List<String> conditions;
  final String emergencyContact;
  final bool shareInEmergency;

  MedicalInfo({
    this.bloodType = '',
    this.allergies = const [],
    this.medications = const [],
    this.conditions = const [],
    this.emergencyContact = '',
    this.shareInEmergency = false,
  });

  Map<String, dynamic> toJson() {
    return {
      'bloodType': bloodType,
      'allergies': allergies,
      'medications': medications,
      'conditions': conditions,
      'emergencyContact': emergencyContact,
      'shareInEmergency': shareInEmergency,
    };
  }

  factory MedicalInfo.fromJson(Map<String, dynamic> json) {
    return MedicalInfo(
      bloodType: json['bloodType'] ?? '',
      allergies: List<String>.from(json['allergies'] ?? []),
      medications: List<String>.from(json['medications'] ?? []),
      conditions: List<String>.from(json['conditions'] ?? []),
      emergencyContact: json['emergencyContact'] ?? '',
      shareInEmergency: json['shareInEmergency'] ?? false,
    );
  }
}

class SafetyTimer {
  final String id;
  final DateTime startTime;
  final Duration duration;
  final String description;
  final SafetyTimerStatus status;
  final List<String> notifyContacts;

  SafetyTimer({
    required this.id,
    required this.startTime,
    required this.duration,
    required this.description,
    this.status = SafetyTimerStatus.active,
    this.notifyContacts = const [],
  });

  DateTime get endTime => startTime.add(duration);
  bool get isExpired => DateTime.now().isAfter(endTime);
  Duration get timeRemaining => endTime.difference(DateTime.now());
}