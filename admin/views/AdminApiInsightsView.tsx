import React, { useEffect, useMemo, useState } from 'react';
import { Colors } from '../../constants.ts';
import { usageAnalytics, UsageTotals, UsageEvent } from '../../services/usageAnalyticsService.ts';
import { apiCostService, CostSnapshot } from '../../services/apiCostService.ts';

type ApiKey = 'gemini'|'maps'|'places';

const card: React.CSSProperties = {
  backgroundColor: Colors.cardBackground,
  borderRadius: '1rem',
  padding: '1rem',
  boxShadow: Colors.boxShadow,
};

const currency = (n: number) => `$${n.toFixed(4)}`;

const Spark: React.FC<{ points: number[] }> = ({ points }) => {
  const max = Math.max(1, ...points);
  const path = points.map((v,i) => `${i===0 ? 'M' : 'L'} ${i*10} ${20 - (v/max)*20}`).join(' ');
  return (
    <svg width={points.length*10} height={20} viewBox={`0 0 ${points.length*10} 20`}>
      <path d={path} fill="none" stroke={Colors.primary} strokeWidth={2} />
    </svg>
  );
};

// Lightweight SVG line chart
const LineChart: React.FC<{ labels: string[]; series: { name: string; data: number[]; color: string }[]; height?: number }>
  = ({ labels, series, height = 160 }) => {
  const width = Math.max(240, labels.length * 16);
  const max = Math.max(1, ...series.flatMap(s => s.data));
  const pointsFor = (data: number[]) => data.map((v,i) => ({ x: (i/(Math.max(1,labels.length-1)))* (width-40) + 20, y: height - 24 - (v/max) * (height-48) }));
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect x={0} y={0} width={width} height={height} fill={Colors.cardBackground} rx={8} />
      {/* Y axis grid */}
      {[0.25,0.5,0.75].map((p,idx)=> (
        <line key={idx} x1={20} x2={width-20} y1={height-24 - p*(height-48)} y2={height-24 - p*(height-48)} stroke="#e5e7eb" strokeDasharray="3 3" />
      ))}
      {series.map((s, idx) => {
        const pts = pointsFor(s.data);
        const d = pts.map((p,i)=> `${i===0?'M':'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
        return <path key={idx} d={d} fill="none" stroke={s.color} strokeWidth={2} />;
      })}
      {/* X axis labels (sparse) */}
      {labels.map((l,i)=> i % Math.ceil(labels.length/6 || 1) === 0 ? (
        <text key={i} x={(i/(Math.max(1,labels.length-1)))*(width-40)+20} y={height-6} textAnchor="middle" fontSize={10} fill={Colors.text_secondary}>{l}</text>
      ) : null)}
    </svg>
  );
};

// Minimal pie chart
const PieChart: React.FC<{ values: { label: string; value: number; color: string }[]; size?: number }>
  = ({ values, size = 160 }) => {
  const total = values.reduce((a,b)=>a+b.value,0) || 1;
  let acc = 0;
  const radius = size/2;
  const cx = radius, cy = radius;
  const arcs = values.map((v, idx) => {
    const start = (acc/total) * Math.PI * 2; acc += v.value;
    const end = (acc/total) * Math.PI * 2;
    const large = end-start > Math.PI ? 1 : 0;
    const x1 = cx + radius*Math.cos(start), y1 = cy + radius*Math.sin(start);
    const x2 = cx + radius*Math.cos(end), y2 = cy + radius*Math.sin(end);
    return <path key={idx} d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`} fill={v.color} />;
  });
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{arcs}</svg>;
};

const AdminApiInsightsView: React.FC = () => {
  const [totals, setTotals] = useState<UsageTotals | null>(null);
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [cost, setCost] = useState<CostSnapshot | null>(null);
  const [daily, setDaily] = useState<any>(null);
  const [monthly, setMonthly] = useState<any>(null);
  const [windowStats, setWindowStats] = useState<any>(null);
  const [windowMinutes, setWindowMinutes] = useState<number|"custom">(60);
  const [customSince, setCustomSince] = useState<string>("");
  const [customUntil, setCustomUntil] = useState<string>("");
  const [selectedApis, setSelectedApis] = useState<Record<ApiKey, boolean>>({ gemini: true, maps: true, places: true });
  const [usageTs, setUsageTs] = useState<{ bucket: string; points: Array<{ t: string; perApi: Record<ApiKey, { success: number; error: number; total: number }> }> } | null>(null);
  const [usageView, setUsageView] = useState<'all'|'success'|'error'>('all');
  const [shareMode, setShareMode] = useState<'usage'|'cost'>('usage');

  const apis: ApiKey[] = ['gemini','maps','places'];

  const refresh = async () => {
    try {
      const apisQuery = Object.entries(selectedApis).filter(([,v])=>v).map(([k])=>k).join(',') || 'gemini,maps,places';
      const isCustom = windowMinutes === 'custom';
      const windowParam = typeof windowMinutes === 'number' ? `window=${windowMinutes}` : '';
      const rangeParams = isCustom && customSince && customUntil ? `since=${encodeURIComponent(customSince)}&until=${encodeURIComponent(customUntil)}` : '';
      const tsUrl = `/api/usage/timeseries?bucket=auto&apis=${encodeURIComponent(apisQuery)}&status=all&${isCustom ? rangeParams : windowParam}`.replace(/&$/,'');
      const [snap, d, m, w, ts] = await Promise.all([
        apiCostService.getSnapshot(typeof windowMinutes === 'number' ? windowMinutes : 60),
        fetch(`/api/usage/aggregate/daily?days=30`).then(r=>r.json()),
        fetch(`/api/usage/aggregate/monthly?months=12`).then(r=>r.json()),
        fetch(isCustom && customSince && customUntil ? `/api/usage/stats?window=60` : `/api/usage/stats?window=${typeof windowMinutes==='number'?windowMinutes:60}`).then(r=>r.json()),
        fetch(tsUrl).then(r=>r.json()),
      ]);
      setCost(snap);
      setDaily(d); setMonthly(m); setWindowStats(w); setUsageTs(ts);
    } catch {}
  };

  useEffect(() => {
    usageAnalytics.connect();
    usageAnalytics.getSnapshot().then(({ totals, events }) => { setTotals(totals); setEvents(events); }).catch(()=>{});
    const onUpd = (payload: { totals: UsageTotals; events: UsageEvent[] }) => { setTotals(payload.totals); setEvents(payload.events); };
    usageAnalytics.onUpdate(onUpd);

    apiCostService.initSocket();
    const onCost = (s: CostSnapshot) => setCost(s);
    apiCostService.onUpdate(onCost);

    refresh();
    return () => { usageAnalytics.offUpdate(onUpd); apiCostService.offUpdate(onCost); };
  }, []);

  // Refetch when window or filters change
  useEffect(() => { refresh(); }, [windowMinutes, selectedApis, customSince, customUntil]);

  const dailySeries = useMemo(() => {
    if (!daily?.days) return null;
    const labels = daily.days.map((d:any)=>d.day.slice(5));
    const byApi: Record<ApiKey, number[]> = { gemini:[], maps:[], places:[] };
    for (const d of daily.days) {
      for (const a of apis) byApi[a].push((d.perApi[a].success||0)+(d.perApi[a].error||0));
    }
    return { labels, byApi };
  }, [daily]);

  const monthlySeries = useMemo(() => {
    if (!monthly?.months) return null;
    const labels = monthly.months.map((m:any)=>m.month);
    const byApi: Record<ApiKey, number[]> = { gemini:[], maps:[], places:[] };
    for (const d of monthly.months) {
      for (const a of apis) byApi[a].push((d.perApi[a].success||0)+(d.perApi[a].error||0));
    }
    return { labels, byApi };
  }, [monthly]);

  // Build usage trend lines and cost trend from timeseries
  const tsLabels = useMemo(() => usageTs?.points?.map(p => {
    const s = p.t;
    // Show HH:MM for minute/hour buckets, or YYYY-MM-DD for day
    return usageTs?.bucket === 'day' ? s : s.slice(11,16);
  }) || [], [usageTs]);

  const usageLines = useMemo(() => {
    if (!usageTs) return null;
    const enabled = apis.filter(a => selectedApis[a]);
    const succ = usageTs.points.map(p => enabled.reduce((acc,a) => acc + (p.perApi[a]?.success||0), 0));
    const err = usageTs.points.map(p => enabled.reduce((acc,a) => acc + (p.perApi[a]?.error||0), 0));
    return { succ, err };
  }, [usageTs, selectedApis]);

  const costLine = useMemo(() => {
    if (!usageTs || !cost) return null;
    const enabled = apis.filter(a => selectedApis[a]);
    const includeErrors = !!cost.config.includeErrors;
    return usageTs.points.map(p => enabled.reduce((acc,a) => {
      const calls = (p.perApi[a]?.success||0) + (includeErrors ? (p.perApi[a]?.error||0) : 0);
      const rate = cost.snapshot.perApi[a]?.ratePerCallUSD || 0;
      return acc + calls * rate;
    }, 0));
  }, [usageTs, cost, selectedApis]);

  const shareData = useMemo(() => {
    const palette: Record<ApiKey,string> = { gemini: '#6366f1', maps: '#10b981', places: '#f59e0b' };
    if (shareMode === 'usage') {
      const vals = apis.filter(a=>selectedApis[a]).map(a => ({ label: a, value: totals?.[a].count || 0, color: palette[a] }));
      return vals;
    } else {
      const vals = apis.filter(a=>selectedApis[a]).map(a => ({ label: a, value: cost?.snapshot.perApi[a].costUSD || 0, color: palette[a] }));
      return vals;
    }
  }, [shareMode, totals, cost, selectedApis]);

  return (
    <div className="animate-fadeInUp">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold" style={{ color: Colors.text }}>API Insights</h1>
        <div className="flex items-center gap-3" style={card}>
          <label className="text-sm" style={{ color: Colors.text_secondary }}>Window</label>
          <select className="select" value={String(windowMinutes)} onChange={(e)=> {
            const val = e.target.value;
            if (val === 'custom') setWindowMinutes('custom'); else setWindowMinutes(parseInt(val,10));
          }}>
            <option value={30}>30 min</option>
            <option value={60}>1 hour</option>
            <option value={180}>3 hours</option>
            <option value={720}>12 hours</option>
            <option value={1440}>1 day</option>
            <option value={10080}>7 days</option>
            <option value={43200}>1 month</option>
            <option value={129600}>3 months</option>
            <option value={'custom'}>Custom…</option>
          </select>
          {windowMinutes === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" className="input" value={customSince} onChange={(e)=> setCustomSince(e.target.value)} />
              <span className="text-xs" style={{ color: Colors.text_secondary }}>to</span>
              <input type="date" className="input" value={customUntil} onChange={(e)=> setCustomUntil(e.target.value)} />
            </div>
          )}
          <div className="hidden md:flex items-center gap-2">
            {(apis as ApiKey[]).map(a => (
              <label key={a} className="text-xs flex items-center gap-1" style={{ color: Colors.text }}>
                <input type="checkbox" checked={!!selectedApis[a]} onChange={(e)=> setSelectedApis(prev => ({ ...prev, [a]: e.target.checked }))} /> {a}
              </label>
            ))}
          </div>
          <button className="btn btn-primary" onClick={refresh}>Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {apis.map(api => (
          <div key={api} style={card}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold capitalize" style={{ color: Colors.text }}>{api}</h3>
              {windowStats?.perApi?.[api] && (
                <span className="text-xs" style={{ color: Colors.text_secondary }}>p50 {windowStats.perApi[api].p50}ms · p95 {windowStats.perApi[api].p95}ms</span>
              )}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold" style={{ color: Colors.text }}>{totals?.[api].count ?? 0}</div>
                <div className="text-xs" style={{ color: Colors.text_secondary }}>Total</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{totals?.[api].success ?? 0}</div>
                <div className="text-xs" style={{ color: Colors.text_secondary }}>Success</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">{totals?.[api].error ?? 0}</div>
                <div className="text-xs" style={{ color: Colors.text_secondary }}>Errors</div>
              </div>
            </div>
            {dailySeries && (
              <div className="mt-2"><Spark points={dailySeries.byApi[api]} /></div>
            )}
            {cost && (
              <div className="mt-2 text-sm" style={{ color: Colors.text }}>
                Cost: <span className="font-semibold text-indigo-600">{currency(cost.snapshot.perApi[api].costUSD)}</span>
              </div>
            )}
          </div>
        ))}
        {cost && (
          <div style={card}>
            <div className="text-sm" style={{ color: Colors.text_secondary }}>Overall Cost</div>
            <div className="text-2xl font-bold text-indigo-700">{currency(cost.snapshot.totalCostUSD)}</div>
            <div className="text-xs mt-1" style={{ color: Colors.text_secondary }}>Projected Daily {currency(cost.window.projected.dailyUSD)} · Monthly {currency(cost.window.projected.monthlyUSD)}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div style={card}>
          <div className="text-sm font-semibold mb-2" style={{ color: Colors.text }}>Daily Calls (last 30d)</div>
          {dailySeries ? (
            <div className="space-y-2">
              {apis.map(api => (
                <div key={api} className="flex items-center gap-2">
                  <span className="text-xs w-16 capitalize" style={{ color: Colors.text_secondary }}>{api}</span>
                  <Spark points={dailySeries.byApi[api]} />
                </div>
              ))}
            </div>
          ) : <div className="text-sm" style={{ color: Colors.text_secondary }}>Loading…</div>}
        </div>

        <div style={card}>
          <div className="text-sm font-semibold mb-2" style={{ color: Colors.text }}>Monthly Calls (last 12mo)</div>
          {monthlySeries ? (
            <div className="space-y-2">
              {apis.map(api => (
                <div key={api} className="flex items-center gap-2">
                  <span className="text-xs w-16 capitalize" style={{ color: Colors.text_secondary }}>{api}</span>
                  <Spark points={monthlySeries.byApi[api]} />
                </div>
              ))}
            </div>
          ) : <div className="text-sm" style={{ color: Colors.text_secondary }}>Loading…</div>}
        </div>
      </div>

      {/* Real-time charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2" style={card}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold" style={{ color: Colors.text }}>Usage Trend</div>
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1" style={{ color: Colors.text }}>
                <input type="radio" name="usageView" checked={usageView==='all'} onChange={()=>setUsageView('all')} /> All
              </label>
              <label className="flex items-center gap-1" style={{ color: Colors.text }}>
                <input type="radio" name="usageView" checked={usageView==='success'} onChange={()=>setUsageView('success')} /> Success
              </label>
              <label className="flex items-center gap-1" style={{ color: Colors.text }}>
                <input type="radio" name="usageView" checked={usageView==='error'} onChange={()=>setUsageView('error')} /> Error
              </label>
            </div>
          </div>
          {usageLines && tsLabels.length > 0 ? (
            <LineChart labels={tsLabels} series={[
              ...(usageView === 'all' || usageView === 'success' ? [{ name: 'success', data: usageLines.succ, color: '#10b981' } as const] : []),
              ...(usageView === 'all' || usageView === 'error' ? [{ name: 'error', data: usageLines.err, color: '#ef4444' } as const] : []),
            ]} />
          ) : <div className="text-sm" style={{ color: Colors.text_secondary }}>No usage data for selected window.</div>}
        </div>
        <div style={card}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold" style={{ color: Colors.text }}>API Share</div>
            <div className="flex items-center gap-2 text-xs">
              <button className={`btn btn-xs ${shareMode==='usage'?'btn-primary':'btn-secondary'}`} onClick={()=>setShareMode('usage')}>Usage</button>
              <button className={`btn btn-xs ${shareMode==='cost'?'btn-primary':'btn-secondary'}`} onClick={()=>setShareMode('cost')}>Cost</button>
            </div>
          </div>
          {shareData ? (
            <div className="flex items-center gap-3">
              <PieChart values={shareData} />
              <div className="space-y-1 text-sm">
                {shareData.map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-sm" style={{ background: s.color }} />
                    <span style={{ color: Colors.text }}>{s.label}</span>
                    <span className="ml-auto font-semibold" style={{ color: Colors.text }}>{shareMode==='cost' ? currency(s.value) : s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="text-sm" style={{ color: Colors.text_secondary }}>No data</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div style={card}>
          <div className="text-sm font-semibold mb-2" style={{ color: Colors.text }}>Cost Trend</div>
          {costLine && tsLabels.length > 0 ? (
            <LineChart labels={tsLabels} series={[{ name: 'cost', data: costLine, color: '#6366f1' }]} />
          ) : <div className="text-sm" style={{ color: Colors.text_secondary }}>No cost data for selected window.</div>}
        </div>
        {/* Keep monthly summary for context */}
        <div style={card}>
          <div className="text-sm font-semibold mb-2" style={{ color: Colors.text }}>Window p50/p95 and Avg by API</div>
          {windowStats?.perApi ? (
            <div className="space-y-2 text-sm">
              {apis.map(a => (
                <div key={a} className="flex items-center gap-3">
                  <span className="w-16 capitalize" style={{ color: Colors.text_secondary }}>{a}</span>
                  <span style={{ color: Colors.text }}>p50 {windowStats.perApi[a]?.p50 ?? '-'} ms</span>
                  <span style={{ color: Colors.text }}>p95 {windowStats.perApi[a]?.p95 ?? '-'} ms</span>
                  <span style={{ color: Colors.text }}>avg {windowStats.perApi[a]?.avgMs?.toFixed?.(0) ?? '-' } ms</span>
                </div>
              ))}
            </div>
          ) : <div className="text-sm" style={{ color: Colors.text_secondary }}>Loading…</div>}
        </div>
      </div>

      <div style={card}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold" style={{ color: Colors.text }}>Recent Activity</div>
          <div className="text-xs" style={{ color: Colors.text_secondary }}>Window p50/p95 and avg from last {windowMinutes}m</div>
        </div>
        <div className="max-h-96 overflow-auto divide-y divide-gray-200/60">
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

export default AdminApiInsightsView;
