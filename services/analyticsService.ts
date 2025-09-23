interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  timestamp: number;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private isEnabled = true;

  track(event: string, category: string, action: string, label?: string, value?: number, userId?: string) {
    if (!this.isEnabled) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      category,
      action,
      label,
      value,
      userId,
      timestamp: Date.now()
    };

    this.events.push(analyticsEvent);
    this.sendToBackend(analyticsEvent);
    
    console.log('Analytics:', analyticsEvent);
  }

  // Travel-specific tracking methods
  trackPlaceView(placeId: string, placeName: string, userId?: string) {
    this.track('place_view', 'places', 'view', `${placeId}:${placeName}`, undefined, userId);
  }

  trackSearch(query: string, category: string, resultsCount: number, userId?: string) {
    this.track('search', 'discovery', 'search', query, resultsCount, userId);
  }

  trackTripPlanGeneration(destination: string, duration: string, userId?: string) {
    this.track('trip_plan', 'planning', 'generate', `${destination}:${duration}`, undefined, userId);
  }

  trackFavoriteToggle(placeId: string, action: 'add' | 'remove', userId?: string) {
    this.track('favorite', 'engagement', action, placeId, undefined, userId);
  }

  trackSubscription(tier: string, action: 'start_trial' | 'subscribe' | 'cancel', userId?: string) {
    this.track('subscription', 'monetization', action, tier, undefined, userId);
  }

  trackFeatureUsage(feature: string, userId?: string) {
    this.track('feature_usage', 'engagement', 'use', feature, undefined, userId);
  }

  trackError(error: string, context: string, userId?: string) {
    this.track('error', 'system', 'error', `${context}:${error}`, undefined, userId);
  }

  trackPerformance(metric: string, value: number, context: string) {
    this.track('performance', 'system', metric, context, value);
  }

  private async sendToBackend(event: AnalyticsEvent) {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
    }
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  clearEvents() {
    this.events = [];
  }

  disable() {
    this.isEnabled = false;
  }

  enable() {
    this.isEnabled = true;
  }

  // Get analytics summary
  getSummary() {
    const summary = {
      totalEvents: this.events.length,
      categories: {} as Record<string, number>,
      actions: {} as Record<string, number>,
      recentEvents: this.events.slice(-10)
    };

    this.events.forEach(event => {
      summary.categories[event.category] = (summary.categories[event.category] || 0) + 1;
      summary.actions[event.action] = (summary.actions[event.action] || 0) + 1;
    });

    return summary;
  }
}

export const analyticsService = new AnalyticsService();