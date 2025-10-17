@echo off
echo Generating keystore for TravelBuddy APK signing...

cd android\keystore

"%JAVA_HOME%\bin\keytool" -genkey -v -keystore travelbuddy-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias travelbuddy -storepass travelbuddy123 -keypass travelbuddy123 -dname "CN=TravelBuddy, OU=Mobile, O=TravelBuddy, L=Colombo, S=Western, C=LK"

echo Keystore generated successfully!
echo Location: android\keystore\travelbuddy-key.jks

pause