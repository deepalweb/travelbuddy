import React, { useState } from 'react';
import { Post, CurrentUser } from '../types.ts';
import { 
  Star, ShieldCheck, Eye, X, User, CheckCircle 
} from './Icons.tsx';

interface ContentModerationProps {
  post: Post;
  currentUser: CurrentUser | null;
  onReportPost: (postId: string, reason: string, description?: string) => void;
  onBlockUser?: (userId: string) => void;
  onHidePost?: (postId: string) => void;
  isAdmin?: boolean;
  onAdminAction?: (postId: string, action: 'approve' | 'remove' | 'flag') => void;
}

interface ReportReason {
  id: string;
  label: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

const REPORT_REASONS: ReportReason[] = [
  {
    id: 'spam',
    label: 'Spam or Promotional Content',
    description: 'Unwanted commercial content or repetitive posts',
    severity: 'medium'
  },
  {
    id: 'inappropriate',
    label: 'Inappropriate Content',
    description: 'Content that violates community guidelines',
    severity: 'high'
  },
  {
    id: 'harassment',
    label: 'Harassment or Bullying',
    description: 'Targeting individuals with harmful content',
    severity: 'high'
  },
  {
    id: 'misinformation',
    label: 'False Information',
    description: 'Spreading incorrect or misleading travel information',
    severity: 'medium'
  },
  {
    id: 'copyright',
    label: 'Copyright Violation',
    description: 'Using images or content without permission',
    severity: 'medium'
  },
  {
    id: 'hate_speech',
    label: 'Hate Speech',
    description: 'Content promoting discrimination or hatred',
    severity: 'high'
  },
  {
    id: 'privacy',
    label: 'Privacy Violation',
    description: 'Sharing personal information without consent',
    severity: 'high'
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Another reason not listed above',
    severity: 'low'
  }
];

const ContentModeration: React.FC<ContentModerationProps> = ({
  post,
  currentUser,
  onReportPost,
  onBlockUser,
  onHidePost,
  isAdmin = false,
  onAdminAction
}) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReportSubmit = async () => {
    if (!selectedReason || !currentUser) return;

    setIsSubmitting(true);
    try {
      await onReportPost(post.id, selectedReason, reportDescription);
      setShowReportModal(false);
      setSelectedReason('');
      setReportDescription('');
    } catch (error) {
      console.error('Failed to submit report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const renderReportModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Star className="text-red-500" size={20} />
              Report Post
            </h3>
            <button
              onClick={() => setShowReportModal(false)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <p className="text-gray-600 mb-4">
            Help us understand what's wrong with this post.
          </p>

          <div className="space-y-3 mb-4">
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason.id}
                className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedReason === reason.id
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={reason.id}
                  checked={selectedReason === reason.id}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedReason === reason.id ? 'border-red-500 bg-red-500' : 'border-gray-300'
                  }`}>
                    {selectedReason === reason.id && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{reason.label}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getSeverityColor(reason.severity)}`}>
                        {reason.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{reason.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Details (Optional)
            </label>
            <textarea
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Provide any additional context..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowReportModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReportSubmit}
              disabled={!selectedReason || isSubmitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserActions = () => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowReportModal(true)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Report Post"
      >
        <Star size={14} />
        Report
      </button>
      
      {onHidePost && (
        <button
          onClick={() => onHidePost(post.id)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="Hide Post"
        >
          <Eye size={14} />
          Hide
        </button>
      )}

      {onBlockUser && post.author && (
        <button
          onClick={() => onBlockUser(post.userId || post.author.name)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Block User"
        >
          <User size={14} />
          Block
        </button>
      )}
    </div>
  );

  const renderAdminActions = () => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="text-yellow-600" size={20} />
        <span className="font-medium text-yellow-800">Admin Moderation Panel</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onAdminAction?.(post.id, 'approve')}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <CheckCircle size={14} />
          Approve
        </button>
        <button
          onClick={() => onAdminAction?.(post.id, 'flag')}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <Star size={14} />
          Flag
        </button>
        <button
          onClick={() => onAdminAction?.(post.id, 'remove')}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <X size={14} />
          Remove
        </button>
      </div>
    </div>
  );

  // Don't show moderation options if user is not logged in
  if (!currentUser) return null;

  return (
    <>
      {isAdmin && renderAdminActions()}
      {!isAdmin && renderUserActions()}
      {showReportModal && renderReportModal()}
    </>
  );
};

export default ContentModeration;
