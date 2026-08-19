import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ApiService,
  ApiKeyRecord,
  BlockedIpRecord,
  AnomalyAlert,
  TrafficLogEntry,
  GatewayMetrics,
  TimeSeriesPoint,
  TimeRangeFilter,
  SimulatorConfig,
  HttpMethod,
  TrafficAction
} from '../api/types';
import { apiClient } from '../api/client';
import {
  initialServices,
  initialApiKeys,
  initialBlockedIps,
  initialAnomalies,
  generateInitialLogs,
  generateTimeSeriesData,
  initialMetrics
} from '../api/mockData';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface TokenBucketState {
  capacity: number;
  tokens: number;
  refillRate: number; // tokens per second
  lastUpdated: number;
}

interface TelemetryContextType {
  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Telemetry & Metrics
  metrics: GatewayMetrics;
  timeSeries: TimeSeriesPoint[];
  timeRange: TimeRangeFilter;
  setTimeRange: (range: TimeRangeFilter) => void;

  // Services
  services: ApiService[];
  addService: (service: Omit<ApiService, 'id' | 'createdAt'>) => void;
  updateService: (id: string, updates: Partial<ApiService>) => void;
  deleteService: (id: string) => void;
  toggleServiceStatus: (id: string) => void;

  // API Keys
  apiKeys: ApiKeyRecord[];
  createApiKey: (name: string, owner: string, tier: string, allowedServices: string[]) => Promise<ApiKeyRecord>;
  revokeApiKey: (id: string) => Promise<void>;
  rotateApiKey: (id: string) => Promise<ApiKeyRecord>;

  // Blocked IPs & Anomaly Guardian
  blockedIps: BlockedIpRecord[];
  anomalies: AnomalyAlert[];
  unblockIp: (ip: string) => Promise<void>;
  manuallyBlockIp: (ip: string, reason: string, ttlSeconds: number) => Promise<void>;
  resolveAnomaly: (id: string) => void;

  // Logs
  logs: TrafficLogEntry[];
  isStreamingLogs: boolean;
  setIsStreamingLogs: (streaming: boolean) => void;
  clearLogs: () => void;
  selectedLog: TrafficLogEntry | null;
  setSelectedLog: (log: TrafficLogEntry | null) => void;

  // Selected Anomaly for Drawer
  selectedAnomaly: AnomalyAlert | null;
  setSelectedAnomaly: (anomaly: AnomalyAlert | null) => void;

  // Simulator
  simulator: SimulatorConfig;
  setSimulatorRps: (rps: number) => void;
  toggleSimulator: () => void;
  triggerAttackBurst: () => void;
  triggerRateLimitStorm: () => void;
  triggerNormalSpike: () => void;

  // Token Bucket Playground
  tokenBucket: TokenBucketState;
  consumeToken: (count?: number) => { allowed: boolean; remaining: number };
  updateTokenBucketConfig: (capacity: number, refillRate: number) => void;

  // Toasts
  toasts: ToastNotification[];
  addToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Modals
  isCreateKeyModalOpen: boolean;
  setIsCreateKeyModalOpen: (open: boolean) => void;
  isAddServiceModalOpen: boolean;
  setIsAddServiceModalOpen: (open: boolean) => void;
  isBlockIpModalOpen: boolean;
  setIsBlockIpModalOpen: (open: boolean) => void;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');

  const [metrics, setMetrics] = useState<GatewayMetrics>(initialMetrics);
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('15m');
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>(() => generateTimeSeriesData('15m'));

  const [services, setServices] = useState<ApiService[]>(initialServices);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>(initialApiKeys);
  const [blockedIps, setBlockedIps] = useState<BlockedIpRecord[]>(initialBlockedIps);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>(initialAnomalies);
  const [logs, setLogs] = useState<TrafficLogEntry[]>(() => generateInitialLogs());
  const [isStreamingLogs, setIsStreamingLogs] = useState<boolean>(true);

  const [selectedLog, setSelectedLog] = useState<TrafficLogEntry | null>(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyAlert | null>(null);

  // Modals
  const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isBlockIpModalOpen, setIsBlockIpModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Token Bucket Simulator
  const [tokenBucket, setTokenBucket] = useState<TokenBucketState>({
    capacity: 10,
    tokens: 10,
    refillRate: 2.0,
    lastUpdated: Date.now()
  });

  // Simulator config
  const [simulator, setSimulator] = useState<SimulatorConfig>({
    isRunning: true,
    trafficMode: 'NORMAL',
    rps: 35,
    attackingIp: '198.51.100.42'
  });

  // Range change
  useEffect(() => {
    setTimeSeries(generateTimeSeriesData(timeRange));
  }, [timeRange]);

  // Token bucket refill interval
  useEffect(() => {
    const interval = setInterval(() => {
      setTokenBucket(prev => {
        const now = Date.now();
        const deltaSec = (now - prev.lastUpdated) / 1000;
        const newTokens = Math.min(prev.capacity, prev.tokens + deltaSec * prev.refillRate);
        return {
          ...prev,
          tokens: Number(newTokens.toFixed(2)),
          lastUpdated: now
        };
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const consumeToken = (count: number = 1) => {
    let allowed = false;
    let remaining = 0;
    setTokenBucket(prev => {
      if (prev.tokens >= count) {
        allowed = true;
        remaining = Number((prev.tokens - count).toFixed(2));
        return { ...prev, tokens: remaining, lastUpdated: Date.now() };
      } else {
        allowed = false;
        remaining = prev.tokens;
        return prev;
      }
    });
    return { allowed, remaining };
  };

  const updateTokenBucketConfig = (capacity: number, refillRate: number) => {
    setTokenBucket({
      capacity,
      tokens: capacity,
      refillRate,
      lastUpdated: Date.now()
    });
    addToast('info', 'Token Bucket Updated', `Capacity set to ${capacity}, refill rate: ${refillRate}/sec`);
  };

  // Live traffic generator and log streamer
  useEffect(() => {
    if (!simulator.isRunning) return;

    const interval = setInterval(() => {
      if (!isStreamingLogs) return;

      const randomService = services[Math.floor(Math.random() * services.length)] || services[0];
      const nowStr = new Date().toTimeString().split(' ')[0];
      const randomIp = simulator.trafficMode === 'BURST_ATTACK'
        ? simulator.attackingIp
        : `192.168.1.${Math.floor(Math.random() * 200) + 10}`;

      let status = 200;
      let action: TrafficAction = 'ALLOWED';
      let latency = Math.floor(Math.random() * 28) + 12;

      // Check if IP is currently blocked
      const isBlocked = blockedIps.some(b => b.ip === randomIp);
      if (isBlocked) {
        status = 403;
        action = 'BLOCKED_IP';
        latency = 2;
      } else if (simulator.trafficMode === 'BURST_ATTACK') {
        // Attack mode: 404 / 500 error flood
        status = Math.random() > 0.3 ? 404 : 500;
        action = 'ERROR';
        latency = 4;
      } else if (simulator.trafficMode === 'RATE_LIMIT_STORM') {
        status = 429;
        action = 'RATE_LIMITED';
        latency = 3;
      } else {
        // Normal mode occasional 429 or 200
        const rand = Math.random();
        if (rand > 0.96) {
          status = 429;
          action = 'RATE_LIMITED';
          latency = 3;
        } else if (rand > 0.94) {
          status = 401;
          action = 'INVALID_KEY';
          latency = 4;
        }
      }

      const newLog: TrafficLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: nowStr,
        clientIp: randomIp,
        method: (['GET', 'POST', 'PUT'] as HttpMethod[])[Math.floor(Math.random() * 3)],
        path: randomService ? randomService.endpoint : '/api/v1/target',
        statusCode: status,
        latencyMs: latency,
        apiKeyName: action === 'INVALID_KEY' ? undefined : 'sh_live_••••••••8e7d',
        serviceName: randomService ? randomService.name : 'Target Service',
        action,
        userAgent: 'Mozilla/5.0 (ShieldAPI-Proxy/1.0)',
        tokensRemaining: action === 'RATE_LIMITED' ? 0 : Math.floor(Math.random() * 9) + 1,
        responseSizeBytes: status === 200 ? Math.floor(Math.random() * 2100) + 300 : 124
      };

      setLogs(prev => [newLog, ...prev.slice(0, 79)]);

      // Update KPIs dynamically
      setMetrics(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + 1,
        requestsPerMinute: Math.min(4800, prev.requestsPerMinute + (simulator.trafficMode === 'BURST_ATTACK' ? 12 : 1)),
        blockedRateLimitCount: status === 429 ? prev.blockedRateLimitCount + 1 : prev.blockedRateLimitCount,
        blockedIpCount: blockedIps.length
      }));
    }, Math.max(200, Math.floor(1000 / (simulator.rps / 10))));

    return () => clearInterval(interval);
  }, [simulator, isStreamingLogs, blockedIps, services]);

  // Actions: Services
  const addService = (serviceData: Omit<ApiService, 'id' | 'createdAt'>) => {
    const newService: ApiService = {
      ...serviceData,
      id: `srv-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setServices(prev => [...prev, newService]);
    setMetrics(prev => ({ ...prev, activeServicesCount: prev.activeServicesCount + 1 }));
    addToast('success', 'Service Registered', `Successfully added endpoint ${newService.endpoint}`);
  };

  const updateService = (id: string, updates: Partial<ApiService>) => {
    setServices(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    addToast('info', 'Service Updated', `Updated service configuration.`);
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    setMetrics(prev => ({ ...prev, activeServicesCount: Math.max(0, prev.activeServicesCount - 1) }));
    addToast('warning', 'Service Removed', `Service has been deleted from routing table.`);
  };

  const toggleServiceStatus = (id: string) => {
    setServices(prev =>
      prev.map(s => {
        if (s.id === id) {
          const nextStatus = s.status === 'HEALTHY' ? 'DEGRADED' : s.status === 'DEGRADED' ? 'DOWN' : 'HEALTHY';
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  // Actions: API Keys
  const createApiKey = async (name: string, owner: string, tier: string, allowedServices: string[]) => {
    const record = await apiClient.createApiKey(name, owner, tier, allowedServices);
    setApiKeys(prev => [record, ...prev]);
    setMetrics(prev => ({ ...prev, activeApiKeysCount: prev.activeApiKeysCount + 1 }));
    addToast('success', 'API Key Generated', `Key "${name}" created with ${tier} tier.`);
    return record;
  };

  const revokeApiKey = async (id: string) => {
    const keyRecord = apiKeys.find(k => k.id === id);
    if (!keyRecord) return;
    await apiClient.revokeApiKey(id, keyRecord.key);
    setApiKeys(prev => prev.map(k => (k.id === id ? { ...k, status: 'REVOKED' } : k)));
    setMetrics(prev => ({ ...prev, activeApiKeysCount: Math.max(0, prev.activeApiKeysCount - 1) }));
    addToast('error', 'API Key Revoked', `Key "${keyRecord.name}" is now inactive.`);
  };

  const rotateApiKey = async (id: string) => {
    const existing = apiKeys.find(k => k.id === id);
    if (!existing) throw new Error('Key not found');

    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const fullKey = `sh_live_${randomHex}`;
    const masked = `sh_live_••••••••••••${randomHex.slice(-4)}`;

    const updated: ApiKeyRecord = {
      ...existing,
      key: fullKey,
      maskedKey: masked,
      lastUsedAt: 'Just rotated'
    };

    setApiKeys(prev => prev.map(k => (k.id === id ? updated : k)));
    addToast('success', 'Key Rotated', `Generated new secret key for "${existing.name}".`);
    return updated;
  };

  // Actions: Blocked IPs & Anomaly Guardian
  const unblockIp = async (ip: string) => {
    await apiClient.unblockIp(ip);
    setBlockedIps(prev => prev.filter(b => b.ip !== ip));
    setAnomalies(prev =>
      prev.map(a => (a.clientIp === ip ? { ...a, status: 'RESOLVED', severity: 'RESOLVED' } : a))
    );
    setMetrics(prev => ({ ...prev, blockedIpCount: Math.max(0, prev.blockedIpCount - 1) }));
    addToast('info', 'IP Unblocked in Redis', `IP ${ip} removed from Redis blocked_ips set.`);
  };

  const manuallyBlockIp = async (ip: string, reason: string, ttlSeconds: number) => {
    const record = await apiClient.blockIp(ip, reason, ttlSeconds);
    setBlockedIps(prev => [record, ...prev.filter(b => b.ip !== ip)]);
    setMetrics(prev => ({ ...prev, blockedIpCount: prev.blockedIpCount + 1 }));

    // Create an anomaly entry for transparency
    const newAnomaly: AnomalyAlert = {
      id: `anom-${Date.now()}`,
      clientIp: ip,
      severity: 'CRITICAL',
      title: 'Manual Administrative Blacklist',
      description: reason || 'Administrator manually added IP to Redis blacklist.',
      detectedAt: 'Just now',
      errorRate: 0,
      baselineRate: 0,
      status: 'ACTIVE_BLOCK',
      ruleViolated: 'MANUAL_ADMIN_OVERRIDE',
      actionTaken: `REDIS_SADD_BLOCKED_IPS (TTL: ${ttlSeconds}s)`
    };
    setAnomalies(prev => [newAnomaly, ...prev]);

    addToast('error', 'IP Blocked', `Blacklisted IP ${ip} in Redis with ${ttlSeconds}s TTL.`);
  };

  const resolveAnomaly = (id: string) => {
    setAnomalies(prev =>
      prev.map(a => (a.id === id ? { ...a, status: 'RESOLVED', severity: 'RESOLVED' } : a))
    );
    addToast('success', 'Anomaly Resolved', `Flagged incident marked as resolved.`);
  };

  // Actions: Simulator Triggers
  const toggleSimulator = () => {
    setSimulator(prev => ({ ...prev, isRunning: !prev.isRunning }));
    addToast('info', 'Traffic Stream', simulator.isRunning ? 'Paused background traffic stream' : 'Resumed live traffic stream');
  };

  const setSimulatorRps = (rps: number) => {
    setSimulator(prev => ({ ...prev, rps }));
  };

  const triggerAttackBurst = () => {
    const attackingIp = `198.51.100.${Math.floor(Math.random() * 80) + 40}`;
    setSimulator(prev => ({
      ...prev,
      trafficMode: 'BURST_ATTACK',
      attackingIp,
      rps: 80
    }));

    addToast('error', '🚨 Simulating 404 Attack Burst', `Firing rapid requests from ${attackingIp} to trigger Anomaly Guardian!`);

    // Simulate Anomaly Guardian triggering after sliding window threshold (>50 errors in 10s)
    setTimeout(() => {
      const isAlreadyBlocked = blockedIps.some(b => b.ip === attackingIp);
      if (!isAlreadyBlocked) {
        const newBlock: BlockedIpRecord = {
          ip: attackingIp,
          reason: 'Pipes & Filters Heuristic Trigger (>50 404/500 errors in 10s)',
          blockedAt: new Date().toISOString(),
          ttlSeconds: 86400,
          expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
          errorCount: 64,
          attackType: 'ERROR_BURST'
        };
        setBlockedIps(prev => [newBlock, ...prev]);

        const newAnomaly: AnomalyAlert = {
          id: `anom-${Date.now()}`,
          clientIp: attackingIp,
          severity: 'CRITICAL',
          title: '🚨 Heuristic Threat Breach (>50 errors/10s)',
          description: `Anomaly Guardian detected 64 rapid 404 errors from ${attackingIp} within a 10s sliding window. Filter 4 pushed IP to Redis blacklist.`,
          detectedAt: 'Just now',
          errorRate: 64,
          baselineRate: 2,
          status: 'ACTIVE_BLOCK',
          ruleViolated: 'HEURISTIC_BURST_THRESHOLD (>50 err/10s)',
          actionTaken: 'REDIS_SADD_BLOCKED_IPS_24H_TTL',
          logsSample: [
            `${attackingIp} - - "GET /api/v1/admin/config HTTP/1.1" 404`,
            `${attackingIp} - - "POST /api/v1/secrets.json HTTP/1.1" 404`,
            `${attackingIp} - - "GET /api/v1/wp-login.php HTTP/1.1" 404`
          ]
        };
        setAnomalies(prev => [newAnomaly, ...prev]);
        setMetrics(prev => ({ ...prev, anomaliesDetectedCount: prev.anomaliesDetectedCount + 1 }));

        addToast('error', '🛡️ Auto-Blacklist Triggered!', `Anomaly Guardian auto-blocked ${attackingIp} in Redis for 24h!`);
      }

      // Reset back to normal mode
      setSimulator(prev => ({ ...prev, trafficMode: 'NORMAL', rps: 35 }));
    }, 4500);
  };

  const triggerRateLimitStorm = () => {
    setSimulator(prev => ({ ...prev, trafficMode: 'RATE_LIMIT_STORM', rps: 70 }));
    addToast('warning', '⏳ Simulating Token Bucket Exhaustion', 'Draining token bucket with 429 Too Many Requests responses.');

    setTimeout(() => {
      setSimulator(prev => ({ ...prev, trafficMode: 'NORMAL', rps: 35 }));
    }, 4000);
  };

  const triggerNormalSpike = () => {
    setSimulator(prev => ({ ...prev, trafficMode: 'NORMAL', rps: 65 }));
    addToast('info', '📈 Normal Traffic Spike', 'Generating high volume legitimate 200 OK traffic.');

    setTimeout(() => {
      setSimulator(prev => ({ ...prev, trafficMode: 'NORMAL', rps: 35 }));
    }, 4000);
  };

  const clearLogs = () => {
    setLogs([]);
    addToast('info', 'Logs Cleared', 'Access log buffer cleared.');
  };

  return (
    <TelemetryContext.Provider
      value={{
        activeTab,
        setActiveTab,
        metrics,
        timeSeries,
        timeRange,
        setTimeRange,
        services,
        addService,
        updateService,
        deleteService,
        toggleServiceStatus,
        apiKeys,
        createApiKey,
        revokeApiKey,
        rotateApiKey,
        blockedIps,
        anomalies,
        unblockIp,
        manuallyBlockIp,
        resolveAnomaly,
        logs,
        isStreamingLogs,
        setIsStreamingLogs,
        clearLogs,
        selectedLog,
        setSelectedLog,
        selectedAnomaly,
        setSelectedAnomaly,
        simulator,
        setSimulatorRps,
        toggleSimulator,
        triggerAttackBurst,
        triggerRateLimitStorm,
        triggerNormalSpike,
        tokenBucket,
        consumeToken,
        updateTokenBucketConfig,
        toasts,
        addToast,
        removeToast,
        isCreateKeyModalOpen,
        setIsCreateKeyModalOpen,
        isAddServiceModalOpen,
        setIsAddServiceModalOpen,
        isBlockIpModalOpen,
        setIsBlockIpModalOpen
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
