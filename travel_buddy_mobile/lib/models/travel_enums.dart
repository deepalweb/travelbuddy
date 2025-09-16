enum PostType {
  experience,
  tip,
  review,
  question,
  tripDiary,
  photo,
  story;

  String get displayName {
    switch (this) {
      case PostType.experience:
        return 'EXPERIENCE';
      case PostType.tip:
        return 'TIP';
      case PostType.review:
        return 'REVIEW';
      case PostType.question:
        return 'QUESTION';
      case PostType.tripDiary:
        return 'TRIP DIARY';
      case PostType.photo:
        return 'PHOTO';
      case PostType.story:
        return 'STORY';
    }
  }

  static PostType fromString(String value) {
    switch (value.toLowerCase()) {
      case 'experience':
        return PostType.experience;
      case 'tip':
        return PostType.tip;
      case 'review':
        return PostType.review;
      case 'question':
        return PostType.question;
      case 'tripdiary':
      case 'trip_diary':
        return PostType.tripDiary;
      case 'photo':
        return PostType.photo;
      case 'story':
        return PostType.story;
      default:
        return PostType.experience;
    }
  }
}

enum TravelInterest {
  adventure,
  food,
  culture,
  nature,
  photography,
  history,
  luxury,
  budget,
  familyTravel,
  soloTravel
}

enum TravelerType {
  backpacker,
  luxury,
  family,
  solo,
  business,
  cultural,
  adventure,
  relaxation
}
