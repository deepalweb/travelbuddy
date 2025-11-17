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
  };
  images: string[];
  views: number;
  claims: number;
  isActive: boolean;
  validUntil?: Date;
}
