import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, Play, Users, SlidersHorizontal, GitBranch, Database, CheckCircle2, History, FileCheck2 } from 'lucide-react';
import { apiGet, apiPost, errMsg } from '../../api/client';
import { Overview, RunSummary, PolicyPreset } from '../../api/types';
import { Badge, Callout, Spinner, fmtNum, fmtPct, fmtMs, statusTone } from '../../components/ui';

export default function AdminOverview() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [policies, setPolicies] = useState<PolicyPreset[]>([]);
  const [policyKey, setPolicyKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      apiGet<Overview>('/admin/overview'),
      apiGet<any>('/admin/runs', { page: 0, size: 5 }),
      apiGet<PolicyPreset[]>('/admin/policies'),
    ]).then(([data, history, presets]) => {
      if (!active) return;
      setOverview(data);
      setRuns(history.content ?? []);
      setPolicies(presets);
      setPolicyKey((presets.find(policy => policy.isDefault) ?? presets[0])?.key ?? '');
    }).catch(failure => { if (active) setError(errMsg(failure)); });
    return () => { active = false; };
  }, []);

  async function startAllocation() {
    setBusy(true);
    setError('');
    try {
      const run = await apiPost<{ id: number }>('/admin/runs', { policyKey });
      navigate('/admin/runs/' + run.id);
    } catch (failure) {
      setError(errMsg(failure));
      setBusy(false);
    }
  }

  if (!overview) return error
    ? <Callout tone="danger" title="Unable to open the workspace">{error}</Callout>
    : <Spinner label="Loading allocation workspace…" />;

  const policy = policies.find(item => item.key === policyKey);
  const allocation = overview.allocation;
  const readinessTotal = overview.readiness.ready + overview.readiness.partial + overview.readiness.incomplete;
  const readinessShare = readinessTotal ? overview.readiness.ready / readinessTotal * 100 : 0;

  return (
    <div className="allocation-room">
      <div className="room-introduction">
        <div><span className="section-kicker">OPERATIONS / ALLOCATION</span><h1>Build the next round.</h1><p>One workspace to prepare, allocate, and review.</p></div>
        <Link to="/admin/runs" className="text-action"><History size={16} />All allocation runs<ArrowUpRight size={15} /></Link>
      </div>
      {error && <Callout tone="danger">{error}</Callout>}
      <div className="room-layout">
        <div className="room-main">
          <section className="flow-workspace">
            <div className="flow-title"><div><span className="section-kicker">ALLOCATION FLOW</span><h2>From candidate to opportunity</h2></div><span className="flow-status">Ready to configure</span></div>
            <div className="allocation-flow">
              <Link to="/admin/verification" className="flow-node">
                <div className="node-heading"><span>01 / PREPARE</span><ArrowUpRight size={16} /></div>
                <div className="node-icon"><Users size={26} /></div>
                <h3>Candidate pool</h3><strong>{fmtNum(overview.scenario?.candidateCount)}</strong><p>profiles in this dataset</p>
                <div className="node-bottom"><FileCheck2 size={14} />Review eligibility evidence</div>
              </Link>
              <span className="flow-connector" aria-hidden="true"><ArrowRight size={18} /></span>
              <Link to="/admin/whatif" className="flow-node policy-node">
                <div className="node-heading"><span>02 / CONSTRAIN</span><ArrowUpRight size={16} /></div>
                <div className="node-icon"><SlidersHorizontal size={26} /></div>
                <h3>Policy & capacity</h3><strong>{fmtNum(overview.scenario?.seatCount)}</strong><p>seats across {fmtNum(overview.scenario?.opportunityCount)} opportunities</p>
                <div className="node-bottom"><CheckCircle2 size={14} />Inspect the allocation policy</div>
              </Link>
              <span className="flow-connector" aria-hidden="true"><ArrowRight size={18} /></span>
              <Link to={overview.latestRun ? '/admin/runs/' + overview.latestRun.id : '/admin/runs'} className="flow-node result-node">
                <div className="node-heading"><span>03 / REVIEW</span><ArrowUpRight size={16} /></div>
                <div className="node-icon"><GitBranch size={26} /></div>
                <h3>Allocation result</h3><strong>{allocation ? fmtNum(allocation.allocated) : '—'}</strong><p>{allocation ? 'placements in the latest outcome' : 'Start a run to create your first result'}</p>
                <div className="node-bottom">{overview.latestRun ? <Badge tone={statusTone(overview.latestRun.status)}>{overview.latestRun.status}</Badge> : 'Awaiting the first run'}</div>
              </Link>
            </div>
            <div className="readiness-ribbon">
              <div><span className="section-kicker">POOL READINESS</span><strong>{fmtPct(overview.readiness.average)}<small>average profile score</small></strong></div>
              <div className="readiness-meter">
                <div><span>{fmtNum(overview.readiness.ready)} ready</span><span>{fmtNum(overview.readiness.partial)} partial · {fmtNum(overview.readiness.incomplete)} incomplete</span></div>
                <div className="meter-track" role="img" aria-label={readinessShare.toFixed(1) + '% of profiles ready'}><span style={{ width: readinessShare + '%' }} /></div>
              </div>
            </div>
          </section>
          <section className="run-ledger">
            <div className="ledger-heading"><div><span className="section-kicker">ACTIVITY</span><h2>Recent rounds</h2></div><Link to="/admin/runs" className="text-action">View history<ArrowRight size={15} /></Link></div>
            {runs.length ? runs.map(run => (
              <Link to={'/admin/runs/' + run.id} className="ledger-entry" key={run.id}>
                <span className="ledger-run-number">#{run.number}</span>
                <div><strong>{run.scenario}</strong><small>{run.policyName} · {fmtMs(run.totalRuntimeMs)}</small></div>
                <Badge tone={statusTone(run.status)} dot>{run.status}</Badge><ArrowUpRight size={16} />
              </Link>
            )) : <div className="ledger-empty"><History size={28} /><div><strong>No allocation rounds yet</strong><p>Select a policy in the launch panel to start your first run.</p></div></div>}
          </section>
        </div>
        <aside className="round-controls" aria-label="Allocation launch settings">
          <div className="control-heading"><span className="section-kicker">LAUNCH PANEL</span><span className="round-indicator" /></div>
          <h2>Your next <br />allocation.</h2>
          <label className="control-label">ACTIVE DATASET</label>
          <div className="dataset-control"><Database size={18} /><div><strong>{overview.scenario?.name ?? 'No dataset'}</strong><small>Version {overview.scenario?.version ?? '—'} · Synthetic</small></div><Link to="/admin/scenarios" aria-label="Change active dataset"><ArrowUpRight size={17} /></Link></div>
          <label className="control-label" htmlFor="round-policy">ALLOCATION POLICY</label>
          <select id="round-policy" value={policyKey} onChange={event => setPolicyKey(event.target.value)} disabled={busy}>{policies.map(item => <option key={item.key} value={item.key}>{item.name}</option>)}</select>
          <p className="policy-description">{policy?.description ?? 'Choose a policy to configure the run.'}</p>
          <dl className="policy-summary"><div><dt>Full coverage</dt><dd>{policy?.fullCoverage ? 'Required' : 'Optional'}</dd></div><div><dt>Fairness floor</dt><dd>{policy?.fairnessFloorPct == null ? 'Not configured' : policy.fairnessFloorPct + '%'}</dd></div><div><dt>Policy version</dt><dd>{policy?.version ?? '—'}</dd></div></dl>
          <button className="room-launch" onClick={startAllocation} disabled={busy || !policyKey || !overview.scenario}><Play size={17} />{busy ? 'Starting…' : 'Run allocation'}<ArrowRight size={17} /></button>
          <p className="launch-note">Creates a new run with the selected policy and current dataset.</p>
          <Link to="/admin/whatif" className="control-policy-link">Compare policies in the lab<ArrowUpRight size={14} /></Link>
        </aside>
      </div>
      <div className="room-utilities"><span>CONTINUE YOUR WORK</span><Link to="/admin/verification">Verification queue<ArrowUpRight size={14} /></Link><Link to="/admin/reallocation">Reallocation studio<ArrowUpRight size={14} /></Link><Link to="/admin/audit">Audit trail<ArrowUpRight size={14} /></Link></div>
    </div>
  );
}

