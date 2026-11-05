'use client';

import { useState } from 'react';
import example from '../example.json';

const sections = [
  { title: 'Opportunities', fields: ['Opportunity', 'Seats'], blank: ['', '1'] },
  { title: 'Eligible matches', fields: ['Candidate', 'Opportunity', 'Score', 'Groups (comma separated)'], blank: ['', '', '0', ''] },
  { title: 'Group minimums', fields: ['Group', 'Minimum'], blank: ['', '0'] },
];

function sample() {
  return [
    Object.entries(example.capacities),
    example.eligible_matches.map(m => [m.candidate, m.opportunity, m.score, m.groups.join(', ')]),
    Object.entries(example.minimums),
  ];
}

function pairs(rows) {
  const entries = rows.map(([name, value]) => {
    if (!name.trim() || !/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value))) {
      throw Error('Enter unique names and nonnegative integer seat counts and minimums.');
    }
    return [name.trim(), Number(value)];
  });
  if (new Set(entries.map(([name]) => name)).size !== entries.length) throw Error('Names must be unique within each section.');
  return Object.fromEntries(entries);
}

export default function Studio() {
  const [tables, setTables] = useState(sample);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState(0);
  const [token, setToken] = useState('');
  const [history, setHistory] = useState([]);

  async function refreshHistory() {
    try {
      const response = await fetch('/api/rounds', { headers: { Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(10000) });
      const data = await response.json();
      if (!response.ok) throw Error(typeof data.detail === 'string' ? data.detail : 'Could not load history.');
      setHistory(data);
      setError('');
    } catch (failure) {
      setError(failure.message);
    }
  }
  const section = sections[tab];

  function change(rows) {
    setTables(tables.map((table, index) => index === tab ? rows : table));
    setResult(null);
    setError('');
  }

  async function solve() {
    setBusy(true);
    setResult(null);
    setError('');
    try {
      const capacities = pairs(tables[0]);
      const minimums = pairs(tables[2]);
      const eligible_matches = tables[1].map(([candidate, opportunity, score, groups]) => {
        if (!candidate.trim() || !Object.hasOwn(capacities, opportunity.trim()) ||
            !/^-?\d+$/.test(String(score)) || !Number.isSafeInteger(Number(score))) {
          throw Error('Each match needs a candidate, an existing opportunity, and an integer score.');
        }
        return { candidate: candidate.trim(), opportunity: opportunity.trim(), score: Number(score),
          groups: groups.split(',').map(group => group.trim()).filter(Boolean) };
      });
      const response = await fetch('/api/allocate', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ capacities, eligible_matches, minimums }),
        signal: AbortSignal.timeout(30000),
      });
      if (response.status >= 500) throw Error('The solver service is unavailable. Try again shortly.');
      const data = await response.json();
      if (!response.ok) throw Error(data.error || (typeof data.detail === 'string' ? data.detail : 'Check the scenario inputs and try again.'));
      setResult(data); await refreshHistory();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return <main>
    <header><strong><i>◈</i> AllocateAI</strong><span>OPERATIONS WORKSPACE</span></header>
    <section className="hero"><small>ALLOCATION / ROUND BUILDER</small><h1>Internship allocation</h1><p>Configure seats, eligible matches, and group minimums. Review the solver’s proposed assignments before using them.</p></section>
    <div className="metrics">{sections.map((item, index) => <div key={item.title}><small>{item.title}</small><b>{tables[index].length}</b></div>)}</div>
    <div className="workspace">
      <section className="card"><h2>Round inputs</h2>
        <nav aria-label="Round inputs">{sections.map((item, index) => <button key={item.title} aria-pressed={tab === index} onClick={() => setTab(index)}>{item.title}</button>)}</nav>
        <fieldset disabled={busy}><div className="scroll"><table><thead><tr>{section.fields.map(field => <th key={field}>{field}</th>)}<th>Action</th></tr></thead>
          <tbody>{tables[tab].map((row, index) => <tr key={index}>{row.map((value, column) => <td key={column}><input aria-label={section.fields[column] + ' row ' + (index + 1)} value={value} onChange={event => change(tables[tab].map((current, rowIndex) => rowIndex === index ? current.map((cell, colIndex) => colIndex === column ? event.target.value : cell) : current))}/></td>)}<td><button aria-label={'Remove row ' + (index + 1)} onClick={() => change(tables[tab].filter((_, rowIndex) => rowIndex !== index))}>Remove</button></td></tr>)}</tbody>
        </table></div><div className="actions"><button onClick={() => change([...tables[tab], section.blank])}>+ Add row</button><button onClick={() => { setTables(sample()); setResult(null); setError(''); }}>Reset example</button></div></fieldset>
      </section>
      <section className="card"><small>CP-SAT SOLVER</small><h2>Assignment results</h2><label>Operator access token<input type="password" value={token} onChange={event => { setToken(event.target.value); setHistory([]); setResult(null); }} disabled={busy} /></label><div className="actions"><button onClick={refreshHistory} disabled={!token || busy}>Load recent rounds</button></div><button className="primary" disabled={busy || !token} onClick={solve}>{busy ? 'Solving…' : 'Run allocation'}</button>
        <p role="status">{error || (result ? result.status === 'INFEASIBLE' ? 'Infeasible. No assignment satisfies all configured constraints.' : result.status + ' · ' + result.assignments.length + ' placements' : 'Run this round to see proposed assignments.')}</p>
        {!!result?.assignments.length && <table><thead><tr><th>Candidate</th><th>Opportunity</th></tr></thead><tbody>{result.assignments.map(row => <tr key={row.candidate}><td>{row.candidate}</td><td>{row.opportunity}</td></tr>)}</tbody></table>}
      </section>
    </div>
    {history.length > 0 && <section className="card"><h2>Recent rounds</h2><table><thead><tr><th>Run</th><th>Status</th><th>Placements</th></tr></thead><tbody>{history.map(round => <tr key={round.id}><td><button onClick={() => setResult(round)}>{round.created_at}</button></td><td>{round.status}</td><td>{round.assignments.length}</td></tr>)}</tbody></table></section>}
  </main>;
}
