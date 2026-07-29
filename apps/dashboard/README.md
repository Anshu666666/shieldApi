# ShieldAPI - Admin Command Center Dashboard (`apps/dashboard`)

Futuristic, dark-mode admin command center frontend interface.

## Key UI Components
- **Live Traffic Graph**: Real-time visualization of requests per second and gateway latency.
- **API Key Manager**: Interface for generating, listing, and revoking API keys.
- **Anomaly Feed**: Real-time scrolling feed highlighting suspicious and auto-blocked IP addresses.

## Structure
```
apps/dashboard/
├── src/
│   ├── components/     # TrafficGraph, KeyManager, AnomalyFeed components
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── Dockerfile
└── README.md
```
