import React, { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, X } from './Icons.tsx';
import { COMMUNITY_GUIDELINES } from '../services/contentModerationService';

interface CommunityGuidelinesProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  showAcceptButton?: boolean;
}

const CommunityGuidelines: React.FC<CommunityGuidelinesProps> = ({
  isOpen,
  onClose,
  onAccept,
  showAcceptButton = false
}) => {
  const [accepted, setAccepted] = useState(false);

  if (!isOpen) return null;

  const handleAccept = () => {
    setAccepted(true);
    onAccept?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shield className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Community Guidelines</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Introduction */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-blue-600 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Welcome to Our Travel Community!</h3>
                <p className="text-blue-800 text-sm">
                  Our community thrives when everyone feels safe, respected, and inspired to share their travel experiences. 
                  Please follow these guidelines to help maintain a positive environment for all travelers.
                </p>
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="space-y-4 mb-6">
            {COMMUNITY_GUIDELINES.map((guideline, index) => (
              <div key={guideline.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{guideline.title}</h4>
                    <p className="text-gray-700 text-sm">{guideline.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Consequences */}
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-yellow-600 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">Enforcement</h3>
                <p className="text-yellow-800 text-sm mb-2">
                  Violations of these guidelines may result in:
                </p>
                <ul className="text-yellow-800 text-sm space-y-1 ml-4">
                  <li>• Content removal or editing</li>
                  <li>• Temporary posting restrictions</li>
                  <li>• Account suspension or permanent ban</li>
                  <li>• Loss of community privileges</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Reporting */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-3">
              <Shield className="text-green-600 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-green-900 mb-2">Report Violations</h3>
                <p className="text-green-800 text-sm">
                  If you see content that violates these guidelines, please report it using the "Report" button on any post. 
                  Our moderation team reviews all reports promptly.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            {showAcceptButton && (
              <button
                onClick={handleAccept}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                I Understand & Agree
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityGuidelines;