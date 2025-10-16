import { lazy } from 'react';

export const HomePage = lazy(() => import('./features/home/HomePage'));
export const ExplorePage = lazy(() => import('./features/explore/ExplorePage'));
export const TripsPage = lazy(() => import('./features/trips/TripsPage'));
export const CommunityPage = lazy(() => import('./features/community/CommunityPage'));
export const ProfilePage = lazy(() => import('./features/profile/ProfilePage'));