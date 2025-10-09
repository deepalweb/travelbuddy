@echo off
echo Cleaning Flutter project...
cd /d "c:\Users\DeepalRupasinghe\travelbuddy-2\travel_buddy_mobile"

echo Cleaning build cache...
flutter clean

echo Getting dependencies...
flutter pub get

echo Rebuilding project...
flutter build apk --debug

echo Done! You can now test Google Sign-In.
pause