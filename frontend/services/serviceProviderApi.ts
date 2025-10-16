const API_BASE = '/api';

export interface Service {
  _id?: string;
  userId: string;
  name: string;
  type: string;
  description?: string;
  price: number;
  duration?: string;
  location?: string;
  status: 'active' | 'paused';
  bookings: number;
}

export interface Booking {
  _id?: string;
  serviceId: string;
  providerId: string;
  clientId: string;
  serviceName: string;
  clientName: string;
  date: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export interface ServiceMetrics {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalEarnings: number;
}

class ServiceProviderAPI {
  // Services
  async getServices(userId: string): Promise<Service[]> {
    const response = await fetch(`${API_BASE}/services/user/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch services');
    return response.json();
  }

  async createService(service: Omit<Service, '_id' | 'bookings'>): Promise<Service> {
    const response = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    });
    if (!response.ok) throw new Error('Failed to create service');
    return response.json();
  }

  async updateServiceStatus(serviceId: string, status: 'active' | 'paused'): Promise<Service> {
    const response = await fetch(`${API_BASE}/services/${serviceId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update service status');
    return response.json();
  }

  // Bookings
  async getBookings(userId: string, status?: string): Promise<Booking[]> {
    const url = status ? `${API_BASE}/bookings/provider/${userId}?status=${status}` : `${API_BASE}/bookings/provider/${userId}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return response.json();
  }

  async updateBookingStatus(bookingId: string, status: string): Promise<Booking> {
    const response = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update booking status');
    return response.json();
  }

  async getMetrics(userId: string): Promise<ServiceMetrics> {
    const response = await fetch(`${API_BASE}/bookings/metrics/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return response.json();
  }
}

export const serviceProviderAPI = new ServiceProviderAPI();