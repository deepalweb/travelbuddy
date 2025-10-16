import { Post } from '../types';

interface ModerationResult {
  isAppropriate: boolean;
  confidence: number;
  flags: string[];
  severity: 'low' | 'medium' | 'high';
}

interface UserReputation {
  userId: string;
  score: number;
  level: 'new' | 'trusted' | 'expert' | 'moderator';
  violations: number;
  contributions: number;
}

// Automated content detection
export const analyzeContent = (text: string): ModerationResult => {
  const flags: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';
  
  // Spam detection
  const spamPatterns = [
    /\b(buy now|click here|limited time|act fast)\b/gi,
    /(.)\1{4,}/g, // Repeated characters
    /\b\w+\.(com|net|org)\b/gi // URLs
  ];
  
  // Inappropriate content
  const inappropriatePatterns = [
    /\b(hate|stupid|idiot|scam)\b/gi,
    /[A-Z]{5,}/g // Excessive caps
  ];
  
  spamPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      flags.push('spam');
      severity = 'medium';
    }
  });
  
  inappropriatePatterns.forEach(pattern => {
    if (pattern.test(text)) {
      flags.push('inappropriate');
      severity = 'high';
    }
  });
  
  const confidence = flags.length > 0 ? 0.8 : 0.1;
  
  return {
    isAppropriate: flags.length === 0,
    confidence,
    flags: [...new Set(flags)],
    severity
  };
};

// User reputation system
export const calculateReputation = (user: {
  postsCount: number;
  likesReceived: number;
  reportsReceived: number;
  helpfulVotes: number;
}): UserReputation => {
  const baseScore = user.postsCount * 2 + user.likesReceived + user.helpfulVotes * 3;
  const penalty = user.reportsReceived * 10;
  const score = Math.max(0, baseScore - penalty);
  
  let level: UserReputation['level'] = 'new';
  if (score >= 100) level = 'trusted';
  if (score >= 500) level = 'expert';
  if (score >= 1000) level = 'moderator';
  
  return {
    userId: '',
    score,
    level,
    violations: user.reportsReceived,
    contributions: user.postsCount + user.helpfulVotes
  };
};

// Community guidelines
export const COMMUNITY_GUIDELINES = [
  {
    id: 'respect',
    title: 'Be Respectful',
    description: 'Treat all community members with respect and kindness.'
  },
  {
    id: 'authentic',
    title: 'Share Authentic Experiences',
    description: 'Only share genuine travel experiences and accurate information.'
  },
  {
    id: 'no_spam',
    title: 'No Spam or Self-Promotion',
    description: 'Avoid excessive promotional content or repetitive posts.'
  },
  {
    id: 'privacy',
    title: 'Respect Privacy',
    description: 'Do not share personal information of others without consent.'
  },
  {
    id: 'appropriate',
    title: 'Keep Content Appropriate',
    description: 'Ensure all content is suitable for a diverse, global audience.'
  }
];

export const enforceGuidelines = (post: Post, userReputation: UserReputation): {
  approved: boolean;
  requiresReview: boolean;
  reason?: string;
} => {
  const moderation = analyzeContent(post.content?.text || '');
  
  // Auto-approve trusted users with clean content
  if (userReputation.level === 'trusted' && moderation.isAppropriate) {
    return { approved: true, requiresReview: false };
  }
  
  // Flag for review if content is questionable
  if (!moderation.isAppropriate || userReputation.violations > 2) {
    return {
      approved: false,
      requiresReview: true,
      reason: moderation.flags.join(', ')
    };
  }
  
  return { approved: true, requiresReview: false };
};