import React from 'react';
import { TelemetryProvider, useTelemetry } from './context/TelemetryContext';
import { AppLayout } from './components/layout/AppLayout';
import { OverviewTab } from './components/dashboard/OverviewTab';
import { ServicesTab } from './components/dashboard/ServicesTab';
import { ApiKeysTab } from './components/dashboard/ApiKeysTab';
import { RateLimitsTab } from './components/dashboard/RateLimitsTab';
import { AnomaliesTab } from './components/dashboard/AnomaliesTab';
import { LogsTab } from './components/dashboard/LogsTab';
import { HealthTab } from './components/dashboard/HealthTab';
import { SettingsTab } from './components/dashboard/SettingsTab';

const DashboardContent: React.FC = () => {
  const { activeTab } = useTelemetry();

  switch (activeTab) {
    case 'overview':
      return <OverviewTab />;
    case 'services':
      return <ServicesTab />;
    case 'keys':
      return <ApiKeysTab />;
    case 'limits':
      return <RateLimitsTab />;
    case 'anomalies':
      return <AnomaliesTab />;
    case 'logs':
      return <LogsTab />;
    case 'health':
      return <HealthTab />;
    case 'settings':
      return <SettingsTab />;
    default:
      return <OverviewTab />;
  }
};

export const App: React.FC = () => {
  return (
    <TelemetryProvider>
      <AppLayout>
        <DashboardContent />
      </AppLayout>
    </TelemetryProvider>
  );
};

export default App;
