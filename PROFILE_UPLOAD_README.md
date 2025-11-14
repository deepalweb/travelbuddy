# Profile Picture Upload Implementation

## Overview
The TravelBuddy application now supports file-based profile picture uploads in addition to URL-based profile pictures.

## Features Implemented

### Backend (Node.js/Express)
- **File Upload Endpoint**: `/api/upload/profile-picture`
- **File Storage**: Local filesystem in `backend/uploads/profiles/`
- **File Validation**: 
  - Supported formats: JPEG, JPG, PNG, GIF, WebP
  - Maximum file size: 5MB
  - Unique filename generation with user ID and timestamp
- **File Serving**: Static file serving for uploaded images
- **File Deletion**: Endpoint to delete profile pictures

### Frontend (React/TypeScript)
- **ProfilePictureUpload Component**: Reusable component for file uploads
- **File Validation**: Client-side validation for file type and size
- **Upload Progress**: Visual feedback during upload process
- **Preview**: Image preview before and after upload
- **Error Handling**: User-friendly error messages

## API Endpoints

### Upload Profile Picture
```
POST /api/upload/profile-picture
Content-Type: multipart/form-data
Authorization: Bearer <token>
x-user-id: <user-id>

Body: FormData with 'profilePicture' file field
```

**Response:**
```json
{
  "success": true,
  "profilePicture": "/uploads/profiles/user-123-1234567890.jpg",
  "filename": "user-123-1234567890.jpg",
  "fileSize": 1024000,
  "mimeType": "image/jpeg"
}
```

### Get Uploaded File
```
GET /api/upload/profiles/<filename>
```

### Delete Profile Picture
```
DELETE /api/upload/profile-picture
Authorization: Bearer <token>
x-user-id: <user-id>
```

## Usage

### In React Components
```tsx
import ProfilePictureUpload from '../components/ProfilePictureUpload';

const MyComponent = () => {
  const handleUploadSuccess = (url: string) => {
    console.log('Upload successful:', url);
    // Update user profile or refresh data
  };

  const handleUploadError = (error: string) => {
    console.error('Upload failed:', error);
    // Show error message to user
  };

  return (
    <ProfilePictureUpload
      currentPicture={user?.profilePicture}
      onUploadSuccess={handleUploadSuccess}
      onUploadError={handleUploadError}
    />
  );
};
```

## File Structure
```
backend/
├── routes/
│   └── upload.js          # Upload endpoints
├── uploads/
│   └── profiles/          # Uploaded profile pictures
└── middleware/
    └── auth.js            # Authentication middleware

frontend/
├── src/
│   ├── components/
│   │   └── ProfilePictureUpload.tsx  # Upload component
│   └── pages/
│       ├── ProfilePage.tsx           # Updated profile page
│       └── TestUploadPage.tsx        # Test page for uploads
```

## Security Features
- File type validation (both client and server-side)
- File size limits (5MB maximum)
- Unique filename generation to prevent conflicts
- Authentication required for uploads
- Automatic cleanup of old profile pictures when new ones are uploaded

## Testing
A test page is available at `/test-upload` to verify the upload functionality works correctly.

## Configuration
The upload functionality uses the following configuration:
- **Upload Directory**: `backend/uploads/profiles/`
- **Max File Size**: 5MB
- **Allowed Types**: JPEG, JPG, PNG, GIF, WebP
- **Authentication**: Uses existing auth middleware

## Deployment Notes
- Ensure the `uploads/profiles/` directory exists and is writable
- Configure static file serving for the uploads directory
- Consider using cloud storage (AWS S3, etc.) for production deployments
- Set up proper backup for uploaded files

## Future Enhancements
- Image resizing/optimization
- Cloud storage integration (AWS S3, Cloudinary)
- Multiple image upload support
- Image cropping functionality
- CDN integration for better performance