import React, { useState, useEffect, useRef } from 'react';
import { CurrentUser } from '../types';
import { 
  Users, Plus, Clock, DollarSign, MapPin, Calendar, 
  MessageCircle, CheckCircle, AlertTriangle, Send,
  Settings, Share2, Download, Zap
} from './Icons';
import { 
  realTimeCollaborationService, 
  CollaborativeTripPlan, 
  TripCollaborator, 
  CollaborativeActivity,
  RealTimeUpdate
} from '../services/realTimeCollaborationService';
import { advancedOptimizationService, OptimizedRoute } from '../services/advancedOptimizationService';

interface CollaborativeTripPlannerViewProps {
  currentUser: CurrentUser | null;
  onClose: () => void;
}

const CollaborativeTripPlannerView: React.FC<CollaborativeTripPlannerViewProps> = ({
  currentUser,
  onClose
}) => {
  const [activeTrip, setActiveTrip] = useState<CollaborativeTripPlan | null>(null);
  const [userTrips, setUserTrips] = useState<CollaborativeTripPlan[]>([]);
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Real-time updates
  const [updates, setUpdates] = useState<RealTimeUpdate[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Form states
  const [newTripForm, setNewTripForm] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: ''
  });
  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'editor' as 'editor' | 'viewer'
  });
  
  const [activityForm, setActivityForm] = useState({
    name: '',
    location: '',
    date: '',
    estimatedCost: 0
  });
  
  const [chatMessage, setChatMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'budget' | 'chat'>('overview');

  useEffect(() => {
    if (currentUser) {
      loadUserTrips();
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeTrip && currentUser) {
      connectToRealTimeUpdates();
    }
    
    return () => {
      // if (wsRef.current) {
      //   wsRef.current.close();
      // }
    };
  }, [activeTrip, currentUser]);

  const loadUserTrips = () => {
    if (!currentUser) return;
    const trips = realTimeCollaborationService.getUserTrips(currentUser.mongoId || currentUser.username);
    setUserTrips(trips);
  };

  const connectToRealTimeUpdates = () => {
    if (!activeTrip || !currentUser) return;
    
    // Mock WebSocket connection for real-time updates (disabled for now)
    // const ws = new WebSocket('ws://localhost:8080/collaboration');
    // wsRef.current = ws;
    
    // ws.onmessage = (event) => {
    //   const update: RealTimeUpdate = JSON.parse(event.data);
    //   setUpdates(prev => [update, ...prev.slice(0, 49)]); // Keep last 50 updates
    //   
    //   // Update trip data based on update type
    //   if (update.type === 'activity_added' || update.type === 'activity_voted') {
    //     const updatedTrip = realTimeCollaborationService.getTripPlan(activeTrip.id);
    //     if (updatedTrip) setActiveTrip(updatedTrip);
    //   }
    // };
    // 
    // realTimeCollaborationService.connectToTrip(activeTrip.id, currentUser.mongoId || currentUser.username, ws);
  };

  const handleCreateTrip = async () => {
    if (!currentUser || !newTripForm.title || !newTripForm.destination) return;
    
    try {
      const trip = await realTimeCollaborationService.createCollaborativeTrip(
        newTripForm.title,
        newTripForm.destination,
        newTripForm.startDate,
        newTripForm.endDate,
        currentUser.mongoId || currentUser.username,
        currentUser.username
      );
      
      setActiveTrip(trip);
      setUserTrips(prev => [trip, ...prev]);
      setShowCreateTrip(false);
      setNewTripForm({ title: '', destination: '', startDate: '', endDate: '' });
    } catch (error) {
      console.error('Failed to create trip:', error);
    }
  };

  const handleInviteCollaborator = async () => {
    if (!activeTrip || !inviteForm.email) return;
    
    try {
      await realTimeCollaborationService.inviteCollaborator(
        activeTrip.id,
        currentUser?.username || 'User',
        inviteForm.email,
        inviteForm.role
      );
      
      const updatedTrip = realTimeCollaborationService.getTripPlan(activeTrip.id);
      if (updatedTrip) setActiveTrip(updatedTrip);
      
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'editor' });
    } catch (error) {
      console.error('Failed to invite collaborator:', error);
    }
  };

  const handleSuggestActivity = async () => {
    if (!activeTrip || !currentUser || !activityForm.name) return;
    
    try {
      await realTimeCollaborationService.suggestActivity(
        activeTrip.id,
        currentUser.mongoId || currentUser.username,
        activityForm.name,
        activityForm.location,
        activityForm.date,
        activityForm.estimatedCost
      );
      
      const updatedTrip = realTimeCollaborationService.getTripPlan(activeTrip.id);
      if (updatedTrip) setActiveTrip(updatedTrip);
      
      setShowActivityModal(false);
      setActivityForm({ name: '', location: '', date: '', estimatedCost: 0 });
    } catch (error) {
      console.error('Failed to suggest activity:', error);
    }
  };

  const handleVoteActivity = async (activityId: string, vote: 'yes' | 'no' | 'maybe') => {
    if (!activeTrip || !currentUser) return;
    
    try {
      await realTimeCollaborationService.voteOnActivity(
        activeTrip.id,
        activityId,
        currentUser.mongoId || currentUser.username,
        vote
      );
      
      const updatedTrip = realTimeCollaborationService.getTripPlan(activeTrip.id);
      if (updatedTrip) setActiveTrip(updatedTrip);
    } catch (error) {
      console.error('Failed to vote on activity:', error);
    }
  };

  const handleOptimizeTrip = async () => {
    if (!activeTrip) return;
    
    setIsOptimizing(true);
    try {
      const optimization = await realTimeCollaborationService.optimizeTripPlan(activeTrip.id);
      if (optimization) {
        // Mock route optimization for demo
        const mockRoute: OptimizedRoute = {
          totalDistance: 25,
          totalTime: 480, // 8 hours
          totalCost: 150,
          efficiency: 85,
          route: optimization.optimizedActivities.map((activity, index) => ({
            place: {
              id: activity.id,
              name: activity.name,
              vicinity: activity.location,
              rating: 4.5,
              type: 'attraction'
            } as any,
            arrivalTime: `${9 + index * 2}:00`,
            departureTime: `${10 + index * 2}:00`,
            duration: activity.duration,
            travelTimeToNext: 15,
            cost: activity.cost,
            priority: 8,
            reasoning: 'Optimized based on group preferences and logistics'
          })),
          alternatives: [],
          insights: {
            bestTimeToStart: '09:00',
            crowdLevels: {},
            weatherConsiderations: ['Check weather forecast before outdoor activities'],
            budgetBreakdown: {
              transport: 30,
              activities: 80,
              food: 40,
              total: 150
            },
            timeOptimization: optimization.routeOptimization,
            alternativeOptions: [optimization.budgetOptimization]
          }
        };
        setOptimizedRoute(mockRoute);
      }
    } catch (error) {
      console.error('Failed to optimize trip:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const getVoteStatus = (activity: CollaborativeActivity) => {
    const totalCollaborators = activeTrip?.collaborators.filter(c => c.status === 'accepted').length || 1;
    const yesVotes = activity.votes.filter(v => v.vote === 'yes').length;
    const noVotes = activity.votes.filter(v => v.vote === 'no').length;
    
    if (yesVotes > totalCollaborators / 2) return 'approved';
    if (noVotes > totalCollaborators / 2) return 'rejected';
    return 'voting';
  };

  if (!currentUser) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Login Required</h2>
        <p>Please log in to access collaborative trip planning.</p>
      </div>
    );
  }

  if (!activeTrip) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Collaborative Trip Planner</h1>
          <button onClick={onClose} className="btn btn-secondary">Close</button>
        </div>

        {/* Create New Trip */}
        <div className="card-base p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Start a New Collaborative Trip</h2>
          {!showCreateTrip ? (
            <button 
              onClick={() => setShowCreateTrip(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Trip
            </button>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Trip Title"
                value={newTripForm.title}
                onChange={(e) => setNewTripForm(prev => ({ ...prev, title: e.target.value }))}
                className="input w-full"
              />
              <input
                type="text"
                placeholder="Destination"
                value={newTripForm.destination}
                onChange={(e) => setNewTripForm(prev => ({ ...prev, destination: e.target.value }))}
                className="input w-full"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={newTripForm.startDate}
                  onChange={(e) => setNewTripForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="input"
                />
                <input
                  type="date"
                  value={newTripForm.endDate}
                  onChange={(e) => setNewTripForm(prev => ({ ...prev, endDate: e.target.value }))}
                  className="input"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateTrip} className="btn btn-primary">Create Trip</button>
                <button onClick={() => setShowCreateTrip(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Existing Trips */}
        {userTrips.length > 0 && (
          <div className="card-base p-6">
            <h2 className="text-lg font-semibold mb-4">Your Collaborative Trips</h2>
            <div className="space-y-3">
              {userTrips.map(trip => (
                <div 
                  key={trip.id}
                  onClick={() => setActiveTrip(trip)}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{trip.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{trip.destination}</p>
                      <p className="text-xs text-gray-500">
                        {trip.startDate} - {trip.endDate} • {trip.collaborators.length} collaborators
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        trip.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                        trip.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {trip.status}
                      </span>
                      <Users className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{activeTrip.title}</h1>
          <p className="text-gray-600 dark:text-gray-400">{activeTrip.destination} • {activeTrip.startDate} - {activeTrip.endDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleOptimizeTrip}
            disabled={isOptimizing}
            className="btn btn-primary flex items-center gap-2"
          >
            <Zap className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            {isOptimizing ? 'Optimizing...' : 'Optimize Trip'}
          </button>
          <button onClick={() => setActiveTrip(null)} className="btn btn-secondary">Back</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {[
          { key: 'overview', label: 'Overview', icon: <MapPin className="w-4 h-4" /> },
          { key: 'activities', label: 'Activities', icon: <Calendar className="w-4 h-4" /> },
          { key: 'budget', label: 'Budget', icon: <DollarSign className="w-4 h-4" /> },
          { key: 'chat', label: 'Chat', icon: <MessageCircle className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.key 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent hover:text-blue-500'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Collaborators */}
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Collaborators</h3>
              <button 
                onClick={() => setShowInviteModal(true)}
                className="btn btn-sm btn-primary"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {activeTrip.collaborators.map(collaborator => (
                <div key={collaborator.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                    {collaborator.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{collaborator.name}</p>
                    <p className="text-xs text-gray-500">{collaborator.role}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${
                    collaborator.status === 'accepted' ? 'bg-green-500' :
                    collaborator.status === 'invited' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></span>
                </div>
              ))}
            </div>
          </div>

          {/* Trip Status */}
          <div className="card-base p-6">
            <h3 className="font-semibold mb-4">Trip Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Activities</span>
                <span>{activeTrip.activities.filter(a => a.status === 'approved').length} approved</span>
              </div>
              <div className="flex justify-between">
                <span>Budget</span>
                <span>${activeTrip.budget.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activeTrip.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                  activeTrip.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {activeTrip.status}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Updates */}
          <div className="card-base p-6">
            <h3 className="font-semibold mb-4">Recent Updates</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {updates.slice(0, 5).map((update, index) => (
                <div key={index} className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <p className="font-medium">{update.type.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500">{new Date(update.timestamp).toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activities' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Activities</h3>
            <button 
              onClick={() => setShowActivityModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Suggest Activity
            </button>
          </div>

          {/* Optimization Results */}
          {optimizedRoute && (
            <div className="card-base p-6 mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-800 dark:text-green-200">Trip Optimized!</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{optimizedRoute.efficiency}%</p>
                  <p className="text-sm text-gray-600">Efficiency</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">${optimizedRoute.totalCost}</p>
                  <p className="text-sm text-gray-600">Total Cost</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{Math.round(optimizedRoute.totalTime / 60)}h</p>
                  <p className="text-sm text-gray-600">Duration</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{optimizedRoute.totalDistance}km</p>
                  <p className="text-sm text-gray-600">Distance</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{optimizedRoute.insights.timeOptimization}</p>
            </div>
          )}

          <div className="space-y-4">
            {activeTrip.activities.map(activity => {
              const voteStatus = getVoteStatus(activity);
              const userVote = activity.votes.find(v => v.userId === (currentUser?.mongoId || currentUser?.username));
              
              return (
                <div key={activity.id} className="card-base p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold">{activity.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {activity.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {activity.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ${activity.cost}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {voteStatus === 'approved' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {voteStatus === 'rejected' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                      {voteStatus === 'voting' && <Clock className="w-5 h-5 text-yellow-500" />}
                    </div>
                  </div>

                  {/* Voting */}
                  {activity.status === 'proposed' && (
                    <div className="flex items-center gap-2 pt-4 border-t">
                      <span className="text-sm font-medium">Vote:</span>
                      {['yes', 'no', 'maybe'].map(vote => (
                        <button
                          key={vote}
                          onClick={() => handleVoteActivity(activity.id, vote as any)}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            userVote?.vote === vote
                              ? vote === 'yes' ? 'bg-green-500 text-white border-green-500' :
                                vote === 'no' ? 'bg-red-500 text-white border-red-500' :
                                'bg-yellow-500 text-white border-yellow-500'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {vote === 'yes' ? '👍' : vote === 'no' ? '👎' : '🤔'} {vote}
                        </button>
                      ))}
                      <span className="text-xs text-gray-500 ml-2">
                        {activity.votes.length} votes
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Invite Collaborator</h3>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email address"
                value={inviteForm.email}
                onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                className="input w-full"
              />
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as any }))}
                className="input w-full"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <div className="flex gap-2">
                <button onClick={handleInviteCollaborator} className="btn btn-primary flex-1">
                  Send Invite
                </button>
                <button onClick={() => setShowInviteModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showActivityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Suggest Activity</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Activity name"
                value={activityForm.name}
                onChange={(e) => setActivityForm(prev => ({ ...prev, name: e.target.value }))}
                className="input w-full"
              />
              <input
                type="text"
                placeholder="Location"
                value={activityForm.location}
                onChange={(e) => setActivityForm(prev => ({ ...prev, location: e.target.value }))}
                className="input w-full"
              />
              <input
                type="date"
                value={activityForm.date}
                onChange={(e) => setActivityForm(prev => ({ ...prev, date: e.target.value }))}
                className="input w-full"
              />
              <input
                type="number"
                placeholder="Estimated cost ($)"
                value={activityForm.estimatedCost}
                onChange={(e) => setActivityForm(prev => ({ ...prev, estimatedCost: Number(e.target.value) }))}
                className="input w-full"
              />
              <div className="flex gap-2">
                <button onClick={handleSuggestActivity} className="btn btn-primary flex-1">
                  Suggest Activity
                </button>
                <button onClick={() => setShowActivityModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborativeTripPlannerView;