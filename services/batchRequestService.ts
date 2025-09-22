interface BatchRequest {
  id: string;
  type: 'places' | 'itinerary' | 'emergency';
  params: any;
  resolve: (data: any) => void;
  reject: (error: any) => void;
}

class BatchRequestService {
  private pendingRequests: BatchRequest[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 500; // 500ms delay to collect requests

  async addRequest<T>(type: string, params: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: BatchRequest = {
        id: `${type}_${Date.now()}_${Math.random()}`,
        type: type as any,
        params,
        resolve,
        reject
      };

      this.pendingRequests.push(request);
      this.scheduleBatch();
    });
  }

  private scheduleBatch(): void {
    if (this.batchTimeout) return;

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
      this.batchTimeout = null;
    }, this.BATCH_DELAY);
  }

  private async processBatch(): void {
    if (this.pendingRequests.length === 0) return;

    const requests = [...this.pendingRequests];
    this.pendingRequests = [];

    // Group by type and deduplicate
    const grouped = this.groupAndDeduplicate(requests);

    for (const [type, typeRequests] of Object.entries(grouped)) {
      try {
        await this.processBatchByType(type, typeRequests);
      } catch (error) {
        typeRequests.forEach(req => req.reject(error));
      }
    }
  }

  private groupAndDeduplicate(requests: BatchRequest[]): Record<string, BatchRequest[]> {
    const grouped: Record<string, BatchRequest[]> = {};
    const seen = new Set<string>();

    for (const request of requests) {
      const key = `${request.type}_${JSON.stringify(request.params)}`;
      
      if (!grouped[request.type]) {
        grouped[request.type] = [];
      }

      if (!seen.has(key)) {
        grouped[request.type].push(request);
        seen.add(key);
      } else {
        // Duplicate request - resolve with cached result if available
        const existing = grouped[request.type].find(r => 
          JSON.stringify(r.params) === JSON.stringify(request.params)
        );
        if (existing) {
          // Link resolve/reject to existing request
          const originalResolve = existing.resolve;
          existing.resolve = (data) => {
            originalResolve(data);
            request.resolve(data);
          };
        }
      }
    }

    return grouped;
  }

  private async processBatchByType(type: string, requests: BatchRequest[]): void {
    console.log(`🔄 Processing batch of ${requests.length} ${type} requests`);

    // Process each unique request
    for (const request of requests) {
      try {
        let result;
        
        switch (request.type) {
          case 'places':
            result = await this.processPlacesRequest(request.params);
            break;
          case 'itinerary':
            result = await this.processItineraryRequest(request.params);
            break;
          case 'emergency':
            result = await this.processEmergencyRequest(request.params);
            break;
          default:
            throw new Error(`Unknown request type: ${request.type}`);
        }

        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }
  }

  private async processPlacesRequest(params: any): Promise<any> {
    // Implement actual places processing
    return { places: [], cached: true };
  }

  private async processItineraryRequest(params: any): Promise<any> {
    // Implement actual itinerary processing
    return { itinerary: null, cached: true };
  }

  private async processEmergencyRequest(params: any): Promise<any> {
    // Implement actual emergency processing
    return { emergency: [], cached: true };
  }
}

export const batchRequestService = new BatchRequestService();