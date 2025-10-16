import { CurrentUser, ProfileType, UserInterest } from '../types';
import { withApiBase } from './config';

export interface OnboardingData {
  language: string;
  homeCurrency: string;
  selectedInterests: UserInterest[];
  profileType: ProfileType;
  enabledModules: string[];
  hasCompletedWizard: boolean;
  hasCompletedProfileSetup: boolean;
}

class OnboardingService {
  async updateUserOnboarding(userId: string, data: Partial<OnboardingData>): Promise<CurrentUser | null> {
    try {
      const response = await fetch(withApiBase(`/api/users/${userId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update user onboarding: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user onboarding:', error);
      return null;
    }
  }

  async completeOnboarding(userId: string, onboardingData: OnboardingData): Promise<CurrentUser | null> {
    return this.updateUserOnboarding(userId, {
      ...onboardingData,
      hasCompletedWizard: true,
      hasCompletedProfileSetup: true,
    });
  }

  async completeWizard(userId: string, wizardData: {
    language: string;
    homeCurrency: string;
    selectedInterests: UserInterest[];
  }): Promise<CurrentUser | null> {
    return this.updateUserOnboarding(userId, {
      ...wizardData,
      hasCompletedWizard: true,
    });
  }

  async completeProfileSetup(userId: string, profileData: {
    profileType: ProfileType;
    enabledModules: string[];
  }): Promise<CurrentUser | null> {
    return this.updateUserOnboarding(userId, {
      ...profileData,
      hasCompletedProfileSetup: true,
    });
  }

  getOnboardingProgress(user: CurrentUser): {
    completionPercentage: number;
    nextStep: 'wizard' | 'profile' | 'complete';
    isComplete: boolean;
  } {
    const hasCompletedWizard = user.hasCompletedWizard ?? false;
    const hasCompletedProfileSetup = user.hasCompletedProfileSetup ?? false;

    let completionPercentage = 0;
    if (hasCompletedWizard) completionPercentage += 50;
    if (hasCompletedProfileSetup) completionPercentage += 50;

    let nextStep: 'wizard' | 'profile' | 'complete' = 'wizard';
    if (hasCompletedWizard && !hasCompletedProfileSetup) {
      nextStep = 'profile';
    } else if (hasCompletedWizard && hasCompletedProfileSetup) {
      nextStep = 'complete';
    }

    return {
      completionPercentage,
      nextStep,
      isComplete: completionPercentage === 100,
    };
  }

  shouldShowOnboarding(user: CurrentUser): boolean {
    const progress = this.getOnboardingProgress(user);
    return !progress.isComplete;
  }
}

export const onboardingService = new OnboardingService();