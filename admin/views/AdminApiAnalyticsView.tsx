import React, { useEffect, useState } from 'react';
import { Colors } from '../../constants.ts';
import { usageAnalytics, UsageTotals, UsageEvent } from '../../services/usageAnalyticsService.ts';

const card: React.CSSProperties = {
  backgroundColor: Colors.cardBackground,
  borderRadius: '1rem',
  padding: '1rem',
  boxShadow: Colors.boxShadow,
};

const AdminApiAnalyticsView: React.FC = () => {
  const [totals, setTotals] = useState<UsageTotals | null>(null);
  const [events, setEvents] = useState<UsageEvent[]>([]);

  useEffect(() => {
    usageAnalytics.connect();
    usageAnalytics.getSnapshot().then(({ totals, events }) => {
      setTotals(totals); setEvents(events);
    }).catch(() => {});
    const onUpdate = (payload: { totals: UsageTotals; events: UsageEvent[] }) => {
      setTotals(payload.totals);
      setEvents(payload.events);
    };
    usageAnalytics.onUpdate(onUpdate);
    return () => usageAnalytics.offUpdate(onUpdate);
  }, []);

  return (
    <div className="animate-fadeInUp">
      <h1 className="text-2xl font-bold mb-6" style={{ color: Colors.text }}>API Utilization Analytics</h1>

      {totals ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {(['gemini','maps','places'] as const).map((api) => (
            <div key={api} style={card}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold capitalize" style={{ color: Colors.text }}>{api}</h3>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold" style={{ color: Colors.text }}>{totals[api].count}</div>
                  <div className="text-xs" style={{ color: Colors.text_secondary }}>Total</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">{totals[api].success}</div>
                  <div className="text-xs" style={{ color: Colors.text_secondary }}>Success</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">{totals[api].error}</div>
                  <div className="text-xs" style={{ color: Colors.text_secondary }}>Errors</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-6" style={card}>Loading usage snapshot…</div>
      )}

      <div style={card}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: Colors.text }}>Recent Activity</h3>
        <div className="max-h-96 overflow-auto divide-y divide-gray-200/60">
          {events.length === 0 && (
            <div className="text-sm" style={{ color: Colors.text_secondary }}>No events yet.</div>
          )}
          {events.slice().reverse().map((e) => (
            <div key={e.id} className="py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: '#eef2ff', color: Colors.primary }}>{e.api}</span>
                <span className="text-sm" style={{ color: Colors.text }}>{e.action || 'call'}</span>
              </div>
              <div className="flex items-center gap-4">
                {e.durationMs != null && (
                  <span className="text-xs" style={{ color: Colors.text_secondary }}>{e.durationMs} ms</span>
                )}
                <span className={`text-xs font-semibold ${e.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{e.status}</span>
                <span className="text-xs" style={{ color: Colors.text_secondary }}>{new Date(e.ts).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminApiAnalyticsView;
