import React, { useState, useRef } from 'react';
import { recognizeLandmark } from '../services/geminiService';

interface LandmarkRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLandmarkIdentified: (landmark: {name: string, description: string, confidence: number}) => void;
}

const LandmarkRecognitionModal: React.FC<LandmarkRecognitionModalProps> = ({
  isOpen,
  onClose,
  onLandmarkIdentified
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await recognizeLandmark(selectedImage);
      onLandmarkIdentified(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Identify Landmark</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="space-y-4">
          {!selectedImage ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-500 hover:text-blue-700"
              >
                📷 Upload Photo
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Upload a photo of a landmark to identify it
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <img
                src={selectedImage}
                alt="Selected landmark"
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Change Photo
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Identify'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandmarkRecognitionModal;