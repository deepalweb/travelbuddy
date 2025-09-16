import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../services/subscriptionService.ts';
import { SubscriptionTier } from '../types.ts';
import { Colors } from '../constants.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { TrendingUp, Users, DollarSign, Clock } from './Icons.tsx';

interface SubscriptionAnalyticsProps {
  onClose: () => void;
}

interface AnalyticsData {
  totalUsers: number;
  tierDistribution: Record<SubscriptionTier, number>;
  trialConversionRate: number;
  churnRate: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  activeTrials: number;
  recentSubscriptions: Array<{
    id: string;
    userEmail: string;
    tier: SubscriptionTier;
    status: string;
    createdAt: string;
  }>;
}

const SubscriptionAnalytics: React.FC<SubscriptionAnalyticsProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'users' | 'trials'>('revenue');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        // Mock data - in real implementation, this would come from the backend
        const baseAnalytics = subscriptionService.getSubscriptionAnalytics();
        
        const enhancedAnalytics: AnalyticsData = {
          ...baseAnalytics,
          monthlyRecurringRevenue: 8420.50,
          averageRevenuePerUser: 3.45,
          activeTrials: 125,
          recentSubscriptions: [
            {
              id: '1',
              userEmail: 'user1@example.com',
              tier: 'premium',
              status: 'active',
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            },
            {
              id: '2',
              userEmail: 'user2@example.com',
              tier: 'basic',
              status: 'trial',
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
            },
            {
              id: '3',
              userEmail: 'user3@example.com',
              tier: 'pro',
              status: 'active',
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
            },
          ],
        };
        
        setAnalytics(enhancedAnalytics);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const renderMetricCard = (
    title: string,
    value: string | number,
    subtitle: string,
    icon: React.ReactNode,
    trend?: { value: number; isPositive: boolean }
  ) => (
    <div className="p-6 rounded-lg" style={{ backgroundColor: Colors.cardBackground, boxShadow: Colors.boxShadow }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: Colors.text_secondary }}>
            {title}
          </p>
          <p className="text-2xl font-bold mt-2" style={{ color: Colors.text }}>
            {value}
          </p>
          <p className="text-sm mt-1" style={{ color: Colors.text_secondary }}>
            {subtitle}
          </p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <span>{trend.isPositive ? '↗' : '↘'}</span>
              <span className="ml-1">{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: Colors.primary + '20' }}>
          {icon}
        </div>
      </div>
    </div>
  );

  const renderTierDistributionChart = () => {
    if (!analytics) return null;

    const total = analytics.totalUsers;
    const tierColors = {
      free: '#94a3b8',
      basic: '#3b82f6',
      premium: '#8b5cf6',
      pro: '#f59e0b',
    };

    return (
      <div className="p-6 rounded-lg" style={{ backgroundColor: Colors.cardBackground, boxShadow: Colors.boxShadow }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: Colors.text }}>
          User Distribution by Tier
        </h3>
        
        <div className="space-y-4">
          {Object.entries(analytics.tierDistribution).map(([tier, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            
            return (
              <div key={tier}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium capitalize" style={{ color: Colors.text }}>
                    {tier}
                  </span>
                  <span style={{ color: Colors.text_secondary }}>
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: tierColors[tier as SubscriptionTier],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderRecentActivity = () => {
    if (!analytics?.recentSubscriptions) return null;

    return (
      <div className="p-6 rounded-lg" style={{ backgroundColor: Colors.cardBackground, boxShadow: Colors.boxShadow }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: Colors.text }}>
          Recent Subscription Activity
        </h3>
        
        <div className="space-y-3">
          {analytics.recentSubscriptions.map((sub) => {
            const timeAgo = new Date(sub.createdAt).toLocaleString();
            const statusColors = {
              active: 'text-green-600',
              trial: 'text-blue-600',
              expired: 'text-red-600',
              canceled: 'text-gray-600',
            };

            return (
              <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: Colors.inputBackground }}>
                <div>
                  <p className="font-medium" style={{ color: Colors.text }}>
                    {sub.userEmail}
                  </p>
                  <p className="text-sm" style={{ color: Colors.text_secondary }}>
                    {timeAgo}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium capitalize" style={{ color: Colors.text }}>
                    {sub.tier}
                  </p>
                  <p className={`text-sm ${statusColors[sub.status as keyof typeof statusColors] || 'text-gray-600'}`}>
                    {sub.status}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p style={{ color: Colors.text }}>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load analytics</p>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold" style={{ color: Colors.text }}>
              Subscription Analytics Dashboard
            </h2>
            <button
              className="text-gray-500 hover:text-gray-700 text-2xl"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {renderMetricCard(
              'Total Users',
              analytics.totalUsers.toLocaleString(),
              'Active platform users',
              <Users className="w-6 h-6" style={{ color: Colors.primary }} />,
              { value: 12.5, isPositive: true }
            )}
            
            {renderMetricCard(
              'Monthly Recurring Revenue',
              `$${analytics.monthlyRecurringRevenue.toLocaleString()}`,
              'This month',
              <DollarSign className="w-6 h-6" style={{ color: Colors.primary }} />,
              { value: 8.3, isPositive: true }
            )}
            
            {renderMetricCard(
              'Trial Conversion Rate',
              `${analytics.trialConversionRate}%`,
              'Trial to paid conversion',
              <TrendingUp className="w-6 h-6" style={{ color: Colors.primary }} />,
              { value: 2.1, isPositive: true }
            )}
            
            {renderMetricCard(
              'Active Trials',
              analytics.activeTrials.toLocaleString(),
              'Users in trial period',
              <Clock className="w-6 h-6" style={{ color: Colors.primary }} />,
              { value: 15.7, isPositive: true }
            )}
          </div>

          {/* Charts and Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {renderTierDistributionChart()}
            {renderRecentActivity()}
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderMetricCard(
              'Average Revenue Per User',
              `$${analytics.averageRevenuePerUser}`,
              'Per month',
              <DollarSign className="w-6 h-6" style={{ color: Colors.primary }} />
            )}
            
            {renderMetricCard(
              'Churn Rate',
              `${analytics.churnRate}%`,
              'Monthly churn rate',
              <TrendingUp className="w-6 h-6" style={{ color: Colors.accentError }} />,
              { value: 1.2, isPositive: false }
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-lg">
          <div className="flex justify-between items-center">
            <p className="text-sm" style={{ color: Colors.text_secondary }}>
              Last updated: {new Date().toLocaleString()}
            </p>
            <button
              className="px-6 py-2 rounded-lg font-medium transition-all duration-200"
              style={{
                backgroundColor: Colors.primary,
                color: 'white',
              }}
              onClick={onClose}
            >
              Close Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionAnalytics;
