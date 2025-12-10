import 'dart:async';

class ApiDebouncer {
  final Duration delay;
  Timer? _timer;

  ApiDebouncer({this.delay = const Duration(milliseconds: 500)});

  void call(void Function() action) {
    _timer?.cancel();
    _timer = Timer(delay, action);
  }

  void dispose() {
    _timer?.cancel();
  }
}
