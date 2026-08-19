import {
  ApiService,
  ApiKeyRecord,
  BlockedIpRecord,
  AnomalyAlert,
  TrafficLogEntry,
  TimeSeriesPoint,
  GatewayMetrics
} from './types';

export const initialServices: ApiService[] = [
  {
    id: 'srv-payments',
    name: 'Payments Ingestion API',
    endpoint: '/api/v1/payments',
    targetUrl: 'http://payments-service:8082',
    methods: ['POST', 'GET'],
    status: 'HEALTHY',
    requestsPerMin: 1240,
    avgLatencyMs: 24,
    p95LatencyMs: 48,
    rateLimitCapacity: 100,
    rateLimitRefill: 20.0,
    uptime: '99.98%',
    description: 'Processes credit card transactions, webhooks, and payout dispatches.',
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'srv-auth',
    name: 'Identity & Auth Service',
    endpoint: '/api/v1/auth',
    targetUrl: 'http://auth-service:8081',
    methods: ['POST', 'GET', 'PUT'],
    status: 'HEALTHY',
    requestsPerMin: 890,
    avgLatencyMs: 16,
    p95LatencyMs: 32,
    rateLimitCapacity: 50,
    rateLimitRefill: 10.0,
    uptime: '99.99%',
    description: 'OAuth2 token issuance, JWT verification, and session revocations.',
    createdAt: '2026-08-02T14:30:00Z'
  },
  {
    id: 'srv-users',
    name: 'Users & Accounts API',
    endpoint: '/api/v1/users',
    targetUrl: 'http://users-service:8083',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    status: 'HEALTHY',
    requestsPerMin: 640,
    avgLatencyMs: 19,
    p95LatencyMs: 38,
    rateLimitCapacity: 60,
    rateLimitRefill: 12.0,
    uptime: '99.95%',
    description: 'User profile management, role assignments, and tenant metadata.',
    createdAt: '2026-08-04T09:15:00Z'
  },
  {
    id: 'srv-analytics',
    name: 'Telemetry & Events Stream',
    endpoint: '/api/v1/events',
    targetUrl: 'http://analytics-service:8084',
    methods: ['POST'],
    status: 'DEGRADED',
    requestsPerMin: 2150,
    avgLatencyMs: 68,
    p95LatencyMs: 142,
    rateLimitCapacity: 200,
    rateLimitRefill: 50.0,
    uptime: '99.82%',
    description: 'High-throughput event bus ingesting client interaction telemetry.',
    createdAt: '2026-08-05T16:00:00Z'
  },
  {
    id: 'srv-backend',
    name: 'Protected Target Microservice',
    endpoint: '/api/v1/target',
    targetUrl: 'http://backend-service:8001',
    methods: ['GET', 'POST'],
    status: 'HEALTHY',
    requestsPerMin: 420,
    avgLatencyMs: 12,
    p95LatencyMs: 22,
    rateLimitCapacity: 10,
    rateLimitRefill: 2.0,
    uptime: '100.0%',
    description: 'Downstream microservice protected behind ShieldAPI rate-limiting proxy.',
    createdAt: '2026-08-10T11:20:00Z'
  }
];

export const initialApiKeys: ApiKeyRecord[] = [
  {
    id: 'key-1',
    key: 'sh_live_9a8f4c2b1e7d6a5f4e3d2c1b0a9f8e7d',
    maskedKey: 'sh_live_••••••••••••8e7d',
    name: 'Production Core Client',
    owner: 'Platform Engineering',
    tier: 'ENTERPRISE',
    status: 'ACTIVE',
    rateLimitRpm: 5000,
    createdAt: '2026-08-01T12:00:00Z',
    lastUsedAt: 'Just now',
    totalRequests: 148290,
    allowedServices: ['*']
  },
  {
    id: 'key-2',
    key: 'sh_live_3b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e',
    maskedKey: 'sh_live_••••••••••••0d1e',
    name: 'Mobile App Gateway iOS',
    owner: 'Mobile Team',
    tier: 'STANDARD',
    status: 'ACTIVE',
    rateLimitRpm: 1200,
    createdAt: '2026-08-03T09:40:00Z',
    lastUsedAt: '12s ago',
    totalRequests: 84310,
    allowedServices: ['srv-payments', 'srv-auth', 'srv-users']
  },
  {
    id: 'key-3',
    key: 'sh_live_f1e2d3c4b5a697887766554433221100',
    maskedKey: 'sh_live_••••••••••••1100',
    name: 'Staging Integration Bot',
    owner: 'QA Automation',
    tier: 'DEVELOPER',
    status: 'ACTIVE',
    rateLimitRpm: 300,
    createdAt: '2026-08-06T15:20:00Z',
    lastUsedAt: '3m ago',
    totalRequests: 12450,
    allowedServices: ['srv-backend', 'srv-users']
  },
  {
    id: 'key-4',
    key: 'sh_live_aa11bb22cc33dd44ee55ff6677889900',
    maskedKey: 'sh_live_••••••••••••9900',
    name: 'Legacy Partner Hook (Revoked)',
    owner: 'Acme Corp',
    tier: 'STANDARD',
    status: 'REVOKED',
    rateLimitRpm: 600,
    createdAt: '2026-07-20T08:10:00Z',
    lastUsedAt: '3 days ago',
    totalRequests: 23140,
    allowedServices: ['srv-payments']
  }
];

export const initialBlockedIps: BlockedIpRecord[] = [
  {
    ip: '198.51.100.42',
    reason: 'Heuristic Threshold Breached (>50 404/500 errors in 10s window)',
    blockedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    ttlSeconds: 86400,
    expiresAt: new Date(Date.now() + 85560 * 1000).toISOString(),
    errorCount: 68,
    attackType: 'ERROR_BURST'
  },
  {
    ip: '203.0.113.195',
    reason: 'Volumetric Token Bucket Drain / Rate Limit Storm',
    blockedAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    ttlSeconds: 86400,
    expiresAt: new Date(Date.now() + 83520 * 1000).toISOString(),
    errorCount: 142,
    attackType: 'RATE_ABUSE'
  },
  {
    ip: '192.0.2.77',
    reason: 'Path Traversal & Vulnerability Scanner Probe',
    blockedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    ttlSeconds: 86400,
    expiresAt: new Date(Date.now() + 79200 * 1000).toISOString(),
    errorCount: 94,
    attackType: 'PROBING'
  }
];

export const initialAnomalies: AnomalyAlert[] = [
  {
    id: 'anom-1',
    clientIp: '198.51.100.42',
    severity: 'CRITICAL',
    title: 'Heuristic Error Burst Detected',
    description: 'Client initiated 68 continuous 404/500 requests targeting non-existent endpoints within a 10s sliding window.',
    detectedAt: '14 minutes ago',
    errorRate: 68,
    baselineRate: 2,
    status: 'ACTIVE_BLOCK',
    ruleViolated: 'HEURISTIC_BURST_THRESHOLD (>50 err/10s)',
    actionTaken: 'AUTO_BLACKLIST_REDIS_24H (TTL: 86400s)',
    logsSample: [
      '198.51.100.42 - - "GET /api/v1/admin/config HTTP/1.1" 404',
      '198.51.100.42 - - "POST /api/v1/.env HTTP/1.1" 404',
      '198.51.100.42 - - "GET /api/v1/wp-login.php HTTP/1.1" 404'
    ]
  },
  {
    id: 'anom-2',
    clientIp: '203.0.113.195',
    severity: 'CRITICAL',
    title: 'Token Bucket Rapid Depletion Storm',
    description: 'Sustained 429 flood of 240 req/sec attempting to exhaust Redis token bucket capacity on /api/v1/payments.',
    detectedAt: '48 minutes ago',
    errorRate: 142,
    baselineRate: 5,
    status: 'ACTIVE_BLOCK',
    ruleViolated: 'RATE_LIMIT_ABUSE_PERSISTENT',
    actionTaken: 'AUTO_BLACKLIST_REDIS_24H (TTL: 86400s)',
    logsSample: [
      '203.0.113.195 - - "POST /api/v1/payments HTTP/1.1" 429',
      '203.0.113.195 - - "POST /api/v1/payments HTTP/1.1" 429'
    ]
  },
  {
    id: 'anom-3',
    clientIp: '185.220.101.5',
    severity: 'WARNING',
    title: 'Repeated 401 Authentication Failures',
    description: 'Rotated 34 invalid API key hashes against /api/v1/auth within 2 minutes. Nearing auto-ban threshold.',
    detectedAt: '1 hour ago',
    errorRate: 34,
    baselineRate: 1,
    status: 'INVESTIGATING',
    ruleViolated: 'AUTH_FAILURE_CLUSTER',
    actionTaken: 'FLAGGED_FOR_MONITORING'
  }
];

export const generateInitialLogs = (): TrafficLogEntry[] => {
  const ips = ['192.168.1.104', '10.0.0.15', '172.16.0.4', '198.51.100.42', '10.0.0.88', '203.0.113.195', '192.168.1.201'];
  const methods: ('GET' | 'POST' | 'PUT')[] = ['GET', 'POST', 'GET', 'GET', 'POST'];
  const paths = [
    { path: '/api/v1/payments', service: 'Payments Ingestion API', status: 200, action: 'ALLOWED' as const },
    { path: '/api/v1/auth/verify', service: 'Identity & Auth Service', status: 200, action: 'ALLOWED' as const },
    { path: '/api/v1/users/profile', service: 'Users & Accounts API', status: 200, action: 'ALLOWED' as const },
    { path: '/api/v1/target/data', service: 'Protected Target Microservice', status: 200, action: 'ALLOWED' as const },
    { path: '/api/v1/payments', service: 'Payments Ingestion API', status: 429, action: 'RATE_LIMITED' as const },
    { path: '/api/v1/admin/secrets', service: 'Identity & Auth Service', status: 403, action: 'BLOCKED_IP' as const },
    { path: '/api/v1/events', service: 'Telemetry & Events Stream', status: 200, action: 'ALLOWED' as const },
    { path: '/api/v1/auth/token', service: 'Identity & Auth Service', status: 401, action: 'INVALID_KEY' as const }
  ];

  const logs: TrafficLogEntry[] = [];
  const now = Date.now();

  for (let i = 0; i < 40; i++) {
    const item = paths[i % paths.length];
    const ip = item.action === 'BLOCKED_IP' ? '198.51.100.42' : item.action === 'RATE_LIMITED' ? '203.0.113.195' : ips[i % ips.length];
    const timeOffset = i * 2500;
    const dateObj = new Date(now - timeOffset);
    const timeStr = dateObj.toTimeString().split(' ')[0];

    logs.push({
      id: `log-${i + 1}`,
      timestamp: timeStr,
      clientIp: ip,
      method: methods[i % methods.length],
      path: item.path,
      statusCode: item.status,
      latencyMs: item.status === 200 ? Math.floor(Math.random() * 35) + 12 : Math.floor(Math.random() * 4) + 1,
      apiKeyName: item.action === 'INVALID_KEY' ? undefined : 'sh_live_••••••••8e7d',
      serviceName: item.service,
      action: item.action,
      userAgent: 'Mozilla/5.0 (ShieldAPI-Agent/1.0)',
      tokensRemaining: item.action === 'RATE_LIMITED' ? 0 : Math.floor(Math.random() * 8) + 2,
      responseSizeBytes: item.status === 200 ? Math.floor(Math.random() * 2400) + 350 : 128
    });
  }

  return logs;
};

export const generateTimeSeriesData = (range: '15m' | '1h' | '24h' | '7d'): TimeSeriesPoint[] => {
  const points: TimeSeriesPoint[] = [];
  const count = range === '15m' ? 15 : range === '1h' ? 24 : range === '24h' ? 24 : 14;
  const now = Date.now();

  for (let i = count - 1; i >= 0; i--) {
    let label = '';
    let intervalMs = 60000; // 1 min

    if (range === '15m') {
      intervalMs = 60000;
      const d = new Date(now - i * intervalMs);
      label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (range === '1h') {
      intervalMs = 2.5 * 60000;
      const d = new Date(now - i * intervalMs);
      label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (range === '24h') {
      intervalMs = 3600000;
      const d = new Date(now - i * intervalMs);
      label = `${d.getHours()}:00`;
    } else {
      intervalMs = 86400000 / 2;
      const d = new Date(now - i * intervalMs);
      label = `${d.getMonth() + 1}/${d.getDate()}`;
    }

    const base = Math.floor(Math.random() * 250) + 400;
    const ok2xx = Math.floor(base * 0.94);
    const err4xx = Math.floor(base * 0.03);
    const err5xx = Math.floor(base * 0.005);
    const blocked = Math.floor(base * 0.025);

    points.push({
      timestamp: new Date(now - i * intervalMs).toISOString(),
      timeLabel: label,
      totalRequests: ok2xx + err4xx + err5xx + blocked,
      status2xx: ok2xx,
      status4xx: err4xx,
      status5xx: err5xx,
      blockedRequests: blocked,
      avgLatencyMs: Math.floor(Math.random() * 15) + 20
    });
  }

  return points;
};

export const initialMetrics: GatewayMetrics = {
  totalRequests: 142890,
  requestsPerMinute: 2480,
  successRatePercent: 99.4,
  blockedRateLimitCount: 1420,
  blockedIpCount: 3,
  activeApiKeysCount: 3,
  activeServicesCount: 5,
  avgLatencyMs: 22.4,
  p95LatencyMs: 44.1,
  anomaliesDetectedCount: 3,
  redisOpsPerSec: 3200,
  redisMemoryMb: 4.8,
  redisConnected: true,
  gatewayOperational: true,
  anomalyGuardianActive: true
};
