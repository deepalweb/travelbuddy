import { apiService } from './apiService.ts';

export const favoritesService = {
  async addFavorite(userId: string, placeId: string): Promise<void> {
    await apiService.post(`/users/${userId}/favorites`, { placeId });
  },

  async removeFavorite(userId: string, placeId: string): Promise<void> {
    await apiService.delete(`/users/${userId}/favorites/${placeId}`);
  },

  async getFavorites(userId: string): Promise<string[]> {
    const response = await apiService.get(`/users/${userId}/favorites`);
    return response || [];
  }
};