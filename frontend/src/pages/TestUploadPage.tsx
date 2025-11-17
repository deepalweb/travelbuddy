import React, { useState } from 'react';
import ProfilePictureUpload from '../components/ProfilePictureUpload';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';

export const TestUploadPage: React.FC = () => {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUploadSuccess = (url: string) => {
    setUploadedUrl(url);
    setError(null);
    console.log('Upload successful:', url);
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
    setUploadedUrl(null);
    console.error('Upload error:', errorMessage);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture Upload Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">Test File Upload Functionality</h3>
              
              <ProfilePictureUpload
                currentPicture={uploadedUrl}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-red-800 font-medium">Upload Error:</h4>
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {uploadedUrl && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-green-800 font-medium">Upload Successful!</h4>
                <p className="text-green-600">File URL: {uploadedUrl}</p>
                <div className="mt-2">
                  <img 
                    src={uploadedUrl} 
                    alt="Uploaded" 
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-blue-800 font-medium">Instructions:</h4>
              <ul className="text-blue-600 text-sm mt-2 space-y-1">
                <li>• Click the upload button to select an image file</li>
                <li>• Supported formats: JPEG, PNG, GIF, WebP</li>
                <li>• Maximum file size: 5MB</li>
                <li>• The image will be uploaded to the server and stored</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestUploadPage;
