import React, { useEffect, useState } from 'react';
import { Colors } from '../../constants.ts';
import { apiCostService, CostSnapshot, CostConfig } from '../../services/apiCostService.ts';

const card: React.CSSProperties = {
  backgroundColor: Colors.cardBackground,
  borderRadius: '1rem',
  padding: '1rem',
  boxShadow: Colors.boxShadow,
};

const currency = (n: number) => `$${n.toFixed(4)}`;

const AdminApiCostView: React.FC = () => {
  const [snapshot, setSnapshot] = useState<CostSnapshot | null>(null);
  const [windowMinutes, setWindowMinutes] = useState(60);
  const [editing, setEditing] = useState<CostConfig | null>(null);
  const apis: Array<'gemini'|'maps'|'places'> = ['gemini','maps','places'];

  const refresh = async (wm = windowMinutes) => {
    try {
      const s = await apiCostService.getSnapshot(wm);
      setSnapshot(s);
      setEditing(s.config);
    } catch {}
  };

  useEffect(() => {
    apiCostService.initSocket();
    refresh();
    const onUpd = (s: CostSnapshot) => setSnapshot(s);
    apiCostService.onUpdate(onUpd);
    return () => apiCostService.offUpdate(onUpd);
  }, []);

  const win = snapshot?.window;

  return (
    <div className="animate-fadeInUp">
      <h1 className="text-2xl font-bold mb-6" style={{ color: Colors.text }}>API Cost Analytics</h1>

      <div className="mb-4 flex items-center gap-3" style={card}>
        <label className="text-sm" style={{ color: Colors.text_secondary }}>Window (minutes)</label>
        <input type="number" min={5} max={1440} className="input" value={windowMinutes} onChange={(e) => setWindowMinutes(parseInt(e.target.value || '60', 10))} />
        <button className="btn btn-primary" onClick={() => refresh()}>Refresh</button>
        {win && (
          <div className="ml-auto text-sm" style={{ color: Colors.text }}>
            Projected Daily: <span className="font-semibold">{currency(win.projected.dailyUSD)}</span> · Monthly: <span className="font-semibold">{currency(win.projected.monthlyUSD)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {apis.map((api) => (
          <div key={api} style={card}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold capitalize" style={{ color: Colors.text }}>{api}</h3>
            </div>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between"><span style={{ color: Colors.text_secondary }}>Total calls</span><span style={{ color: Colors.text }}>{snapshot?.snapshot.perApi[api].calls ?? 0}</span></div>
              <div className="flex justify-between"><span style={{ color: Colors.text_secondary }}>Rate / call</span><span style={{ color: Colors.text }}>{currency(snapshot?.snapshot.perApi[api].ratePerCallUSD ?? 0)}</span></div>
              <div className="flex justify-between"><span style={{ color: Colors.text_secondary }}>Total Cost</span><span className="font-semibold text-indigo-600">{currency(snapshot?.snapshot.perApi[api].costUSD ?? 0)}</span></div>
              {win && (
                <>
                  <div className="flex justify-between"><span style={{ color: Colors.text_secondary }}>Window calls</span><span style={{ color: Colors.text }}>{win.perApi[api].calls}</span></div>
                  <div className="flex justify-between"><span style={{ color: Colors.text_secondary }}>Rate/min</span><span style={{ color: Colors.text }}>{win.perApi[api].ratePerMin.toFixed(3)}</span></div>
                  <div className="flex justify-between"><span style={{ color: Colors.text_secondary }}>Window cost</span><span className="font-semibold">{currency(win.perApi[api].costUSD)}</span></div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {snapshot && (
        <div style={card} className="mb-6">
          <div className="flex items-center gap-3">
            <label className="text-sm" style={{ color: Colors.text }}>Include error calls in cost</label>
            <input type="checkbox" checked={!!editing?.includeErrors} onChange={(e) => setEditing(prev => prev ? { ...prev, includeErrors: e.target.checked } : prev)} />
            <button className="btn btn-secondary" onClick={async () => { if (!editing) return; await apiCostService.updateConfig({ includeErrors: editing.includeErrors }); await refresh(); }}>Save</button>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {apis.map(api => (
              <div key={api} className="p-3 border rounded" style={{ borderColor: Colors.cardBorder }}>
                <div className="text-sm mb-2" style={{ color: Colors.text }}>Rate per call for {api}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: Colors.text_secondary }}>$</span>
                  <input type="number" min={0} step={0.0001} className="input flex-1" value={editing?.rates[api] ?? 0} onChange={(e) => setEditing(prev => prev ? { ...prev, rates: { ...prev.rates, [api]: parseFloat(e.target.value || '0') } } : prev)} />
                  <button className="btn btn-primary" onClick={async () => { if (!editing) return; await apiCostService.updateConfig({ rates: { [api]: editing.rates[api] } }); await refresh(); }}>Update</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {snapshot && (
        <div style={card}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: Colors.text }}>Totals</h3>
            <div className="text-sm" style={{ color: Colors.text }}>
              Since: {new Date(snapshot.sinceTs).toLocaleString()}
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-indigo-700">Overall Cost: {currency(snapshot.snapshot.totalCostUSD)}</div>
        </div>
      )}
    </div>
  );
};

export default AdminApiCostView;
