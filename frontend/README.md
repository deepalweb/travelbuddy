# TravelBuddy Web Application

A unified web application that combines user-facing features with admin portal functionality.

## Features

### User Features
- **Homepage**: Modern landing page with hero section and features
- **Authentication**: Login/logout with role-based access
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Protected Routes**: Authentication-based route protection

### Admin Features
- **Dashboard**: Comprehensive admin dashboard with statistics
- **User Management**: View and manage platform users
- **Content Moderation**: Review and moderate user-generated content
- **Analytics**: Platform analytics and insights
- **System Monitoring**: Real-time system health status

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Routing**: React Router DOM v7
- **State Management**: React Query (TanStack Query)
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Build Tool**: Vite

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Demo Credentials

**Regular User:**
- Email: `user@demo.com`
- Password: `password`

**Admin User:**
- Email: `admin@travelbuddy.com`
- Password: `password`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Layout.tsx
│   └── ProtectedRoute.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── pages/              # Page components
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   └── AdminDashboard.tsx
├── lib/                # Utility functions
│   └── utils.ts
├── App.tsx             # Main app component
└── main.tsx           # App entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features Overview

### Authentication System
- JWT-based authentication (mock implementation)
- Role-based access control (user/admin)
- Protected routes with automatic redirects
- Persistent login state

### Admin Dashboard
- **Overview Tab**: Recent activity and system health
- **User Management**: User list with status and actions
- **Content Moderation**: Report management system
- **Analytics**: Charts and metrics (placeholder)

### Design System
- Consistent color palette with CSS custom properties
- Responsive breakpoints
- Reusable component library
- Accessible UI components

## Backend Integration

The app is configured to work with the existing backend:
- API proxy configured for `/api` routes
- Authentication endpoints ready
- Error handling for API calls

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting service

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new components
3. Add proper error handling
4. Test on mobile devices
5. Update documentation as needed

## License

This project is part of the TravelBuddy platform.