import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Briefcase, Armchair, Users, TrendingUp, ArrowRight, ArrowUpRight, MapPin } from 'lucide-react';
import { apiGet, errMsg } from '../../api/client';
import { SectionHeader, Spinner, Callout, StatCard, KV, Badge, fmtNum, fmtPct } from '../../components/ui';
import { HBar } from '../../components/charts';

export default function ProviderHome() {
  const nav = useNavigate();
  const [org, setOrg] = useState<any>(null);
  const [impact, setImpact] = useState<any[]>([]);
  const [cap, setCap] = useState<any[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [o, i, c] = await Promise.all([
          apiGet<any>('/providers/me'),
          apiGet<any>('/providers/me/impact'),
          apiGet<any>('/providers/me/capacity'),
        ]);
        setOrg(o); setImpact(i ?? []); setCap(c ?? []);
      } catch (e) { setErr(errMsg(e)); }
    })();
  }, []);

  if (!org && !err) return <Spinner label="Loading your organisation…" />;
  if (err && !org) return <Callout tone="danger">{err}</Callout>;

  const filled = impact.reduce((a, b) => a + b.allocated, 0);
  const unmet = impact.reduce((a, b) => a + b.unmetDemand, 0);
  const avgFit = impact.length > 0 ? impact.reduce((a, b) => a + b.avgSuitability * b.allocated, 0) / Math.max(1, filled) : 0;

  return (
    <div className="role-workspace partner-workspace">
      <header className="role-page-heading">
        <div><span className="section-kicker">ORGANISATION PARTNER / OVERVIEW</span><h1>Build your next team.</h1><p>Your opportunities, candidate demand, and allocation outcomes.</p></div>
        <button className="btn-primary" onClick={() => nav('/provider/opportunities')}><Briefcase size={16} />Manage opportunities<ArrowUpRight size={15} /></button>
      </header>
      <div className="partner-overview-layout">
        <aside className="organisation-passport">
          <div className="organisation-monogram"><Building2 size={33} strokeWidth={1.3} /></div>
          <span className="section-kicker">YOUR ORGANISATION</span>
          <h2>{org.orgName}</h2><p>{org.about || 'Manage your internship programme and the people joining it.'}</p>
          <div className="organisation-detail"><MapPin size={15} />{org.state}</div>
          <div className="organisation-detail"><Building2 size={15} />{org.orgType}</div>
          <button onClick={() => nav('/provider/opportunities')} className="passport-action">Manage your openings<ArrowRight size={16} /></button>
          <small>Demonstration organisation · Synthetic data</small>
        </aside>
        <div className="partner-overview-main">
          <div className="role-stat-strip">
            <div><span>OPEN OPPORTUNITIES</span><strong>{fmtNum(org.activeCount)}</strong><small>{fmtNum(org.opportunityCount)} total openings</small></div>
            <div><span>SEATS IN YOUR PROGRAMME</span><strong>{fmtNum(org.totalSeats)}</strong><small>{fmtNum(filled)} allocated in the latest run</small></div>
            <div><span>ALLOCATED CANDIDATE FIT</span><strong>{filled ? fmtPct(avgFit) : '—'}</strong><small>{filled ? 'Weighted average suitability' : 'Awaiting allocation outcomes'}</small></div>
          </div>
          <section className="role-panel">
            <div className="role-panel-heading"><div><span className="section-kicker">CAPACITY & DEMAND</span><h2>Where your seats matter.</h2></div><span className="role-subtle-tag">{fmtNum(cap.length)} opportunities</span></div>
            {cap.length ? <div className="capacity-directory">{cap.map(item => (
              <div className="capacity-line" key={item.opportunityId}>
                <div><strong>{item.title}</strong><small>{fmtNum(item.eligible)} eligible candidates · {fmtNum(item.capacity)} seats</small></div>
                <div className="capacity-track"><span style={{ width: Math.min(100, item.capacity ? item.eligible / item.capacity * 100 : 0) + '%' }} /></div>
                <Badge tone={item.pressure >= 2 ? 'red' : item.pressure >= 1 ? 'amber' : 'green'}>{item.pressure.toFixed(1)}× demand</Badge>
              </div>
            ))}</div> : <div className="role-empty">Publish an opportunity to see seat capacity and eligible demand.</div>}
            <div className="panel-footnote">Demand counts eligible candidates per opportunity. A candidate can be eligible for several openings.</div>
          </section>
          <section className="role-panel">
            <div className="role-panel-heading"><div><span className="section-kicker">ALLOCATION IMPACT</span><h2>Follow your programme’s outcomes.</h2></div><span className="role-subtle-tag">{fmtNum(unmet)} unmet demand across opportunities</span></div>
            {impact.length ? <div className="overflow-x-auto"><table className="role-data-table"><thead><tr><th>Opportunity</th><th>Seats</th><th>Allocated</th><th>Unmet demand</th><th>Average fit</th></tr></thead><tbody>{impact.map(item => (
              <tr key={item.opportunityId}><td>{item.title}</td><td>{fmtNum(item.capacity)}</td><td><Badge tone={item.allocated ? 'green' : 'gray'}>{fmtNum(item.allocated)}</Badge></td><td>{fmtNum(item.unmetDemand)}</td><td>{item.allocated ? fmtPct(item.avgSuitability) : '—'}</td></tr>
            ))}</tbody></table></div> : <div className="role-empty">Allocation outcomes will appear here after a round includes your opportunities.</div>}
          </section>
        </div>
      </div>
    </div>
  );
}
