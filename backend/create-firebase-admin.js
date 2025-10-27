import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

async function createFirebaseAdmin() {
  try {
    // Initialize Firebase Admin if not already done
    if (!admin.apps.length) {
      const firebaseConfig = await import('./config/firebase.js');
    }

    const auth = admin.auth();
    
    // Create Firebase user
    const userRecord = await auth.createUser({
      email: 'admin@travelbuddy.com',
      password: 'admin123',
      displayName: 'Admin User'
    });

    // Set admin custom claim
    await auth.setCustomUserClaims(userRecord.uid, { admin: true });

    console.log('✅ Firebase admin user created:');
    console.log('📧 Email: admin@travelbuddy.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 UID:', userRecord.uid);
    
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('✅ Firebase user already exists');
      const user = await admin.auth().getUserByEmail('admin@travelbuddy.com');
      await admin.auth().setCustomUserClaims(user.uid, { admin: true });
      console.log('🛡️ Admin claims updated');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

createFirebaseAdmin();