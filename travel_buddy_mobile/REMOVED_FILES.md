# Removed Test/Example Files for Production

The following files have been removed from the production build:

## Test Files
- `lib/simple_test.dart` - Backend connectivity test
- `lib/simple_post_test.dart` - Community posts API test
- `lib/run_tests.dart` - Test runner
- `lib/test_community_posts.dart` - Community posts test
- `lib/test_integration.dart` - Integration test
- `lib/test_place_search.dart` - Place search test
- `lib/services/google_services_test.dart` - Google services test

## Example Files  
- `lib/examples/mobile_places_example.dart` - Places discovery demo
- `lib/examples/place_search_example.dart` - Place search demo
- `lib/examples/` directory (entire folder)

## Test Screens
- `lib/screens/test_enhanced_route_screen.dart` - Test route screen

## Kept (Production Needed)
- `lib/services/connectivity_test.dart` - Used in production for backend health checks

These files were development/testing utilities and should not be included in the production APK.