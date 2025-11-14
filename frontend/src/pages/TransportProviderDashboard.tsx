import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../components/Card'
import { Button } from '../components/Button'
import { 
  TrendingUp, TrendingDown, Users, DollarSign, 
  Star, Eye, Calendar, MapPin, Clock, Phone,
  Plus, Edit, Trash2, ToggleLeft, ToggleRight,
  BarChart3, PieChart, Activity, Bell
} from 'lucide-react'

interface ServiceAnalytics {
  totalRevenue: number
  totalBookings: number
  averageRating: number
  activeServices: number
  revenueGrowth: number
  bookingsGrowth: number
}

interface Service {
  id: string
  route: string
  vehicleType: string
  price: number
  status: 'active' | 'inactive'
  bookings: number
  revenue: number
  rating: number
  views: number
  lastBooking: string
  occupancyRate: number
}

interface Booking {
  id: string
  customerName: string
  customerPhone: string
  service: string
  date: string
  time: string
  seats: number
  amount: number
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  paymentMethod: string
}

export const TransportProviderDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<ServiceAnalytics | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'bookings' | 'analytics'>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    
    // Mock data - replace with actual API calls
    setTimeout(() => {
      setAnalytics({
        totalRevenue: 25000,
        totalBookings: 45,
        averageRating: 4.6,
        activeServices: 3,
        revenueGrowth: 13.6,
        bookingsGrowth: 18.4
      })

      setServices([
        {
          id: '1',
          route: 'Colombo - Kandy',
          vehicleType: 'Bus',
          price: 500,
          status: 'active',
          bookings: 25,
          revenue: 12500,
          rating: 4.5,
          views: 234,
          lastBooking: '2 hours ago',
          occupancyRate: 85
        },
        {
          id: '2',
          route: 'Kandy - Nuwara Eliya',
          vehicleType: 'Van',
          price: 800,
          status: 'active',
          bookings: 20,
          revenue: 16000,
          rating: 4.8,
          views: 156,
          lastBooking: '1 day ago',
          occupancyRate: 92
        }
      ])

      setBookings([
        {
          id: 'B001',
          customerName: 'John Doe',
          customerPhone: '+94 77 123 4567',
          service: 'Colombo - Kandy',
          date: '2024-01-15',
          time: '08:00 AM',
          seats: 2,
          amount: 1000,
          status: 'confirmed',
          paymentMethod: 'Card'
        },
        {
          id: 'B002',
          customerName: 'Sarah Miller',
          customerPhone: '+94 71 987 6543',
          service: 'Airport - Colombo',
          date: '2024-01-16',
          time: 'On Demand',
          seats: 1,
          amount: 2500,
          status: 'pending',
          paymentMethod: 'Cash'
        }
      ])

      setLoading(false)
    }, 1000)
  }

  const toggleServiceStatus = (serviceId: string) => {
    setServices(prev => prev.map(service => 
      service.id === serviceId 
        ? { ...service, status: service.status === 'active' ? 'inactive' : 'active' }
        : service
    ))
  }

  const updateBookingStatus = (bookingId: string, newStatus: Booking['status']) => {
    setBookings(prev => prev.map(booking =>
      booking.id === bookingId
        ? { ...booking, status: newStatus }
        : booking
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transport Provider Dashboard</h1>
          <p className="text-gray-600">Manage your transport services and track performance</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'services', label: 'My Services', icon: MapPin },
                { id: 'bookings', label: 'Bookings', icon: Calendar },
                { id: 'analytics', label: 'Analytics', icon: PieChart }
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && analytics && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">LKR {analytics.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+{analytics.revenueGrowth}% from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.totalBookings}</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+{analytics.bookingsGrowth}% from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Rating</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.averageRating}</p>
                    </div>
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-yellow-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-sm text-gray-600">Excellent rating</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Services</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.activeServices}</p>
                    </div>
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Activity className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center">
                    <Activity className="w-4 h-4 text-purple-500 mr-1" />
                    <span className="text-sm text-gray-600">All systems operational</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h3>
                  <div className="space-y-4">
                    {bookings.slice(0, 3).map(booking => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{booking.customerName}</p>
                          <p className="text-sm text-gray-600">{booking.service} • {booking.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">LKR {booking.amount}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Services</h3>
                  <div className="space-y-4">
                    {services.map(service => (
                      <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{service.route}</p>
                          <p className="text-sm text-gray-600">{service.bookings} bookings • {service.occupancyRate}% occupancy</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">LKR {service.revenue.toLocaleString()}</p>
                          <div className="flex items-center">
                            <Star className="w-3 h-3 text-yellow-500 mr-1" />
                            <span className="text-sm text-gray-600">{service.rating}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">My Services</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add New Service
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {services.map(service => (
                <Card key={service.id} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{service.route}</h3>
                        <p className="text-gray-600">{service.vehicleType} • LKR {service.price}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleServiceStatus(service.id)}
                          className="flex items-center"
                        >
                          {service.status === 'active' ? (
                            <ToggleRight className="w-8 h-8 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-gray-400" />
                          )}
                        </button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{service.bookings}</p>
                        <p className="text-sm text-gray-600">Bookings</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">LKR {service.revenue.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Revenue</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{service.rating}</p>
                        <p className="text-sm text-gray-600">Rating</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{service.occupancyRate}%</p>
                        <p className="text-sm text-gray-600">Occupancy</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                      <span>Last booking: {service.lastBooking}</span>
                      <span>{service.views} views this month</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Bookings Management</h2>
              <div className="flex space-x-2">
                <select className="px-3 py-2 border border-gray-300 rounded-lg">
                  <option>All Status</option>
                  <option>Pending</option>
                  <option>Confirmed</option>
                  <option>Completed</option>
                </select>
              </div>
            </div>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {bookings.map(booking => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{booking.id}</td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{booking.customerName}</p>
                              <p className="text-sm text-gray-600">{booking.customerPhone}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{booking.service}</td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm text-gray-900">{booking.date}</p>
                              <p className="text-sm text-gray-600">{booking.time}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">LKR {booking.amount}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              {booking.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                >
                                  Confirm
                                </Button>
                              )}
                              <Button variant="outline" size="sm">
                                <Phone className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Analytics & Insights</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
                  <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Revenue chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Distribution</h3>
                  <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Booking distribution chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Peak Hours</h4>
                    <p className="text-2xl font-bold text-blue-600">8-10 AM</p>
                    <p className="text-sm text-blue-700">Most bookings occur</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Best Route</h4>
                    <p className="text-lg font-bold text-green-600">Colombo - Kandy</p>
                    <p className="text-sm text-green-700">Highest revenue generator</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">Customer Satisfaction</h4>
                    <p className="text-2xl font-bold text-purple-600">96%</p>
                    <p className="text-sm text-purple-700">Positive feedback rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}