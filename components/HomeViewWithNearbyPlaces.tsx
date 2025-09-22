import React from 'react';
import HomeView from './HomeView.tsx';
import NearbyPlacesWidget from './NearbyPlacesWidget.tsx';
import { Place } from '../types';

interface HomeViewWithNearbyPlacesProps {
  currentUser: any;
  userLocation: { latitude: number; longitude: number } | null;
  userCity: string | null;
  localInfo: any;
  isLoading: boolean;
  supportLocations: any[];
  onShowSOSModal: () => void;
  onTabChange: (tab: string) => void;
  onSurpriseMeClick: () => void;
  favoritePlacesCount: number;
  favoritePlaces: Place[];
  onSelectPlaceDetail: (place: Place) => void;
}

const HomeViewWithNearbyPlaces: React.FC<HomeViewWithNearbyPlacesProps> = ({
  currentUser,
  userLocation,
  userCity,
  localInfo,
  isLoading,
  supportLocations,
  onShowSOSModal,
  onTabChange,
  onSurpriseMeClick,
  favoritePlacesCount,
  favoritePlaces,
  onSelectPlaceDetail
}) => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Original Home View Content */}
      <HomeView
        currentUser={currentUser}
        userLocation={userLocation}
        userCity={userCity}
        localInfo={localInfo}
        isLoading={isLoading}
        supportLocations={supportLocations}
        onShowSOSModal={onShowSOSModal}
        onTabChange={onTabChange}
        onSurpriseMeClick={onSurpriseMeClick}
        favoritePlacesCount={favoritePlacesCount}
        favoritePlaces={favoritePlaces}
      />
      
      {/* Nearby Places Widget */}
      {userLocation && (
        <div className="mt-8">
          <NearbyPlacesWidget
            userLocation={userLocation}
            onSelectPlace={onSelectPlaceDetail}
          />
        </div>
      )}
    </div>
  );
};

export default HomeViewWithNearbyPlaces;