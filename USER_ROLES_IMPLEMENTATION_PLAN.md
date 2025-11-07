# User Roles Implementation Plan - TravelBuddy

## Overview
This document outlines the implementation of a comprehensive 4-role user system for the TravelBuddy application, enabling different types of users to have specialized functionalities and permissions.

## Role Structure

### 1. **User (Regular Traveler)**
- **Purpose**: Browse and book travel services, share experiences
- **Permissions**: 
  - Search places and services
  - Create posts and reviews
  - Book services from other providers
  - Manage personal travel plans
- **Features**:
  - Access to all travel content
  - Booking system for services
  - Social features (posts, reviews)
  - Personal trip planning tools

### 2. **Merchant (Business Owner)**
- **Purpose**: Create and manage deals for their business
- **Permissions**:
  - Create and manage promotional deals
  - Manage business profile
  - View analytics and customer engagement
  - Access to merchant dashboard
- **Features**:
  - Deal creation and management
  - Business analytics dashboard
  - Customer engagement tools
  - Revenue tracking
- **Verification**: Required (business license, documentation)

### 3. **Transport Service Provider**
- **Purpose**: Offer transportation services to travelers
- **Permissions**:
  - Create and manage transport services
  - Manage vehicle fleet information
  - Accept and manage bookings
  - Route management and optimization
- **Features**:
  - Service listing management
  - Fleet management dashboard
  - Booking system integration
  - Route planning tools
- **Verification**: Required (transport license, insurance, vehicle registration)

### 4. **Travel Agent (Professional Service Provider)**
- **Purpose**: Provide professional travel planning and booking services
- **Permissions**:
  - Create travel packages and itineraries
  - Manage client bookings and relationships
  - Access to advanced planning tools
  - Professional agent profile management
- **Features**:
  - Professional agent profile
  - Travel package creation
  - Client management system
  - Advanced itinerary builder
  - Commission tracking
- **Verification**: Required (agent license, certifications, professional credentials)

## Implementation Components

### Backend Implementation ✅

#### 1. **Enhanced RBAC System** (`backend/middleware/rbac.js`)
- Comprehensive permission system for all 4 roles
- Role-based access control middleware
- Permission validation functions

#### 2. **Transport Provider Routes** (`backend/routes/transport-providers.js`)
- Registration and profile management
- Service creation and management
- Booking handling
- Fleet management

#### 3. **Travel Agent Routes** (`backend/routes/travel-agents.js`)
- Agent registration and verification
- Package creation and management
- Client booking system
- Profile management with ratings

#### 4. **Enhanced Role Management** (`backend/routes/roles.js`)
- Role change requests for all 4 roles
- Available roles endpoint
- Profile-specific data handling

#### 5. **Updated User Schema** (`backend/server.js`)
- Enhanced role enum: `['user', 'merchant', 'transport_provider', 'travel_agent', 'admin']`
- New profile schemas:
  - `agentProfile`: Travel agent specific data
  - `transportProfile`: Transport provider specific data
- Database indexes for efficient role queries

### Frontend Implementation ✅

#### 1. **Role Selection Page** (`frontend/src/pages/RoleSelectionPage.tsx`)
- Comprehensive role selection interface
- Detailed role descriptions and benefits
- Verification requirements display
- Navigation to appropriate registration forms

#### 2. **Transport Registration** (`frontend/src/pages/TransportRegistration.tsx`)
- Complete registration form for transport providers
- Vehicle type and service area selection
- Document upload functionality
- Fleet size and licensing information

#### 3. **Enhanced Agent Registration** (Enhanced existing `AgentRegistration.tsx`)
- Professional travel agent registration
- Specialization and language selection
- Experience and certification tracking
- Document verification system

#### 4. **Transportation Services Page** (`frontend/src/pages/TransportationPage.tsx`)
- Service discovery and booking interface
- Advanced filtering and search
- Provider profiles and ratings
- Real-time availability checking

## User Journey Flows

### 1. **New User Registration**
```
1. User signs up → Role Selection Page
2. Choose role type → Appropriate registration form
3. Complete profile → Verification process (if required)
4. Approval → Access to role-specific features
```

### 2. **Merchant Journey**
```
1. Register as Merchant → Business verification
2. Create business profile → Upload documentation
3. Approval → Access to merchant dashboard
4. Create deals → Manage customer engagement
```

### 3. **Transport Provider Journey**
```
1. Register as Transport Provider → License verification
2. Add fleet information → Upload insurance/registration
3. Approval → Create service listings
4. Manage bookings → Track revenue
```

### 4. **Travel Agent Journey**
```
1. Register as Travel Agent → Professional verification
2. Add certifications → Upload credentials
3. Approval → Create agent profile
4. Build packages → Manage client bookings
```

## Verification Process

### **Merchant Verification**
- Business license validation
- Address verification
- Tax registration check
- Insurance documentation

### **Transport Provider Verification**
- Transport license validation
- Vehicle registration documents
- Insurance certificates
- Driver certifications

### **Travel Agent Verification**
- Professional license validation
- Industry certifications
- Experience verification
- Reference checks

## Permission Matrix

| Feature | User | Merchant | Transport | Agent | Admin |
|---------|------|----------|-----------|-------|-------|
| Search Places | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Posts | ✅ | ✅ | ✅ | ✅ | ✅ |
| Book Services | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Deals | ❌ | ✅ | ❌ | ❌ | ✅ |
| Manage Fleet | ❌ | ❌ | ✅ | ❌ | ✅ |
| Create Packages | ❌ | ❌ | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ❌ | ✅ |
| Approve Roles | ❌ | ❌ | ❌ | ❌ | ✅ |

## Database Schema Updates

### **User Model Enhancements**
```javascript
{
  role: ['user', 'merchant', 'transport_provider', 'travel_agent', 'admin'],
  
  // Merchant Profile
  businessProfile: {
    businessName, businessType, address, phone, email,
    verificationStatus: ['pending', 'approved', 'rejected'],
    isActive: Boolean
  },
  
  // Transport Provider Profile
  transportProfile: {
    companyName, ownerName, licenseNumber, vehicleTypes,
    serviceAreas, fleetSize, documents,
    verificationStatus: ['pending', 'approved', 'rejected'],
    isActive: Boolean
  },
  
  // Travel Agent Profile
  agentProfile: {
    agencyName, ownerName, licenseNumber, experience,
    specialties, languages, certifications,
    verificationStatus: ['pending', 'approved', 'rejected'],
    isActive: Boolean, rating: Number, reviewCount: Number
  }
}
```

## API Endpoints

### **Role Management**
- `GET /api/roles/available` - Get available roles
- `POST /api/roles/request-change` - Request role change
- `GET /api/roles/me` - Get current user role and permissions

### **Transport Providers**
- `POST /api/transport-providers/register` - Register as transport provider
- `GET /api/transport-providers/services` - Get available transport services
- `POST /api/transport-providers/services` - Create transport service
- `GET /api/transport-providers/my-services` - Get provider's services
- `GET /api/transport-providers/bookings` - Get provider's bookings

### **Travel Agents**
- `POST /api/travel-agents/register` - Register as travel agent
- `GET /api/travel-agents` - Get all verified agents
- `GET /api/travel-agents/:id` - Get agent profile
- `POST /api/travel-agents/packages` - Create travel package
- `GET /api/travel-agents/my/packages` - Get agent's packages
- `GET /api/travel-agents/my/bookings` - Get agent's bookings

## Security Considerations

### **Role-Based Access Control**
- Middleware validation for all protected routes
- Permission checking before sensitive operations
- Audit logging for role changes and administrative actions

### **Verification Security**
- Document validation and storage
- Multi-step verification process
- Admin approval workflow
- Fraud detection mechanisms

## Future Enhancements

### **Phase 2 Features**
1. **Advanced Analytics**
   - Role-specific dashboards
   - Performance metrics
   - Revenue tracking

2. **Commission System**
   - Automated commission calculations
   - Payment processing integration
   - Revenue sharing models

3. **Rating and Review System**
   - Service provider ratings
   - Customer feedback integration
   - Quality assurance metrics

4. **Mobile App Integration**
   - Role-specific mobile interfaces
   - Push notifications for bookings
   - Offline functionality

## Implementation Status

### ✅ **Completed**
- Backend RBAC system
- Transport provider routes and registration
- Travel agent routes and management
- Enhanced role management system
- Frontend role selection interface
- Transport registration page
- Transportation services page
- Database schema updates

### 🔄 **In Progress**
- Admin approval workflows
- Verification document handling
- Payment integration for services

### 📋 **Planned**
- Mobile app role interfaces
- Advanced analytics dashboards
- Commission tracking system
- Enhanced security features

## Deployment Notes

### **Environment Variables**
```env
# Role System Configuration
ENFORCE_ROLE_VERIFICATION=true
DEFAULT_USER_ROLE=user
ADMIN_APPROVAL_REQUIRED=true

# Verification Settings
DOCUMENT_UPLOAD_PATH=/uploads/verification
MAX_DOCUMENT_SIZE=10MB
ALLOWED_DOCUMENT_TYPES=pdf,jpg,png
```

### **Database Migrations**
1. Update existing users with new role enum
2. Add new profile fields to User collection
3. Create indexes for efficient role queries
4. Migrate existing merchant data to new schema

This implementation provides a robust, scalable role-based system that can accommodate the diverse needs of different user types while maintaining security and ease of use.