import React, { useState, useEffect } from 'react';
import { CurrentUser } from '../../types';
import ServiceCreationModal from '../ServiceCreationModal';
import AvailabilityCalendar from '../AvailabilityCalendar';
import { serviceProviderAPI, Service, Booking, ServiceMetrics } from '../../services/serviceProviderApi';



interface AgentDashboardProps {
  user: CurrentUser;
}

const AgentDashboard: React.FC<AgentDashboardProps> = ({ user }) => {
  const [metrics, setMetrics] = useState({
    totalBookings: 12,
    activeBookings: 2,
    totalEarnings: 850,
    rating: 4.6,
    completedServices: 10
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'services' | 'earnings'>('overview');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [availability, setAvailability] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const handleCreateService = async (serviceData: any) => {
    try {
      const newService = await serviceProviderAPI.createService({
        userId: user.mongoId || user.id,
        name: serviceData.name,
        type: serviceData.type,
        description: serviceData.description,
        price: serviceData.price,
        duration: serviceData.duration,
        location: serviceData.location,
        status: 'active'
      });
      setServices([...services, newService]);
    } catch (error) {
      console.error('Failed to create service:', error);
    }
  };

  const handleServiceAction = async (serviceId: string, action: 'pause' | 'activate') => {
    try {
      const status = action === 'pause' ? 'paused' : 'active';
      const updatedService = await serviceProviderAPI.updateServiceStatus(serviceId, status);
      setServices(services.map(service => 
        service._id === serviceId ? updatedService : service
      ));
    } catch (error) {
      console.error('Failed to update service status:', error);
    }
  };

  const handleBookingAction = async (bookingId: string) => {
    try {
      const updatedBooking = await serviceProviderAPI.updateBookingStatus(bookingId, 'confirmed');
      setBookings(bookings.map(booking => 
        booking._id === bookingId ? updatedBooking : booking
      ));
      loadMetrics();
    } catch (error) {
      console.error('Failed to update booking status:', error);
    }
  };

  const handleAvailabilityUpdate = (newAvailability: string[]) => {
    setAvailability(newAvailability);
  };

  const filteredBookings = statusFilter === 'all' ? bookings : bookings.filter(b => b.status === statusFilter);

  const loadServices = async () => {
    try {
      const userServices = await serviceProviderAPI.getServices(user.mongoId || user.id);
      setServices(userServices);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const loadBookings = async () => {
    try {
      const userBookings = await serviceProviderAPI.getBookings(user.mongoId || user.id);
      setBookings(userBookings);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      const metricsData = await serviceProviderAPI.getMetrics(user.mongoId || user.id);
      setMetrics({
        totalBookings: metricsData.totalBookings,
        activeBookings: metricsData.activeBookings,
        totalEarnings: metricsData.totalEarnings,
        rating: 4.6,
        completedServices: metricsData.completedBookings
      });
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadServices(), loadBookings(), loadMetrics()]);
      setLoading(false);
    };
    loadData();
  }, [user.mongoId, user.id]);

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-600">Total Bookings</h3>
          <p className="text-2xl font-bold text-blue-600">{metrics.totalBookings}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-600">Active</h3>
          <p className="text-2xl font-bold text-green-600">{metrics.activeBookings}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <h3 className="text-sm font-medium text-gray-600">Earnings</h3>
          <p className="text-2xl font-bold text-yellow-600">${metrics.totalEarnings}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-600">Rating</h3>
          <p className="text-2xl font-bold text-purple-600">{metrics.rating}⭐</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
          <div className="space-y-3">
            {bookings.slice(0, 3).map(booking => (
              <div key={booking._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{booking.serviceName}</p>
                  <p className="text-sm text-gray-600">{booking.clientName} • {booking.date}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => setShowAvailabilityModal(true)}
              className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
            >
              📅 Update Availability
            </button>
            <button 
              onClick={() => setShowServiceModal(true)}
              className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700"
            >
              ➕ Add New Service
            </button>
            <button className="w-full bg-purple-600 text-white p-3 rounded hover:bg-purple-700">
              💬 Message Clients
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Booking Management</h3>
        <div className="flex gap-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Service</th>
              <th className="text-left py-3 px-4">Client</th>
              <th className="text-left py-3 px-4">Date</th>
              <th className="text-left py-3 px-4">Amount</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map(booking => (
              <tr key={booking._id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{booking.serviceName}</td>
                <td className="py-3 px-4">{booking.clientName}</td>
                <td className="py-3 px-4">{booking.date}</td>
                <td className="py-3 px-4">${booking.amount}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs rounded ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                    {booking.status === 'pending' && (
                      <button 
                        onClick={() => handleBookingAction(booking._id!)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Accept
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">My Services</h3>
          <button 
            onClick={() => setShowServiceModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            ➕ Add Service
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map(service => (
            <div key={service._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium">{service.name}</h4>
                <span className={`px-2 py-1 text-xs rounded ${
                  service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {service.status}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-3">{service.type}</p>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">${service.price}</span>
                <span className="text-sm text-gray-500">{service.bookings} bookings</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                <button className="text-green-600 hover:text-green-800 text-sm">Promote</button>
                <button 
                  onClick={() => handleServiceAction(service._id!, service.status === 'active' ? 'pause' : 'activate')}
                  className={`text-sm ${
                    service.status === 'active' 
                      ? 'text-red-600 hover:text-red-800' 
                      : 'text-green-600 hover:text-green-800'
                  }`}
                >
                  {service.status === 'active' ? 'Pause' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEarnings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="font-medium text-gray-600 mb-2">This Month</h4>
          <p className="text-3xl font-bold text-green-600">$425</p>
          <p className="text-sm text-gray-500">+12% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="font-medium text-gray-600 mb-2">Pending</h4>
          <p className="text-3xl font-bold text-yellow-600">$125</p>
          <p className="text-sm text-gray-500">2 pending payments</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="font-medium text-gray-600 mb-2">Total Earned</h4>
          <p className="text-3xl font-bold text-blue-600">${metrics.totalEarnings}</p>
          <p className="text-sm text-gray-500">All time</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium">City Walking Tour</p>
              <p className="text-sm text-gray-600">John D. • Jan 15, 2024</p>
            </div>
            <span className="font-semibold text-green-600">+$50</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium">Airport Transfer</p>
              <p className="text-sm text-gray-600">Sarah M. • Jan 14, 2024</p>
            </div>
            <span className="font-semibold text-green-600">+$25</span>
          </div>
        </div>
      </div>
    </div>
  );



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="agent-dashboard">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Service Provider Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user.serviceProfile?.serviceName || user.username}!</p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'bookings', label: 'Bookings' },
            { id: 'services', label: 'Services' },
            { id: 'earnings', label: 'Earnings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'bookings' && renderBookings()}
      {activeTab === 'services' && renderServices()}
      {activeTab === 'earnings' && renderEarnings()}
      
      <ServiceCreationModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        onSubmit={handleCreateService}
      />
      
      <AvailabilityCalendar
        isOpen={showAvailabilityModal}
        onClose={() => setShowAvailabilityModal(false)}
        onSave={handleAvailabilityUpdate}
      />
    </div>
  );
};

export default AgentDashboard;