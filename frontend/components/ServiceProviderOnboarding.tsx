import React, { useState } from 'react';
import { CurrentUser } from '../types';

interface ServiceProviderOnboardingProps {
  user: CurrentUser;
  onComplete: (step: string) => void;
  onOpenServiceModal?: () => void;
}

const ServiceProviderOnboarding: React.FC<ServiceProviderOnboardingProps> = ({ user, onComplete, onOpenServiceModal }) => {
  const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
    const saved = localStorage.getItem(`onboarding_${user.mongoId || 'temp'}`);
    return saved ? JSON.parse(saved) : [];
  });

  const steps = [
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add your photo and service description',
      icon: '👤',
      completed: !!user.profilePicture
    },
    {
      id: 'service',
      title: 'Create Your First Service',
      description: 'List what you offer to travelers',
      icon: '🎯',
      completed: completedSteps.includes('service')
    },
    {
      id: 'verification',
      title: 'Get Verified',
      description: 'Build trust with identity verification',
      icon: '✅',
      completed: completedSteps.includes('verification')
    },
    {
      id: 'pricing',
      title: 'Set Your Rates',
      description: 'Configure competitive pricing',
      icon: '💰',
      completed: completedSteps.includes('pricing')
    }
  ];

  const handleStepClick = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      const newCompleted = [...completedSteps, stepId];
      setCompletedSteps(newCompleted);
      localStorage.setItem(`onboarding_${user.mongoId || 'temp'}`, JSON.stringify(newCompleted));
      onComplete(stepId);
      
      if (stepId === 'service' && onOpenServiceModal) {
        onOpenServiceModal();
      }
    }
  };

  const completionPercentage = Math.round((completedSteps.length / steps.length) * 100);

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Service Provider Setup</h3>
        <span className="text-sm text-gray-600">{completionPercentage}% Complete</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div 
          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
              step.completed || completedSteps.includes(step.id)
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
            onClick={() => handleStepClick(step.id)}
          >
            <div className="text-2xl mr-4">{step.icon}</div>
            <div className="flex-1">
              <h4 className="font-medium">{step.title}</h4>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>
            <div className="ml-4">
              {(step.completed || completedSteps.includes(step.id)) ? (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              ) : (
                <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {completionPercentage === 100 && (
        <div className="mt-6 p-4 bg-green-100 rounded-lg text-center">
          <div className="text-2xl mb-2">🎉</div>
          <h4 className="font-semibold text-green-800">Setup Complete!</h4>
          <p className="text-sm text-green-700">You're ready to start receiving bookings</p>
        </div>
      )}
    </div>
  );
};

export default ServiceProviderOnboarding;