class Validators {
  static final RegExp _emailRegExp = RegExp(
    r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?)*$",
  );

  static bool isValidEmail(String email) {
    return _emailRegExp.hasMatch(email);
  }

  static bool isValidPassword(String password) {
    return password.length >= 6;
  }

  static bool isValidFirstName(String firstName) {
    return firstName.isNotEmpty &&
        firstName.length <= 40 &&
        !firstName.contains(' ');
  }

  static bool isValidLastName(String lastName) {
    if (lastName.length > 80) {
      return false;
    }

    final parts = lastName.split(' ');
    if (parts.length > 3) {
      return false;
    }
    for (final part in parts) {
      if (part.isEmpty) {
        return false;
      }
    }
    return true;
  }

  static bool isValidPincode(String pincode) {
    if (pincode.length != 6) {
      return false;
    }
    return int.tryParse(pincode) != null;
  }

  static bool isCreditPercentageValid(num percentage) {
    return percentage >= 0 && percentage <= 100;
  }

  static bool isRedemptionRateValid(num rate) {
    return rate > 0;
  }
}
