// 4-Role System Types
export type UserRole = 'regular' | 'merchant' | 'agent' | 'admin';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'search' | 'business' | 'booking' | 'admin' | 'content';
}

export interface RolePermissions {
  regular: string[];
  merchant: string[];
  agent: string[];
  admin: string[];
}

export interface BusinessProfile {
  businessName: string;
  businessType: 'hotel' | 'restaurant' | 'cafe' | 'shop' | 'attraction';
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  businessHours: string;
  businessDescription: string;
  businessLogo?: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  subscriptionTier: 'basic' | 'premium' | 'enterprise';
  commissionRate: number;
}

export interface ServiceProfile {
  serviceName: string;
  serviceType: 'guide' | 'driver' | 'tour_operator' | 'transport';
  serviceDescription: string;
  serviceArea: string;
  languages: string[];
  pricing: {
    hourlyRate?: number;
    dailyRate?: number;
    fixedPrice?: number;
    currency: string;
  };
  availability: {
    days: string[];
    hours: string;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  rating: number;
  totalBookings: number;
}

export interface EnhancedUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: string[];
  
  // Regular user fields
  subscriptionTier?: 'free' | 'basic' | 'premium' | 'pro';
  subscriptionStatus?: 'none' | 'trial' | 'active' | 'expired';
  
  // Business fields
  businessProfile?: BusinessProfile;
  
  // Service provider fields
  serviceProfile?: ServiceProfile;
  
  // Admin fields
  adminLevel?: 'moderator' | 'admin' | 'super_admin';
  
  // Common fields
  profilePicture?: string;
  isVerified: boolean;
  createdAt: string;
  lastActive: string;
}