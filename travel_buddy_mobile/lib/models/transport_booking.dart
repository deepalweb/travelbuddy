class TransportBooking {
  final String id;
  final String serviceId;
  final String userId;
  final String companyName;
  final String vehicleType;
  final String route;
  final DateTime travelDate;
  final String departure;
  final String arrival;
  final int passengers;
  final double totalPrice;
  final String status; // pending, confirmed, completed, cancelled
  final String? pickupLocation;
  final String? dropoffLocation;
  final String? contactNumber;
  final DateTime bookingTime;
  final String? driverName;
  final String? driverPhone;
  final String? vehicleNumber;
  final Map<String, dynamic>? additionalInfo;
  final bool isRefundable;
  final String paymentStatus; // pending, paid, refunded
  final String? cancellationReason;
  final DateTime? cancellationTime;

  TransportBooking({
    required this.id,
    required this.serviceId,
    required this.userId,
    required this.companyName,
    required this.vehicleType,
    required this.route,
    required this.travelDate,
    required this.departure,
    required this.arrival,
    required this.passengers,
    required this.totalPrice,
    required this.status,
    this.pickupLocation,
    this.dropoffLocation,
    this.contactNumber,
    required this.bookingTime,
    this.driverName,
    this.driverPhone,
    this.vehicleNumber,
    this.additionalInfo,
    this.isRefundable = false,
    this.paymentStatus = 'pending',
    this.cancellationReason,
    this.cancellationTime,
  });

  factory TransportBooking.fromJson(Map<String, dynamic> json) {
    return TransportBooking(
      id: json['id']?.toString() ?? '',
      serviceId: json['serviceId']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      companyName: json['companyName']?.toString() ?? '',
      vehicleType: json['vehicleType']?.toString() ?? '',
      route: json['route']?.toString() ?? '',
      travelDate: DateTime.tryParse(json['travelDate']?.toString() ?? '') ?? DateTime.now(),
      departure: json['departure']?.toString() ?? '',
      arrival: json['arrival']?.toString() ?? '',
      passengers: json['passengers'] ?? 1,
      totalPrice: (json['totalPrice'] ?? json['amount'] ?? 0).toDouble(),
      status: json['status']?.toString() ?? 'pending',
      pickupLocation: json['pickupLocation']?.toString(),
      dropoffLocation: json['dropoffLocation']?.toString(),
      contactNumber: json['contactNumber']?.toString(),
      bookingTime: DateTime.tryParse(json['bookingTime']?.toString() ?? '') ?? DateTime.now(),
      driverName: json['driverName']?.toString(),
      driverPhone: json['driverPhone']?.toString(),
      vehicleNumber: json['vehicleNumber']?.toString(),
      additionalInfo: json['additionalInfo'] as Map<String, dynamic>?,
      isRefundable: json['isRefundable'] ?? false,
      paymentStatus: json['paymentStatus']?.toString() ?? 'pending',
      cancellationReason: json['cancellationReason']?.toString(),
      cancellationTime: json['cancellationTime'] != null 
          ? DateTime.tryParse(json['cancellationTime'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'serviceId': serviceId,
      'userId': userId,
      'companyName': companyName,
      'vehicleType': vehicleType,
      'route': route,
      'travelDate': travelDate.toIso8601String(),
      'departure': departure,
      'arrival': arrival,
      'passengers': passengers,
      'totalPrice': totalPrice,
      'status': status,
      'pickupLocation': pickupLocation,
      'dropoffLocation': dropoffLocation,
      'contactNumber': contactNumber,
      'bookingTime': bookingTime.toIso8601String(),
      'driverName': driverName,
      'driverPhone': driverPhone,
      'vehicleNumber': vehicleNumber,
      'additionalInfo': additionalInfo,
      'isRefundable': isRefundable,
      'paymentStatus': paymentStatus,
      'cancellationReason': cancellationReason,
      'cancellationTime': cancellationTime?.toIso8601String(),
    };
  }

  TransportBooking copyWith({
    String? id,
    String? serviceId,
    String? userId,
    String? companyName,
    String? vehicleType,
    String? route,
    DateTime? travelDate,
    String? departure,
    String? arrival,
    int? passengers,
    double? totalPrice,
    String? status,
    String? pickupLocation,
    String? dropoffLocation,
    String? contactNumber,
    DateTime? bookingTime,
    String? driverName,
    String? driverPhone,
    String? vehicleNumber,
    Map<String, dynamic>? additionalInfo,
    bool? isRefundable,
    String? paymentStatus,
    String? cancellationReason,
    DateTime? cancellationTime,
  }) {
    return TransportBooking(
      id: id ?? this.id,
      serviceId: serviceId ?? this.serviceId,
      userId: userId ?? this.userId,
      companyName: companyName ?? this.companyName,
      vehicleType: vehicleType ?? this.vehicleType,
      route: route ?? this.route,
      travelDate: travelDate ?? this.travelDate,
      departure: departure ?? this.departure,
      arrival: arrival ?? this.arrival,
      passengers: passengers ?? this.passengers,
      totalPrice: totalPrice ?? this.totalPrice,
      status: status ?? this.status,
      pickupLocation: pickupLocation ?? this.pickupLocation,
      dropoffLocation: dropoffLocation ?? this.dropoffLocation,
      contactNumber: contactNumber ?? this.contactNumber,
      bookingTime: bookingTime ?? this.bookingTime,
      driverName: driverName ?? this.driverName,
      driverPhone: driverPhone ?? this.driverPhone,
      vehicleNumber: vehicleNumber ?? this.vehicleNumber,
      additionalInfo: additionalInfo ?? this.additionalInfo,
      isRefundable: isRefundable ?? this.isRefundable,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      cancellationReason: cancellationReason ?? this.cancellationReason,
      cancellationTime: cancellationTime ?? this.cancellationTime,
    );
  }

  bool get canBeCancelled {
    return status == 'pending' || status == 'confirmed';
  }

  bool get isActive {
    return status == 'pending' || status == 'confirmed';
  }

  bool get isCompleted {
    return status == 'completed';
  }

  bool get isCancelled {
    return status == 'cancelled';
  }

  String get statusDisplayText {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pending Confirmation';
      case 'confirmed':
        return 'Confirmed';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  @override
  String toString() {
    return 'TransportBooking(id: $id, route: $route, status: $status, travelDate: $travelDate)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is TransportBooking && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}