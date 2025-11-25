export interface Deal {
  _id: string;
  title: string;
  description: string;
  discount: string;
  businessName: string;
  businessType: string;
  originalPrice: string;
  discountedPrice: string;
  location: {
    address: string;
    lat?: number;
    lng?: number;
  };
  images: string[];
  views: number;
  claims: number;
  isActive: boolean;
  validUntil?: Date;
  createdAt?: Date;
  aiRank?: 'best-value' | 'trending' | 'limited-time';
  userCategory?: 'foodie' | 'adventure' | 'budget';
  distance?: number;
  contactInfo?: {
    website?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    facebook?: string;
    instagram?: string;
  };
}
