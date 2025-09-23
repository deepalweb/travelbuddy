import 'dart:convert';
import 'package:http/http.dart' as http;

class CurrencyService {
  static const String _baseUrl = 'https://api.exchangerate-api.com/v4/latest';
  static Map<String, double>? _cachedRates;
  static DateTime? _lastUpdate;
  static const Duration _cacheExpiry = Duration(hours: 1);

  static Future<Map<String, double>> getExchangeRates({String baseCurrency = 'USD'}) async {
    // Return cached rates if still valid
    if (_cachedRates != null && 
        _lastUpdate != null && 
        DateTime.now().difference(_lastUpdate!).compareTo(_cacheExpiry) < 0) {
      return _cachedRates!;
    }

    try {
      final response = await http.get(Uri.parse('$_baseUrl/$baseCurrency'));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final rates = Map<String, double>.from(data['rates']);
        
        _cachedRates = rates;
        _lastUpdate = DateTime.now();
        
        return rates;
      }
    } catch (e) {
      print('Error fetching exchange rates: $e');
    }

    // Return fallback rates if API fails
    return _getFallbackRates();
  }

  static String convertPrice(double amount, String fromCurrency, String toCurrency, Map<String, double> rates) {
    if (fromCurrency == toCurrency) {
      return formatPrice(amount, toCurrency);
    }

    double convertedAmount;
    if (fromCurrency == 'USD') {
      convertedAmount = amount * (rates[toCurrency] ?? 1.0);
    } else if (toCurrency == 'USD') {
      convertedAmount = amount / (rates[fromCurrency] ?? 1.0);
    } else {
      // Convert through USD
      final usdAmount = amount / (rates[fromCurrency] ?? 1.0);
      convertedAmount = usdAmount * (rates[toCurrency] ?? 1.0);
    }

    return formatPrice(convertedAmount, toCurrency);
  }

  static String formatPrice(double amount, String currency) {
    final symbols = {
      'USD': '\$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C\$',
      'AUD': 'A\$',
    };

    final symbol = symbols[currency] ?? currency;
    return '$symbol${amount.toStringAsFixed(2)}';
  }

  static Map<String, double> _getFallbackRates() {
    return {
      'EUR': 0.85,
      'GBP': 0.73,
      'JPY': 110.0,
      'CAD': 1.25,
      'AUD': 1.35,
      'CHF': 0.92,
      'CNY': 6.45,
      'INR': 74.5,
    };
  }
}