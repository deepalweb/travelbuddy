import React, { useState, useEffect } from 'react';
import { Place, CurrentUser } from '../types';
import { 
  Zap, Route, DollarSign, Clock, Users, Accessibility, 
  Cloud, TrendingUp, Settings, Download, Share2, 
  BarChart3, Target, Lightbulb, AlertTriangle
} from './Icons';
import { 
  advancedOptimizationService, 
  OptimizationRequest, 
  OptimizedRoute, 
  BudgetOptimization 
} from '../services/advancedOptimizationService';
import { performanceOptimizationService } from '../services/performanceOptimizationService';

interface AdvancedOptimizationPanelProps {
  places: Place[];
  userLocation: { latitude: number; longitude: number } | null;
  currentUser: CurrentUser | null;
  onOptimizedRouteSelect: (route: OptimizedRoute) => void;
  onClose: () => void;
}

const AdvancedOptimizationPanel: React.FC<AdvancedOptimizationPanelProps> = ({
  places,
  userLocation,
  currentUser,
  onOptimizedRouteSelect,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'route' | 'budget' | 'accessibility' | 'performance'>('route');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [budgetOptimization, setBudgetOptimization] = useState<BudgetOptimization | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  
  // Optimization preferences
  const [preferences, setPreferences] = useState({
    budget: 200,
    timeAvailable: 8,
    transportMode: 'mixed' as 'walking' | 'driving' | 'public_transport' | 'mixed',
    groupSize: 1,
    accessibility: false,
    interests: [] as string[],
    prioritizeTime: true,
    prioritizeCost: false,
    prioritizeExperience: true
  });

  const [constraints, setConstraints] = useState({
    startTime: '09:00',
    endTime: '18:00',
    mustVisit: [] as string[],
    avoid: [] as string[]
  });

  const [accessibilityNeeds, setAccessibilityNeeds] = useState<string[]>([]);
  const [weatherCondition, setWeatherCondition] = useState('sunny');

  useEffect(() => {
    // Load performance metrics
    const metrics = performanceOptimizationService.getPerformanceReport();
    setPerformanceMetrics(metrics);
  }, []);

  const handleRouteOptimization = async () => {
    if (!userLocation || places.length === 0) return;

    setIsOptimizing(true);
    try {
      const request: OptimizationRequest = {
        places,
        userLocation,
        preferences: {
          ...preferences,
          interests: currentUser?.selectedInterests || []
        },
        constraints
      };

      const result = await advancedOptimizationService.optimizeRoute(request);
      setOptimizedRoute(result);
      onOptimizedRouteSelect(result);
    } catch (error) {
      console.error('Route optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleBudgetOptimization = async () => {
    if (places.length === 0) return;

    setIsOptimizing(true);
    try {
      const result = await advancedOptimizationService.optimizeBudget(
        places,
        preferences.budget,
        currentUser?.homeCurrency || 'USD'
      );
      setBudgetOptimization(result);
    } catch (error) {
      console.error('Budget optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAccessibilityOptimization = async () => {
    if (places.length === 0 || accessibilityNeeds.length === 0) return;

    setIsOptimizing(true);
    try {
      const result = await advancedOptimizationService.optimizeForAccessibility(
        places,
        accessibilityNeeds
      );
      console.log('Accessibility optimization:', result);
    } catch (error) {
      console.error('Accessibility optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleWeatherOptimization = async () => {
    if (places.length === 0) return;

    setIsOptimizing(true);
    try {
      const result = await advancedOptimizationService.optimizeForWeather(
        places,
        weatherCondition,
        new Date().toISOString().split('T')[0]
      );
      console.log('Weather optimization:', result);
    } catch (error) {
      console.error('Weather optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const exportOptimization = () => {
    if (!optimizedRoute) return;

    const data = {
      route: optimizedRoute,
      preferences,
      constraints,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized-route.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareOptimization = async () => {
    if (!optimizedRoute) return;

    const shareData = {
      title: 'Optimized Travel Route',
      text: `Check out this optimized route with ${optimizedRoute.efficiency}% efficiency!`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold">Advanced Optimization</h2>
          </div>
          <div className="flex items-center gap-2">
            {optimizedRoute && (
              <>
                <button onClick={exportOptimization} className="btn btn-secondary btn-sm">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={shareOptimization} className="btn btn-secondary btn-sm">
                  <Share2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button onClick={onClose} className="btn btn-secondary">Close</button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Sidebar */}
          <div className="w-80 border-r p-6 overflow-y-auto">
            {/* Tabs */}
            <div className="space-y-2 mb-6">
              {[
                { key: 'route', label: 'Route Optimization', icon: <Route className="w-4 h-4" /> },
                { key: 'budget', label: 'Budget Optimization', icon: <DollarSign className="w-4 h-4" /> },
                { key: 'accessibility', label: 'Accessibility', icon: <Accessibility className="w-4 h-4" /> },
                { key: 'performance', label: 'Performance', icon: <BarChart3 className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.key 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Preferences */}
            {activeTab === 'route' && (
              <div className="space-y-4">
                <h3 className="font-semibold">Preferences</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Budget ($)</label>
                  <input
                    type="number"
                    value={preferences.budget}
                    onChange={(e) => setPreferences(prev => ({ ...prev, budget: Number(e.target.value) }))}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Time Available (hours)</label>
                  <input
                    type="number"
                    value={preferences.timeAvailable}
                    onChange={(e) => setPreferences(prev => ({ ...prev, timeAvailable: Number(e.target.value) }))}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Transport Mode</label>
                  <select
                    value={preferences.transportMode}
                    onChange={(e) => setPreferences(prev => ({ ...prev, transportMode: e.target.value as any }))}
                    className="input w-full"
                  >
                    <option value="walking">Walking</option>
                    <option value="driving">Driving</option>
                    <option value="public_transport">Public Transport</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Group Size</label>
                  <input
                    type="number"
                    min="1"
                    value={preferences.groupSize}
                    onChange={(e) => setPreferences(prev => ({ ...prev, groupSize: Number(e.target.value) }))}
                    className="input w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">Priorities</label>
                  {[
                    { key: 'prioritizeTime', label: 'Minimize Time' },
                    { key: 'prioritizeCost', label: 'Minimize Cost' },
                    { key: 'prioritizeExperience', label: 'Maximize Experience' }
                  ].map(priority => (
                    <label key={priority.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={preferences[priority.key as keyof typeof preferences] as boolean}
                        onChange={(e) => setPreferences(prev => ({ 
                          ...prev, 
                          [priority.key]: e.target.checked 
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm">{priority.label}</span>
                    </label>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">Time Constraints</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Start Time</label>
                      <input
                        type="time"
                        value={constraints.startTime}
                        onChange={(e) => setConstraints(prev => ({ ...prev, startTime: e.target.value }))}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">End Time</label>
                      <input
                        type="time"
                        value={constraints.endTime}
                        onChange={(e) => setConstraints(prev => ({ ...prev, endTime: e.target.value }))}
                        className="input w-full"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleRouteOptimization}
                  disabled={isOptimizing || !userLocation}
                  className="btn btn-primary w-full"
                >
                  {isOptimizing ? (
                    <>
                      <Zap className="w-4 h-4 animate-spin mr-2" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Optimize Route
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'budget' && (
              <div className="space-y-4">
                <h3 className="font-semibold">Budget Optimization</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Target Budget ($)</label>
                  <input
                    type="number"
                    value={preferences.budget}
                    onChange={(e) => setPreferences(prev => ({ ...prev, budget: Number(e.target.value) }))}
                    className="input w-full"
                  />
                </div>

                <button 
                  onClick={handleBudgetOptimization}
                  disabled={isOptimizing}
                  className="btn btn-primary w-full"
                >
                  {isOptimizing ? (
                    <>
                      <DollarSign className="w-4 h-4 animate-spin mr-2" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Optimize Budget
                    </>
                  )}
                </button>

                {budgetOptimization && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                      Potential Savings: ${budgetOptimization.savings}
                    </h4>
                    <div className="space-y-2">
                      {budgetOptimization.recommendations.slice(0, 3).map((rec, index) => (
                        <div key={index} className="text-sm">
                          <p className="font-medium">{rec.description}</p>
                          <p className="text-green-600 dark:text-green-400">Save ${rec.savings}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'accessibility' && (
              <div className="space-y-4">
                <h3 className="font-semibold">Accessibility Options</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Accessibility Needs</label>
                  <div className="space-y-2">
                    {[
                      'Wheelchair accessible',
                      'Visual impairment support',
                      'Hearing impairment support',
                      'Mobility assistance',
                      'Cognitive accessibility'
                    ].map(need => (
                      <label key={need} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={accessibilityNeeds.includes(need)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAccessibilityNeeds(prev => [...prev, need]);
                            } else {
                              setAccessibilityNeeds(prev => prev.filter(n => n !== need));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{need}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleAccessibilityOptimization}
                  disabled={isOptimizing || accessibilityNeeds.length === 0}
                  className="btn btn-primary w-full"
                >
                  <Accessibility className="w-4 h-4 mr-2" />
                  Check Accessibility
                </button>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-4">
                <h3 className="font-semibold">Performance Metrics</h3>
                
                {performanceMetrics && (
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <p className="text-sm font-medium">Cache Hit Rate</p>
                      <p className="text-lg font-bold text-green-600">
                        {(performanceMetrics.cacheStats.hitRate * 100).toFixed(1)}%
                      </p>
                    </div>
                    
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <p className="text-sm font-medium">Memory Usage</p>
                      <p className="text-lg font-bold text-blue-600">
                        {performanceMetrics.cacheStats.memoryUsage}
                      </p>
                    </div>
                    
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <p className="text-sm font-medium">Cache Size</p>
                      <p className="text-lg font-bold">
                        {performanceMetrics.cacheStats.size} items
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-medium">Recommendations</h4>
                  {performanceMetrics?.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {optimizedRoute && activeTab === 'route' && (
              <div className="space-y-6">
                {/* Optimization Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{optimizedRoute.efficiency}%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Efficiency</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">${optimizedRoute.totalCost}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{Math.round(optimizedRoute.totalTime / 60)}h</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{optimizedRoute.totalDistance}km</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Distance</p>
                  </div>
                </div>

                {/* Route Timeline */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Optimized Route</h3>
                  <div className="space-y-3">
                    {optimizedRoute.route.map((stop, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{stop.place.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{stop.reasoning}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {stop.arrivalTime} - {stop.departureTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${stop.cost}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Priority: {stop.priority}/10
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insights */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Optimization Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Best Time to Start</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {optimizedRoute.insights.bestTimeToStart}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Time Optimization</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {optimizedRoute.insights.timeOptimization}
                      </p>
                    </div>
                  </div>
                  
                  {optimizedRoute.insights.weatherConsiderations.length > 0 && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Cloud className="w-4 h-4 text-yellow-600" />
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Weather Considerations</h4>
                      </div>
                      <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                        {optimizedRoute.insights.weatherConsiderations.map((consideration, index) => (
                          <li key={index}>• {consideration}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!optimizedRoute && activeTab === 'route' && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Route className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Route Optimized Yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Configure your preferences and click "Optimize Route" to get started.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'budget' && !budgetOptimization && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Budget Optimization</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Set your target budget and get personalized money-saving recommendations.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedOptimizationPanel;