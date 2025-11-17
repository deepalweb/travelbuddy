import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Store, Car, MapPin, Settings, 
  BarChart3, Users, Package, Calendar 
} from 'lucide-react'

interface RoleBasedNavigationProps {
  userRole: string
  className?: string
}

export const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({ 
  userRole, 
  className = '' 
}) => {
  const getNavigationItems = () => {
    const baseItems = [
      { to: '/', label: 'Explore', icon: <MapPin className="w-4 h-4" /> },
      { to: '/trips', label: 'My Trips', icon: <Calendar className="w-4 h-4" /> }
    ]

    const roleSpecificItems = {
      merchant: [
        { to: '/merchant/deals', label: 'My Deals', icon: <Store className="w-4 h-4" /> },
        { to: '/merchant/analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> }
      ],
      transport_provider: [
        { to: '/transport/services', label: 'My Services', icon: <Car className="w-4 h-4" /> },
        { to: '/transport/bookings', label: 'Bookings', icon: <Calendar className="w-4 h-4" /> }
      ],
      travel_agent: [
        { to: '/agent/packages', label: 'Packages', icon: <Package className="w-4 h-4" /> },
        { to: '/agent/clients', label: 'Clients', icon: <Users className="w-4 h-4" /> }
      ],
      admin: [
        { to: '/admin', label: 'Dashboard', icon: <Settings className="w-4 h-4" /> }
      ]
    }

    return [...baseItems, ...(roleSpecificItems[userRole] || [])]
  }

  return (
    <nav className={`flex space-x-4 ${className}`}>
      {getNavigationItems().map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {item.icon}
          <span className="text-sm font-medium">{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
