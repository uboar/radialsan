import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RuntimeStatus } from '../../types/settings';

const DEFAULT_STATUS: RuntimeStatus = {
  inputMonitoringAvailable: true,
  activeWindowMonitoringAvailable: true,
  inputMonitoringDetail: null,
  activeWindowMonitoringDetail: null,
};

export const RuntimeStatusBanner: React.FC = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<RuntimeStatus>(DEFAULT_STATUS);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setup = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const { listen } = await import('@tauri-apps/api/event');

        const currentStatus = await invoke<RuntimeStatus>('get_runtime_status');
        setStatus(currentStatus);

        unlisten = await listen<RuntimeStatus>('radialsan://runtime-status', (event) => {
          setStatus(event.payload);
        });
      } catch {
        // Not running inside Tauri.
      }
    };

    setup();
    return () => {
      unlisten?.();
    };
  }, []);

  const warnings = [];

  if (!status.inputMonitoringAvailable) {
    warnings.push({
      key: 'input-monitoring',
      title: t('runtimeWarnings.inputMonitoringTitle'),
      body: t('runtimeWarnings.inputMonitoringBody'),
      detail: status.inputMonitoringDetail,
    });
  }

  if (!status.activeWindowMonitoringAvailable) {
    warnings.push({
      key: 'active-window-monitoring',
      title: t('runtimeWarnings.activeWindowTitle'),
      body: t('runtimeWarnings.activeWindowBody'),
      detail: status.activeWindowMonitoringDetail,
    });
  }

  if (warnings.length === 0) {
    return null;
  }

  return (
    <section className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
      <h2 className="text-sm font-semibold text-amber-200">
        {t('runtimeWarnings.title')}
      </h2>
      <div className="mt-3 space-y-3">
        {warnings.map((warning) => (
          <div
            key={warning.key}
            className="rounded-lg border border-amber-500/20 bg-theme-bg-secondary/70 p-3"
          >
            <p className="text-sm font-medium text-theme-text-primary">{warning.title}</p>
            <p className="mt-1 text-sm text-theme-text-secondary">{warning.body}</p>
            {warning.detail && (
              <p className="mt-2 text-xs text-theme-text-muted">
                {t('runtimeWarnings.details', { detail: warning.detail })}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
