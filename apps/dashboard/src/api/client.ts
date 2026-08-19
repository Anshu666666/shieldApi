import {
  ApiService,
  ApiKeyRecord,
  BlockedIpRecord,
  AnomalyAlert,
  TrafficLogEntry,
  GatewayMetrics,
  TimeSeriesPoint,
  TimeRangeFilter
} from './types';
import {
  initialServices,
  initialApiKeys,
  initialBlockedIps,
  initialAnomalies,
  generateInitialLogs,
  generateTimeSeriesData,
  initialMetrics
} from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ShieldApiClient {
  private baseUrl: string;
  private isLiveBackendAvailable: boolean = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Health check to determine if real FastAPI gateway is reachable
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { method: 'GET', credentials: 'omit' });
      this.isLiveBackendAvailable = res.ok;
      return res.ok;
    } catch {
      this.isLiveBackendAvailable = false;
      return false;
    }
  }

  // Fetch Gateway Metrics
  async getMetrics(): Promise<GatewayMetrics> {
    if (this.isLiveBackendAvailable) {
      try {
        const res = await fetch(`${this.baseUrl}/admin/metrics`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend metrics fetch failed, using state telemetry:', err);
      }
    }
    return initialMetrics;
  }

  // Fetch Services
  async getServices(): Promise<ApiService[]> {
    if (this.isLiveBackendAvailable) {
      try {
        const res = await fetch(`${this.baseUrl}/admin/services`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend services fetch failed:', err);
      }
    }
    return initialServices;
  }

  // Fetch API Keys
  async getApiKeys(): Promise<ApiKeyRecord[]> {
    if (this.isLiveBackendAvailable) {
      try {
        const res = await fetch(`${this.baseUrl}/admin/keys`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend API keys fetch failed:', err);
      }
    }
    return initialApiKeys;
  }

  // Generate API Key
  async createApiKey(name: string, owner: string, tier: string, allowedServices: string[]): Promise<ApiKeyRecord> {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const fullKey = `sh_live_${randomHex}`;
    const masked = `sh_live_••••••••••••${randomHex.slice(-4)}`;

    const newRecord: ApiKeyRecord = {
      id: `key-${Date.now()}`,
      key: fullKey,
      maskedKey: masked,
      name,
      owner,
      tier: tier as any,
      status: 'ACTIVE',
      rateLimitRpm: tier === 'ENTERPRISE' ? 5000 : tier === 'STANDARD' ? 1200 : 300,
      createdAt: new Date().toISOString(),
      lastUsedAt: 'Never',
      totalRequests: 0,
      allowedServices
    };

    if (this.isLiveBackendAvailable) {
      try {
        await fetch(`${this.baseUrl}/admin/keys`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: fullKey, metadata: JSON.stringify(newRecord) })
        });
      } catch (err) {
        console.warn('Failed to persist key to backend:', err);
      }
    }

    return newRecord;
  }

  // Revoke API Key
  async revokeApiKey(keyId: string, fullKey?: string): Promise<boolean> {
    if (this.isLiveBackendAvailable && fullKey) {
      try {
        await fetch(`${this.baseUrl}/admin/keys/${encodeURIComponent(fullKey)}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.warn('Failed to delete key from backend:', err);
      }
    }
    return true;
  }

  // Fetch Blocked IPs
  async getBlockedIps(): Promise<BlockedIpRecord[]> {
    if (this.isLiveBackendAvailable) {
      try {
        const res = await fetch(`${this.baseUrl}/admin/blocked-ips`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend blocked IPs fetch failed:', err);
      }
    }
    return initialBlockedIps;
  }

  // Unblock IP (calls RedisManager.unblock_ip)
  async unblockIp(ip: string): Promise<boolean> {
    if (this.isLiveBackendAvailable) {
      try {
        await fetch(`${this.baseUrl}/admin/blocked-ips/${encodeURIComponent(ip)}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.warn('Failed to unblock IP on backend:', err);
      }
    }
    return true;
  }

  // Block IP (calls RedisManager.block_ip with TTL)
  async blockIp(ip: string, reason: string, ttlSeconds: number = 86400): Promise<BlockedIpRecord> {
    const record: BlockedIpRecord = {
      ip,
      reason,
      blockedAt: new Date().toISOString(),
      ttlSeconds,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      errorCount: 1,
      attackType: 'PROBING'
    };

    if (this.isLiveBackendAvailable) {
      try {
        await fetch(`${this.baseUrl}/admin/blocked-ips`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ip, ttl_seconds: ttlSeconds, reason })
        });
      } catch (err) {
        console.warn('Failed to block IP on backend:', err);
      }
    }

    return record;
  }

  // Fetch Anomalies
  async getAnomalies(): Promise<AnomalyAlert[]> {
    return initialAnomalies;
  }

  // Fetch Initial Logs
  async getLogs(): Promise<TrafficLogEntry[]> {
    return generateInitialLogs();
  }

  // Fetch Time Series Data for Chart
  async getTimeSeries(range: TimeRangeFilter): Promise<TimeSeriesPoint[]> {
    return generateTimeSeriesData(range);
  }
}

export const apiClient = new ShieldApiClient(BASE_URL);
