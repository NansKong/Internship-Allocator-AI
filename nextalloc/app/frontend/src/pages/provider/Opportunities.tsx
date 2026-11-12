import React, { useEffect, useState } from 'react';
import { Plus, Pencil, CheckCircle2, PauseCircle, XCircle, Star, Users, Award, Check, Search, Briefcase, MapPin, ArrowUpRight } from 'lucide-react';
import { apiGet, apiPost, apiPut, apiPatch, errMsg } from '../../api/client';
import { SectionHeader, Spinner, Callout, Badge, Modal, fmtNum, fmtTime } from '../../components/ui';
import { ProviderOffer } from '../../api/types';

const SECTOR_OPTIONS: [string, string][] = [
  ['SOFTWARE_IT', 'Software & IT'], ['DATA_ANALYTICS', 'Data & Analytics'], ['FINANCE_BANKING', 'Finance & Banking'],
  ['DESIGN_MEDIA', 'Design & Media'], ['MARKETING_COMMUNICATION', 'Marketing & Communication'],
  ['PUBLIC_ADMIN_POLICY', 'Public Administration & Policy'], ['HEALTHCARE_BIOTECH', 'Healthcare & Biotech'],
  ['MANUFACTURING_OPERATIONS', 'Manufacturing & Operations'], ['RESEARCH_DEVELOPMENT', 'Research & Development'],
  ['ENVIRONMENTAL_ENERGY', 'Environmental & Energy'],
];
// Labels must match backend Labels.java exactly — candidates see the same wording everywhere.
const QUALS: [string, string][] = [['HIGHER_SECONDARY', 'Higher Secondary'], ['BACHELORS', "Bachelor's Degree"], ['POST_GRADUATE', 'Postgraduate'], ['DOCTORAL', 'Doctoral']];
const STATES = ['Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Gujarat', 'Haryana', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];

const BLANK = { title: '', sector: '', state: '', city: '', capacity: 5, durationMonths: 3, minQualification: 'BACHELORS', description: '', mandatorySkills: '' as string | never[], niceSkills: '' as string | never[] };

// The API returns human labels ("Software & IT", "Bachelor's Degree"); the
// form selects speak enum values. Map both directions so editing never resets a field.
const SECTOR_BY_LABEL: Record<string, string> = Object.fromEntries(SECTOR_OPTIONS.map(([v, l]) => [l, v]));
const QUAL_BY_LABEL: Record<string, string> = Object.fromEntries(QUALS.map(([v, l]) => [l, v]));
const QUAL_LABEL: Record<string, string> = Object.fromEntries(QUALS.map(([v, l]) => [v, l]));
const SECTOR_LABEL: Record<string, string> = Object.fromEntries(SECTOR_OPTIONS.map(([v, l]) => [v, l]));

export default function ProviderOpportunities() {
  const [rows, setRows] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<any>(BLANK);
  const [busy, setBusy] = useState(false);

  // Offers and joining lifecycle state
  const [selectedOppForOffers, setSelectedOppForOffers] = useState<any | null>(null);
  const [offersList, setOffersList] = useState<ProviderOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [joiningBusy, setJoiningBusy] = useState<number | null>(null);
  const [offersMsg, setOffersMsg] = useState('');
  const [offersErr, setOffersErr] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const d = await apiGet<any>('/providers/me/opportunities', { page: 0, size: 50 });
      setRows(d.content ?? []);
    } catch (e) { setErr(errMsg(e)); }
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const openNew = () => { setForm({ ...BLANK }); setIsNew(true); setEditing({}); };
  const openEdit = (o: any) => {
    setForm({
      title: o.title,
      sector: SECTOR_BY_LABEL[o.sector] ?? o.sector,
      state: o.state, city: o.city ?? '', capacity: o.capacity,
      durationMonths: o.durationMonths,
      minQualification: QUAL_BY_LABEL[o.minQualification] ?? o.minQualification,
      description: o.description ?? '',
      mandatorySkills: Array.isArray(o.mandatorySkills) ? o.mandatorySkills.join(', ') : (o.mandatorySkills ?? ''),
      niceSkills: Array.isArray(o.niceSkills) ? o.niceSkills.join(', ') : (o.niceSkills ?? ''),
    });
    setIsNew(false); setEditing(o);
  };

  const save = async () => {
    setBusy(true); setErr(''); setMsg('');
    const body = {
      title: form.title, sector: form.sector, state: form.state, city: form.city || null,
      capacity: Number(form.capacity), durationMonths: Number(form.durationMonths),
      minQualification: form.minQualification, description: form.description,
      mandatorySkills: String(form.mandatorySkills).split(',').map(s => s.trim()).filter(Boolean),
      niceSkills: String(form.niceSkills).split(',').map(s => s.trim()).filter(Boolean),
    };
    try {
      if (isNew) await apiPost('/providers/me/opportunities', body);
      else await apiPut(`/providers/me/opportunities/${editing.id}`, body);
      setMsg(isNew ? 'Opportunity published.' : 'Opportunity updated.');
      setEditing(null); await load();
    } catch (e) { setErr(errMsg(e)); }
    setBusy(false);
  };

  const setStatus = async (id: number, status: string) => {
    const verb: Record<string, string> = { ACTIVE: 'reopened', PAUSED: 'paused — hidden from candidates', CLOSED: 'closed' };
    try { await apiPatch(`/providers/me/opportunities/${id}/status`, { status }); setMsg(`Opportunity ${verb[status] ?? status.toLowerCase()}.`); await load(); }
    catch (e) { setErr(errMsg(e)); }
  };

  const upd = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const openOffers = async (opp: any) => {
    setSelectedOppForOffers(opp);
    setOffersLoading(true);
    setOffersErr('');
    setOffersMsg('');
    try {
      const data = await apiGet<ProviderOffer[]>(`/providers/me/opportunities/${opp.id}/offers`);
      setOffersList(data ?? []);
    } catch (e) {
      setOffersErr(errMsg(e));
    } finally {
      setOffersLoading(false);
    }
  };

  const handleConfirmJoining = async (offerId: number) => {
    setJoiningBusy(offerId);
    setOffersErr('');
    setOffersMsg('');
    try {
      const updated = await apiPost<ProviderOffer>(`/providers/me/offers/${offerId}/join`, {});
      setOffersList(prev => prev.map(o => o.id === offerId ? updated : o));
      setOffersMsg('Candidate joining successfully confirmed.');
      await load();
    } catch (e) {
      setOffersErr(errMsg(e));
    } finally {
      setJoiningBusy(null);
    }
  };

  const visibleRows = rows.filter(item =>
    (statusFilter === '' || item.status === statusFilter) &&
    (item.title + ' ' + item.sector + ' ' + item.state).toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div className="role-workspace partner-opportunities">
      <header className="role-page-heading">
        <div>
          <span className="section-kicker">ORGANISATION PARTNER / OPPORTUNITIES</span><h1>Manage your openings.</h1>
          <p className="mt-1 text-[13.5px] text-navy-500">Publish, update, open, pause or close the internships your organisation offers.</p>
        </div>
        <button className="btn-primary" onClick={openNew}><Plus className="h-4 w-4" /> New opportunity</button>
      </header>
      {err && <Callout tone="warn">{err}</Callout>}
      {msg && <Callout tone="success">{msg}</Callout>}

      <div className="openings-toolbar">
        <div className="opening-search"><Search size={16} /><input aria-label="Search your openings" placeholder="Search title, sector, or state…" value={query} onChange={event => setQuery(event.target.value)} /></div>
        <select aria-label="Opportunity status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="">All statuses</option><option value="Active">Active</option><option value="Paused">Paused</option><option value="Closed">Closed</option></select>
        <span>{visibleRows.length} of {rows.length} loaded openings</span>
      </div>
      {loading ? <Spinner label="Loading opportunities…" /> : visibleRows.length === 0 ? (
        <div className="role-panel role-empty">{rows.length ? 'No openings match this search.' : 'Publish your first internship to begin building your programme.'}</div>
      ) : (
        <div className="opening-directory">
          {visibleRows.map(item => (
            <article className="opening-card" key={item.id}>
              <header><span className="opening-card-icon"><Briefcase size={22} strokeWidth={1.5} /></span><div><span className="section-kicker">{item.sector}</span><h2>{item.title}</h2></div><Badge tone={item.status === 'Active' ? 'green' : item.status === 'Paused' ? 'amber' : 'gray'} dot>{item.status}</Badge></header>
              <p className="opening-location"><MapPin size={13} />{item.city ? item.city + ', ' : ''}{item.state}<span>·</span>{item.durationMonths} months</p>
              <div className="opening-numbers"><div><strong>{fmtNum(item.capacity)}</strong><span>Seats</span></div><div><strong>{fmtNum(item.eligibleCount)}</strong><span>Eligible</span></div><div><strong>{fmtNum(item.preferenceCount)}</strong><span>Preferences</span></div><div><strong>{fmtNum(item.allocatedCount)}</strong><span>Allocated</span></div></div>
              <div className="opening-qualification"><span>Minimum qualification</span><strong>{item.minQualification}</strong></div>
              <footer><button className="opening-primary-action" onClick={() => openOffers(item)}><Award size={15} />Offers & joining<ArrowUpRight size={14} /></button><button className="btn-ghost btn-sm" onClick={() => openEdit(item)} aria-label={'Edit ' + item.title}><Pencil size={13} />Edit</button>
                {item.status === 'Active' && <button className="opening-status-action" onClick={() => setStatus(item.id, 'PAUSED')} aria-label={'Pause ' + item.title}><PauseCircle size={14} />Pause</button>}
                {item.status === 'Paused' && <button className="opening-status-action" onClick={() => setStatus(item.id, 'ACTIVE')} aria-label={'Reopen ' + item.title}><CheckCircle2 size={14} />Reopen</button>}
                {item.status !== 'Closed' && <button className="opening-status-action" onClick={() => setStatus(item.id, 'CLOSED')} aria-label={'Close ' + item.title}><XCircle size={14} />Close</button>}
              </footer>
            </article>
          ))}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={isNew ? 'New opportunity' : 'Edit opportunity'} wide>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label" htmlFor="opening-title">Title</label>
            <input id="opening-title" className="input" value={form.title} onChange={e => upd('title', e.target.value)} placeholder="e.g. Data Analytics Intern" />
            <p className="mt-1 text-[11.5px] text-navy-400">This is what candidates see when searching internships.</p>
          </div>
          <div>
            <label className="label" htmlFor="opening-sector">Sector</label>
            <select id="opening-sector" className="input" value={form.sector} onChange={e => upd('sector', e.target.value)}>
              <option value="">Select…</option>{SECTOR_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <p className="mt-1 text-[11.5px] text-navy-400">Used for candidate interest matching and sector reports.</p>
          </div>
          <div>
            <label className="label" htmlFor="opening-qualification">Minimum qualification</label>
            <select id="opening-qualification" className="input" value={form.minQualification} onChange={e => upd('minQualification', e.target.value)}>
              {QUALS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <p className="mt-1 text-[11.5px] text-navy-400">Candidates below this level are not eligible — the engine enforces it.</p>
          </div>
          <div>
            <label className="label" htmlFor="opening-state">State</label>
            <select id="opening-state" className="input" value={form.state} onChange={e => upd('state', e.target.value)}>
              <option value="">Select…</option>{STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <p className="mt-1 text-[11.5px] text-navy-400">Where the internship is based — used for location fit and geography views.</p>
          </div>
          <div><label className="label" htmlFor="opening-city">City / district</label><input id="opening-city" className="input" value={form.city} onChange={e => upd('city', e.target.value)} /></div>
          <div>
            <label className="label" htmlFor="opening-seats">Seats (capacity)</label>
            <input id="opening-seats" className="input" type="number" min={1} max={200} value={form.capacity} onChange={e => upd('capacity', e.target.value)} />
            <p className="mt-1 text-[11.5px] text-navy-400">Maximum number of candidates this internship can take in one allocation.</p>
          </div>
          <div>
            <label className="label" htmlFor="opening-duration">Duration (months)</label>
            <input id="opening-duration" className="input" type="number" min={1} max={24} value={form.durationMonths} onChange={e => upd('durationMonths', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="opening-required-skills">Required skills (comma-separated)</label>
            <input id="opening-required-skills" className="input" value={form.mandatorySkills} onChange={e => upd('mandatorySkills', e.target.value)} placeholder="e.g. Python, SQL" />
            <p className="mt-1 text-[11.5px] text-navy-400">Candidates must have <em>all</em> of these verified skills, or they are not eligible for this internship.</p>
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="opening-preferred-skills">Preferred skills (comma-separated, optional)</label>
            <input id="opening-preferred-skills" className="input" value={form.niceSkills} onChange={e => upd('niceSkills', e.target.value)} placeholder="e.g. Power BI, Statistics" />
            <p className="mt-1 text-[11.5px] text-navy-400">Not mandatory — candidates who have these score higher on fit.</p>
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea className="input min-h-[90px]" value={form.description} onChange={e => upd('description', e.target.value)} placeholder="What will the intern work on? What will they learn?" />
          </div>
        </div>

        {/* What candidates will see */}
        {form.title && (
          <div className="mt-5 rounded-xl border border-navy-100 bg-navy-50/40 p-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-navy-400">What candidates will see</div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[14.5px] font-bold text-ink">{form.title}</div>
                <div className="mt-0.5 text-[12px] text-navy-500">
                  {SECTOR_LABEL[form.sector] ?? '—'} · {form.city ? form.city + ', ' : ''}{form.state || '—'} · {form.capacity} seats · {form.durationMonths} months
                </div>
              </div>
              <div className="text-right text-[11.5px] text-navy-400">Min qualification: {QUAL_LABEL[form.minQualification] ?? '—'}</div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {String(form.mandatorySkills).split(',').map(s => s.trim()).filter(Boolean).map(s => (
                <span key={'m' + s} className="chip bg-navy-100/70 text-navy-700 ring-1 ring-navy-200">{s} · required</span>
              ))}
              {String(form.niceSkills).split(',').map(s => s.trim()).filter(Boolean).map(s => (
                <span key={'n' + s} className="chip bg-saffron-50 text-saffron-700 ring-1 ring-saffron-100">{s} · preferred</span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={busy || !form.title || !form.sector || !form.state}>{busy ? 'Saving…' : isNew ? 'Publish' : 'Save changes'}</button>
        </div>
      </Modal>

      <Modal
        open={!!selectedOppForOffers}
        onClose={() => setSelectedOppForOffers(null)}
        title={`Allocated Candidates & Offers: ${selectedOppForOffers?.title ?? ''}`}
        wide
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-100 pb-3">
            <div className="text-xs text-navy-500">
              Capacity: <span className="font-semibold text-ink">{selectedOppForOffers?.capacity ?? 0} seats</span> · Duration: <span className="font-semibold text-ink">{selectedOppForOffers?.durationMonths ?? 0} months</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="chip bg-leaf-50 text-leaf-700 ring-1 ring-leaf-200 text-xs">
                {offersList.filter(o => o.status === 'JOINED' || o.status === 'ACCEPTED').length} / {selectedOppForOffers?.capacity ?? 0} seats active
              </span>
            </div>
          </div>

          {offersErr && <Callout tone="danger">{offersErr}</Callout>}
          {offersMsg && <Callout tone="success">{offersMsg}</Callout>}

          {offersLoading ? (
            <Spinner label="Loading candidate offers…" />
          ) : offersList.length === 0 ? (
            <div className="py-8 text-center text-xs text-navy-400">
              No candidates have been allocated to this opportunity in recent runs yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy-100">
                    <th className="th">Candidate</th>
                    <th className="th">Qualification</th>
                    <th className="th">Offer Status</th>
                    <th className="th">Timestamps</th>
                    <th className="th text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {offersList.map(o => (
                    <tr key={o.id} className="border-b border-navy-50 last:border-0">
                      <td className="td font-medium text-ink">
                        {o.candidateName || `Candidate #${o.candidateId}`}
                      </td>
                      <td className="td text-xs text-navy-500">
                        {o.qualification || '—'}
                      </td>
                      <td className="td">
                        <Badge
                          tone={
                            o.status === 'JOINED' ? 'green' :
                            o.status === 'ACCEPTED' ? 'leaf' :
                            o.status === 'OFFERED' ? 'amber' :
                            o.status === 'DECLINED' ? 'red' : 'gray'
                          }
                          dot
                        >
                          {o.status}
                        </Badge>
                      </td>
                      <td className="td text-[11px] text-navy-400">
                        <div>Offered: {fmtTime(o.offeredAt)}</div>
                        {o.respondedAt && <div>Responded: {fmtTime(o.respondedAt)}</div>}
                        {o.joinedAt && <div className="text-emerald-600 font-medium">Joined: {fmtTime(o.joinedAt)}</div>}
                      </td>
                      <td className="td text-right">
                        {o.status === 'ACCEPTED' && (
                          <button
                            className="btn-primary btn-sm"
                            disabled={joiningBusy === o.id}
                            onClick={() => handleConfirmJoining(o.id)}
                            title="Confirm candidate has reported and joined"
                          >
                            <Check className="h-3.5 w-3.5" /> Confirm Joining
                          </button>
                        )}
                        {o.status === 'JOINED' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" /> Joined
                          </span>
                        )}
                        {o.status === 'OFFERED' && (
                          <span className="text-xs text-navy-400 italic">Awaiting candidate</span>
                        )}
                        {o.status === 'DECLINED' && (
                          <span className="text-xs text-red-500 italic">Declined</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button className="btn-ghost" onClick={() => setSelectedOppForOffers(null)}>
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

