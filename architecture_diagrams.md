# ShieldAPI - Component & Sequence Diagrams (Initial Prototype)

This document contains detailed **UML Component** and **Sequence Diagrams** for the initial prototype of **ShieldAPI**, created according to the project specifications.

---

## Architectural Patterns Summary

ShieldAPI incorporates three core architectural styles:
1. **Broker Pattern**: Uses Redis as an in-memory message broker/state store to track API tokens, manage rate limits, and maintain IP blocklists across distributed gateway instances.
2. **Micro-Kernel (Plugin) Pattern**: The central core is a lightweight FastAPI HTTP Proxy. Extensible plugins (API Key Validator, Token Bucket Rate Limiter, IP Blacklist Validator) attach to the core proxy execution lifecycle.
3. **Pipes and Filters Pattern**: The Anomaly Guardian background service processes logs sequentially:
   `Raw HTTP Logs (Filter 1)` $\rightarrow$ `Log Data Parser (Filter 2)` $\rightarrow$ `Anomaly Detection Algorithm (Filter 3)` $\rightarrow$ `Dashboard Alert & Auto-Blocker (Filter 4)`.

---

## 1. System Component Diagram

The component diagram details the internal modules, plugins, data stores, and interfaces for the ShieldAPI ecosystem.

```mermaid
graph TB
    subgraph Client_Tier["Client & External Tier"]
        Client["Client Application / Consumer"]
        Attacker["Malicious Client / Bot"]
    end

    subgraph Admin_Tier["Admin Management Tier"]
        AdminUser["System Administrator"]
        subgraph Dashboard_UI["Dashboard UI (React / Admin Command Center)"]
            TrafficGraph["Live Traffic Graph (RPS)"]
            KeyManagerUI["API Key Manager UI"]
            AnomalyFeedUI["Anomaly Feed UI"]
        end
    end

    subgraph Gateway_Tier["API Gateway Tier (FastAPI Proxy / Micro-Kernel Core)"]
        CoreProxy["Core HTTP Proxy Router"]
        IPFilterPlugin["IP Blacklist Validator Plugin"]
        KeyValidatorPlugin["API Key Validator Plugin"]
        RateLimiterPlugin["Token Bucket Rate Limiter Plugin"]
        LogEmitter["Traffic Log Emitter"]
    end

    subgraph Broker_Tier["Broker & State Tier (Redis Data Store)"]
        RedisBroker[("Redis Broker / In-Memory Store")]
        KeyStore["API Key Storage"]
        TokenBucketStore["Token Bucket States (Capacity & Refill)"]
        BlockedIPStore["Blocked IP List"]
        RedisBroker --- KeyStore
        RedisBroker --- TokenBucketStore
        RedisBroker --- BlockedIPStore
    end

    subgraph Anomaly_Tier["Anomaly Engine Tier (Pipes & Filters Pipeline)"]
        subgraph Anomaly_Guardian["Anomaly Guardian (Background Python Service)"]
            Filter1["Filter 1: Raw Log Listener"]
            Filter2["Filter 2: HTTP Log Parser"]
            Filter3["Filter 3: Anomaly Detection Algorithm"]
            Filter4["Filter 4: Dashboard Alert & Auto-Blocker"]
            Filter1 --> Filter2 --> Filter3 --> Filter4
        end
    end

    subgraph Downstream_Tier["Downstream Microservices"]
        BackendService["Target Backend Microservice"]
    end

    %% Client Interactions
    Client -->|"HTTP Requests (with X-API-Key)"| CoreProxy
    Attacker -->|"High Volume / Malicious Requests"| CoreProxy

    %% Gateway Core & Plugin Pipeline
    CoreProxy --> IPFilterPlugin
    IPFilterPlugin --> KeyValidatorPlugin
    KeyValidatorPlugin --> RateLimiterPlugin
    RateLimiterPlugin -->|"Forward Authorized Request"| BackendService
    CoreProxy -->|"Stream Traffic Logs"| LogEmitter

    %% Plugin to Redis Connections
    IPFilterPlugin -->|"Check Blocked IPs"| RedisBroker
    KeyValidatorPlugin -->|"Validate Key Status"| RedisBroker
    RateLimiterPlugin -->|"Check/Drain Tokens"| RedisBroker

    %% Anomaly Guardian Pipeline Connections
    LogEmitter -->|"Log Stream / File Pipe"| Filter1
    Filter4 -->|"Update Blocklist"| RedisBroker
    Filter4 -->|"Push Real-time Alerts"| AnomalyFeedUI

    %% Admin UI Connections
    AdminUser -->|"Manage Keys / View Dashboard"| Dashboard_UI
    KeyManagerUI -->|"CRUD API Keys"| CoreProxy
    TrafficGraph <-->|"Websocket / SSE Telemetry"| CoreProxy
```

---

## 2. Sequence Diagrams

### 2.1 HTTP Request Lifecycle (Normal Authorized Request)

This diagram details the successful processing flow of an incoming client request passing through the IP blacklist check, API key validation, and token bucket rate limiter before reaching the downstream target microservice.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client Application
    participant Proxy as FastAPI Gateway (Core Proxy)
    participant IPCheck as IP Blacklist Plugin
    participant KeyVal as API Key Validator Plugin
    participant Limiter as Token Bucket Limiter
    participant Redis as Redis Broker
    participant Backend as Target Microservice
    participant Log as Traffic Log Emitter

    Client->>Proxy: HTTP Request (Method, Path, X-API-Key, Client-IP)
    Proxy->>IPCheck: Validate Client IP
    IPCheck->>Redis: SISMEMBER blocked_ips {Client-IP}
    Redis-->>IPCheck: 0 (Not Blocked)
    IPCheck-->>Proxy: IP Allowed

    Proxy->>KeyVal: Validate API Key
    KeyVal->>Redis: HGET api_keys {X-API-Key}
    Redis-->>KeyVal: Key Metadata (Status: Active)
    KeyVal-->>Proxy: Key Validated

    Proxy->>Limiter: Check Rate Limit (Key/IP)
    Limiter->>Redis: EVAL TokenBucketScript (capacity=10, refill=2/s)
    Redis-->>Limiter: Tokens Available (Remaining: 7)
    Limiter-->>Proxy: Rate Limit Allowed

    Proxy->>Backend: Forward HTTP Request
    Backend-->>Proxy: HTTP 200 OK (Response Payload)
    Proxy-->>Client: HTTP 200 OK (Response Payload)
    
    Proxy-)Log: Emit Traffic Log (IP, Status: 200, Latency)
```

---

### 2.2 Rate Limited Request Flow (HTTP 429 Too Many Requests)

When a client exceeds their permitted request rate, the Token Bucket Limiter plugin detects an empty token bucket and immediately drops the request with HTTP 429.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client Application / Bot
    participant Proxy as FastAPI Gateway (Core Proxy)
    participant IPCheck as IP Blacklist Plugin
    participant KeyVal as API Key Validator Plugin
    participant Limiter as Token Bucket Limiter
    participant Redis as Redis Broker
    participant Log as Traffic Log Emitter

    Client->>Proxy: HTTP Request (Rapid burst)
    Proxy->>IPCheck: Validate Client IP
    IPCheck->>Redis: SISMEMBER blocked_ips {Client-IP}
    Redis-->>IPCheck: 0 (Not Blocked)
    IPCheck-->>Proxy: IP Allowed

    Proxy->>KeyVal: Validate API Key
    KeyVal->>Redis: HGET api_keys {X-API-Key}
    Redis-->>KeyVal: Key Metadata (Status: Active)
    KeyVal-->>Proxy: Key Validated

    Proxy->>Limiter: Check Rate Limit
    Limiter->>Redis: EVAL TokenBucketScript
    Redis-->>Limiter: Token Bucket Empty (0 tokens)
    Limiter-->>Proxy: Rate Limit Exceeded

    Proxy-->>Client: HTTP 429 Too Many Requests {"error": "Rate limit exceeded"}
    Proxy-)Log: Emit Traffic Log (IP, Status: 429)
```

---

### 2.3 Invalid API Key Request Flow (HTTP 401 Unauthorized)

If an invalid or missing API key is provided, the API Key Validator plugin halts execution early.

```mermaid
sequenceDiagram
    autonumber
    actor Client as External Requestor
    participant Proxy as FastAPI Gateway (Core Proxy)
    participant IPCheck as IP Blacklist Plugin
    participant KeyVal as API Key Validator Plugin
    participant Redis as Redis Broker

    Client->>Proxy: HTTP Request (Invalid X-API-Key)
    Proxy->>IPCheck: Validate Client IP
    IPCheck->>Redis: SISMEMBER blocked_ips {Client-IP}
    Redis-->>IPCheck: 0 (Not Blocked)
    IPCheck-->>Proxy: IP Allowed

    Proxy->>KeyVal: Validate API Key
    KeyVal->>Redis: HGET api_keys {Invalid-Key}
    Redis-->>KeyVal: nil (Key Not Found)
    KeyVal-->>Proxy: Key Invalid

    Proxy-->>Client: HTTP 401 Unauthorized {"error": "Invalid API key"}
```

---

### 2.4 Anomaly Guardian Processing Pipeline (Pipes & Filters)

This sequence maps how background traffic logs are processed sequentially by the Anomaly Guardian pipeline to detect abuse (excessive 404/500 errors) and auto-block offending IPs.

```mermaid
sequenceDiagram
    autonumber
    participant Gateway as FastAPI Gateway (Log Emitter)
    participant F1 as Filter 1: Raw Log Listener
    participant F2 as Filter 2: HTTP Log Parser
    participant F3 as Filter 3: Anomaly Detection Algorithm
    participant F4 as Filter 4: Alert & Auto-Blocker
    participant Redis as Redis Broker
    participant DashUI as Admin Dashboard (Anomaly Feed)

    Gateway-)F1: Write/Stream Raw HTTP Log Line
    F1->>F2: Pass Raw Log Chunk
    F2->>F2: Extract IP, Timestamp, HTTP Status Code (404/500)
    F2->>F3: Pass Structured Log Record (IP, Status)

    F3->>F3: Update Sliding Window Error Counter for IP
    alt Error Threshold Breached (e.g. > 50 404/500 errors in 10s)
        F3->>F4: Trigger Anomaly Flag (IP, Reason: "High Error Frequency")
        F4->>Redis: SADD blocked_ips {Offending-IP}
        Redis-->>F4: IP Added to Blacklist
        F4-)DashUI: Push Real-Time Alert ("IP Blocked: High 404 Rate")
    else Threshold Normal
        F3->>F3: Retain state, continue monitoring
    end
```

---

### 2.5 Admin API Key Management Flow

This sequence demonstrates how a system administrator interacts with the Admin Dashboard UI to generate or revoke API keys stored in Redis.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as System Administrator
    participant UI as Admin Dashboard (React)
    participant AdminAPI as Gateway Admin API
    participant Redis as Redis Broker

    alt Generate New API Key
        Admin->>UI: Click "Generate API Key"
        UI->>AdminAPI: POST /admin/keys (Client Metadata)
        AdminAPI->>AdminAPI: Generate Secure Hash Key
        AdminAPI->>Redis: HSET api_keys {Key_ID} {Metadata}
        Redis-->>AdminAPI: OK
        AdminAPI-->>UI: 201 Created (New API Key)
        UI-->>Admin: Display New API Key
    else Revoke API Key
        Admin->>UI: Click "Revoke Key"
        UI->>AdminAPI: DELETE /admin/keys/{Key_ID}
        AdminAPI->>Redis: HDEL api_keys {Key_ID}
        Redis-->>AdminAPI: 1 (Key Removed)
        AdminAPI-->>UI: 200 OK (Key Revoked)
        UI-->>Admin: Update UI Key Table State
    end
```
