import React, { useState } from 'react'
import { Button } from './Button'
import { Card, CardContent } from './Card'
import { ChevronDown, UserCheck, Plus } from 'lucide-react'

interface RoleSwitcherProps {
  userRoles: string[]
  activeRole: string
  onSwitchRole: (role: string) => void
  onAddRole: () => void
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  userRoles,
  activeRole,
  onSwitchRole,
  onAddRole
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const roleLabels = {
    user: 'Traveler',
    merchant: 'Merchant',
    transport_provider: 'Transport Provider',
    travel_agent: 'Travel Agent',
    admin: 'Admin'
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <UserCheck className="w-4 h-4" />
        <span>{roleLabels[activeRole] || 'User'}</span>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <Card className="absolute top-full mt-2 right-0 z-50 min-w-48">
          <CardContent className="p-2">
            <div className="space-y-1">
              {userRoles.map(role => (
                <button
                  key={role}
                  onClick={() => {
                    onSwitchRole(role)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    role === activeRole 
                      ? 'bg-blue-100 text-blue-900' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {roleLabels[role]}
                  {role === activeRole && (
                    <span className="ml-2 text-xs text-blue-600">Active</span>
                  )}
                </button>
              ))}
              
              <hr className="my-2" />
              
              <button
                onClick={() => {
                  onAddRole()
                  setIsOpen(false)
                }}
                className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Role</span>
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}