# ShieldAPI - Anomaly Guardian Engine (`apps/anomaly-engine`)

Background Python log analysis engine implementing the **Pipes and Filters** architectural pattern.

## Architecture (Pipes & Filters)
- **Filter 1 (Log Listener)**: Listens for raw HTTP log entries from Gateway.
- **Filter 2 (Data Parser)**: Extracts client IP, timestamp, and HTTP status codes (filtering 404/500 errors).
- **Filter 3 (Anomaly Algorithm)**: Computes error frequencies over sliding time windows per IP.
- **Filter 4 (Alert & Auto-Blocker)**: Adds offending IPs to the Redis `blocked_ips` set and emits alerts to the dashboard.

## Structure
```
apps/anomaly-engine/
├── engine/
│   ├── listener.py      # Filter 1
│   ├── parser.py        # Filter 2
│   ├── detector.py      # Filter 3
│   └── blocker.py       # Filter 4
├── Dockerfile
├── requirements.txt
└── README.md
```
