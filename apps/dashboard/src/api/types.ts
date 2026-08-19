export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export type ServiceStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN';

export interface ApiService {
  id: string;
  name: string;
  endpoint: string;
  targetUrl: string;
  methods: HttpMethod[];
  status: ServiceStatus;
  requestsPerMin: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  rateLimitCapacity: number;
  rateLimitRefill: number;
  uptime: string;
  description?: string;
  createdAt: string;
}

export type KeyTier = 'STANDARD' | 'ENTERPRISE' | 'INTERNAL' | 'DEVELOPER';

export interface ApiKeyRecord {
  id: string;
  key: string; // e.g. "sh_live_9a8f4c2b1e7d..."
  maskedKey: string; // e.g. "sh_live_••••••••••••1e7d"
  name: string;
  owner: string;
  tier: KeyTier;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  rateLimitRpm: number;
  createdAt: string;
  lastUsedAt: string;
  totalRequests: number;
  allowedServices: string[]; // service ids or ["*"]
}

export interface BlockedIpRecord {
  ip: string;
  reason: string;
  blockedAt: string;
  ttlSeconds: number; // e.g. 86400 (24 hours)
  expiresAt: string;
  errorCount: number;
  attackType: 'ERROR_BURST' | 'BRUTE_FORCE' | 'RATE_ABUSE' | 'PROBING';
}

export type AnomalySeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'RESOLVED';

export interface AnomalyAlert {
  id: string;
  clientIp: string;
  severity: AnomalySeverity;
  title: string;
  description: string;
  detectedAt: string;
  errorRate: number; // e.g. 62 errors / 10s
  baselineRate: number; // e.g. 2 errors / 10s
  status: 'ACTIVE_BLOCK' | 'INVESTIGATING' | 'RESOLVED';
  ruleViolated: string; // e.g. "HEURISTIC_BURST_THRESHOLD" (>50 err/10s)
  actionTaken: string; // "AUTO_BLACKLIST_REDIS_24H"
  logsSample?: string[];
}

export type TrafficAction = 'ALLOWED' | 'RATE_LIMITED' | 'BLOCKED_IP' | 'INVALID_KEY' | 'ERROR';

export interface TrafficLogEntry {
  id: string;
  timestamp: string;
  clientIp: string;
  method: HttpMethod;
  path: string;
  statusCode: number;
  latencyMs: number;
  apiKeyName?: string;
  serviceName: string;
  action: TrafficAction;
  userAgent?: string;
  tokensRemaining?: number;
  responseSizeBytes?: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  timeLabel: string;
  totalRequests: number;
  status2xx: number;
  status4xx: number;
  status5xx: number;
  blockedRequests: number;
  avgLatencyMs: number;
}

export interface GatewayMetrics {
  totalRequests: number;
  requestsPerMinute: number;
  successRatePercent: number;
  blockedRateLimitCount: number;
  blockedIpCount: number;
  activeApiKeysCount: number;
  activeServicesCount: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  anomaliesDetectedCount: number;
  redisOpsPerSec: number;
  redisMemoryMb: number;
  redisConnected: boolean;
  gatewayOperational: boolean;
  anomalyGuardianActive: boolean;
}

export type TimeRangeFilter = '15m' | '1h' | '24h' | '7d';

export interface SimulatorConfig {
  isRunning: boolean;
  trafficMode: 'NORMAL' | 'BURST_ATTACK' | 'RATE_LIMIT_STORM' | 'RANDOM_ERRORS';
  rps: number;
  attackingIp: string;
}
