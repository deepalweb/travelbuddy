import { Deal } from '../types.ts';

export interface BackendDeal {
  _id: string;
  title: string;
  description: string;
  discount: string;
  placeId: string; // should align with Place.id (Google place_id)
  isActive: boolean;
  createdAt: string;
  price?: { amount: number; currencyCode: string };
  isPremium?: boolean;
  placeName?: string;
}

export async function fetchActiveDeals(): Promise<BackendDeal[]> {
  const resp = await fetch('/api/deals');
  if (!resp.ok) {
    // If backend deals are disabled or erroring, return empty list gracefully
    return [];
  }
  return resp.json();
}

export function toFrontendDeal(b: BackendDeal, fallbackPlaceName: string): Deal {
  return {
    id: b._id,
    title: b.title,
    description: b.description,
    discount: b.discount,
    placeName: b.placeName || fallbackPlaceName,
    price: b.price,
    isPremium: !!b.isPremium,
  };
}
