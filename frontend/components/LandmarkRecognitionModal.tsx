import React, { useState, useRef } from 'react';

interface LandmarkRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLandmarkIdentified: (landmark: { name: string; description: string; confidence: number }) => void;
}

const LandmarkRecognitionModal: React.FC<LandmarkRecognitionModalProps> = ({
  isOpen,
  onClose,
  onLandmarkIdentified
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageData);
      
      // Stop camera
      const stream = video.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const recognizeLandmark = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    
    try {
      // Mock landmark recognition (in real app, use Google Vision API or similar)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockLandmarks = [
        { name: 'Eiffel Tower', description: 'Iconic iron lattice tower in Paris, France', confidence: 0.95 },
        { name: 'Statue of Liberty', description: 'Neoclassical sculpture on Liberty Island in New York Harbor', confidence: 0.92 },
        { name: 'Big Ben', description: 'The nickname for the Great Bell of the clock at the north end of the Palace of Westminster', confidence: 0.88 },
        { name: 'Sydney Opera House', description: 'Multi-venue performing arts centre in Sydney, Australia', confidence: 0.91 },
        { name: 'Taj Mahal', description: 'Ivory-white marble mausoleum in Agra, India', confidence: 0.94 }
      ];
      
      const randomLandmark = mockLandmarks[Math.floor(Math.random() * mockLandmarks.length)];
      setResult(randomLandmark);
      
    } catch (error) {
      console.error('Error recognizing landmark:', error);
      setResult({ name: 'Unknown', description: 'Could not identify this landmark', confidence: 0 });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (result) {
      onLandmarkIdentified(result);
      onClose();
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setResult(null);
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Landmark Recognition</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {!capturedImage ? (
          <div className="space-y-4">
            {/* Camera View */}
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 bg-gray-200 rounded-lg object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <button
                onClick={startCamera}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                📷 Start Camera
              </button>
              <button
                onClick={capturePhoto}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium"
              >
                📸 Capture
              </button>
            </div>

            <div className="text-center">
              <div className="text-gray-500 text-sm mb-2">or</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 py-4 rounded-lg hover:border-gray-400 text-gray-600"
              >
                📁 Upload Photo
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Captured Image */}
            <div className="relative">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>

            {/* Recognition Result */}
            {result ? (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🏛️</span>
                  <h3 className="text-lg font-bold text-green-800">{result.name}</h3>
                </div>
                <p className="text-green-700 text-sm mb-2">{result.description}</p>
                <div className="text-green-600 text-sm">
                  Confidence: {Math.round(result.confidence * 100)}%
                </div>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={recognizeLandmark}
                  disabled={isProcessing}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
                >
                  {isProcessing ? '🔍 Analyzing...' : '🤖 Recognize Landmark'}
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
              >
                Try Again
              </button>
              {result && (
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Search This Place
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 text-center">
          📱 Point your camera at landmarks to identify them
        </div>
      </div>
    </div>
  );
};

export default LandmarkRecognitionModal;