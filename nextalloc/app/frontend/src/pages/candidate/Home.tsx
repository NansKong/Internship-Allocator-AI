import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, MapPin, Briefcase, CheckCircle2, Sparkles, ArrowRight,
  Clock, PartyPopper, Hourglass, ListChecks, Target, FlaskConical, Lightbulb,
  ShieldCheck, FileText, Building2, Award,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { apiGet, apiPost, errMsg } from '../../api/client';
import { CandidateAllocation, Readiness, Recommendation, CandidateAcademicDto, NocEvidenceDto, CandidateOffer } from '../../api/types';
import { SectionHeader, Spinner, Callout, Badge, fmtNum, fmtTime } from '../../components/ui';
import { ScoreRing } from '../../components/ScoreRing';

export default function CandidateHome() {
  const { me } = useAuth();
  const nav = useNavigate();
  const [alloc, setAlloc] = useState<CandidateAllocation | null>(null);
  const [ready, setReady] = useState<Readiness | null>(null);
  const [actions, setActions] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [academic, setAcademic] = useState<CandidateAcademicDto | null>(null);
  const [noc, setNoc] = useState<NocEvidenceDto | null>(null);
  const [offers, setOffers] = useState<CandidateOffer[]>([]);
  const [actionMsg, setActionMsg] = useState('');
  const [actionBusy, setActionBusy] = useState<number | null>(null);
  const [err, setErr] = useState('');

  const loadOffers = async () => {
    try {
      const o = await apiGet<CandidateOffer[]>('/candidates/me/offers');
      setOffers(o ?? []);
    } catch {
      setOffers([]);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [a, d, h, r, acad, myNoc, myOffers] = await Promise.all([
          apiGet<CandidateAllocation>('/candidates/me/allocation'),
          apiGet<any>('/candidates/me/dashboard'),
          apiGet<any>('/candidates/me/allocation/history'),
          apiGet<any>('/candidates/me/recommendations').catch(() => null),
          apiGet<CandidateAcademicDto>('/candidates/me/academic').catch(() => null),
          apiGet<NocEvidenceDto>('/candidates/me/evidence/noc').catch(() => null),
          apiGet<CandidateOffer[]>('/candidates/me/offers').catch(() => []),
        ]);
        setAlloc(a);
        setReady(d.readiness ?? null);
        setActions(d.nextActions ?? d.actions ?? []);
        setHistory(h ?? []);
        setRecs(r?.items ?? []);
        setAcademic(acad ?? null);
        setNoc(myNoc ?? null);
        setOffers(myOffers ?? []);
      } catch (e) { setErr(errMsg(e)); }
    })();
  }, []);

  const handleAcceptOffer = async (id: number) => {
    setActionBusy(id);
    setActionMsg('');
    try {
      const updated = await apiPost<CandidateOffer>(`/candidates/me/offers/${id}/accept`, {});
      setOffers(prev => prev.map(o => o.id === id ? updated : o));
      setActionMsg('Offer successfully accepted! Your seat is locked.');
      await loadOffers();
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setActionBusy(null);
    }
  };

  const handleDeclineOffer = async (id: number) => {
    if (!window.confirm('Are you sure you want to decline this offer? The seat will be released for reallocation.')) return;
    setActionBusy(id);
    setActionMsg('');
    try {
      const updated = await apiPost<CandidateOffer>(`/candidates/me/offers/${id}/decline`, { reason: 'Candidate declined via portal' });
      setOffers(prev => prev.map(o => o.id === id ? updated : o));
      setActionMsg('Offer declined. The seat has been released.');
      await loadOffers();
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setActionBusy(null);
    }
  };

  if (!alloc && !err) return <Spinner label="Preparing your dashboard…" />;

  const allocated = alloc?.state === 'ALLOCATED';
  const firstName = me?.name?.split(' ')[0] ?? 'there';
  const topRec = recs[0] ?? null;
  const primaryAction = actions[0] ?? 'You are ready — watch for the next allocation run';
  const actionRoute = (a: string) =>
    a.toLowerCase().includes('resume') ? '/candidate/profile'
      : a.toLowerCase().includes('preference') ? '/candidate/profile'
      : a.toLowerCase().includes('skill') ? '/candidate/analytics'
      : '/candidate/explore';

  return (
    <div className="role-workspace candidate-workspace">
      <header className="role-page-heading">
        <div><span className="section-kicker">CANDIDATE / MY WORKSPACE</span><h1>Your next chapter, {firstName}.</h1><p>Discover where you fit. Prepare your profile. Follow your internship journey.</p></div>
        <button className="btn-ghost" onClick={() => nav('/candidate/explore')}><Briefcase size={16} />Explore internships<ArrowRight size={15} /></button>
      </header>
      {err && <Callout tone="warn">{err}</Callout>}
      {actionMsg && <Callout tone="success">{actionMsg}</Callout>}
      <div className="candidate-overview-layout">
        <aside className="candidate-passport">
          <span className="passport-avatar">{me?.name?.slice(0, 1)}</span><h2>{me?.name}</h2><span className="passport-role">CANDIDATE WORKSPACE</span>
          <div className="candidate-readiness-score"><ScoreRing value={ready?.overall ?? 0} size={102} label="profile" /><div><strong>Profile readiness</strong><p>Keep your information current for the next allocation round.</p></div></div>
          <div className="passport-checklist">{(ready?.items ?? []).map(item => (
            <div key={item.key} title={item.detail}><span>{item.status === 'COMPLETED' ? <CheckCircle2 size={14} /> : <Clock size={14} />}</span><span>{item.label}</span><strong>{item.earned}/{item.maxScore}</strong></div>
          ))}</div>
          <button className="passport-action" onClick={() => nav('/candidate/profile')}>Update my profile<ArrowRight size={15} /></button>
          <div className="next-action-note"><span className="section-kicker">YOUR NEXT STEP</span><p>{primaryAction}</p><button onClick={() => nav(actionRoute(primaryAction))}>Continue<ArrowRight size={13} /></button></div>
        </aside>
        <div className="candidate-overview-main">
          <section className={'candidate-status-panel ' + (allocated ? 'placement-ready' : '')}>
            <div className="status-panel-icon">{allocated ? <PartyPopper size={27} /> : <Hourglass size={27} />}</div>
            <div><span className="section-kicker">{allocated ? 'LATEST ALLOCATION' : 'YOUR ALLOCATION STATUS'}</span><h2>{allocated ? alloc?.opportunityTitle : alloc?.message || 'Awaiting the next allocation round'}</h2>
              <p>{allocated ? [alloc?.sector, alloc?.opportunityState].filter(Boolean).join(' · ') : 'Keep your profile and preferences up to date while you explore suitable opportunities.'}</p>
              {allocated && <small>Run #{alloc?.runNumber} · {fmtTime(alloc?.runAt)}{alloc?.suitability != null ? ' · Fit ' + alloc.suitability.toFixed(1) + '/100' : ''}{alloc?.preferenceRank ? ' · Preference #' + alloc.preferenceRank : ''}</small>}
            </div>
            <button className="btn-ghost" onClick={() => nav(allocated ? '/candidate/explore' : '/candidate/analytics')}>{allocated ? 'View opportunities' : 'See my fit'}<ArrowRight size={14} /></button>
          </section>
          <section className="role-panel">
            <div className="role-panel-heading"><div><span className="section-kicker">OFFERS & JOINING</span><h2>Your internship inbox.</h2></div><span className="role-subtle-tag">{offers.filter(offer => offer.status === 'OFFERED').length} awaiting response</span></div>
            {offers.length ? <div className="candidate-offer-list">{offers.map(offer => (
              <article className="candidate-offer" key={offer.id}>
                <div className="offer-title-row"><h3>{offer.opportunityTitle}</h3><Badge tone={offer.status === 'OFFERED' ? 'amber' : offer.status === 'DECLINED' ? 'red' : offer.status === 'EXPIRED' ? 'gray' : 'green'} dot>{offer.status}</Badge></div>
                <p><Building2 size={13} />{offer.providerName}<span>·</span>{offer.city ? offer.city + ', ' : ''}{offer.state}</p>
                <small>{offer.sector} · {offer.durationMonths} months · Offered {fmtTime(offer.offeredAt)}</small>
                {offer.respondedAt && <small>Responded {fmtTime(offer.respondedAt)}{offer.joinedAt ? ' · Joined ' + fmtTime(offer.joinedAt) : ''}</small>}
                {offer.declineReason && <small>Reason · {offer.declineReason}</small>}
                {offer.status === 'OFFERED' && <div className="offer-response-actions"><button className="btn-primary btn-sm" disabled={actionBusy === offer.id} onClick={() => handleAcceptOffer(offer.id)}>{actionBusy === offer.id ? 'Updating…' : 'Accept offer'}</button><button className="btn-ghost btn-sm" disabled={actionBusy === offer.id} onClick={() => handleDeclineOffer(offer.id)}>Decline</button></div>}
                {offer.status === 'ACCEPTED' && <div className="offer-followup"><CheckCircle2 size={14} />Accepted · Your organisation will confirm joining.</div>}
                {offer.status === 'JOINED' && <div className="offer-followup"><Award size={14} />Joining confirmed by your organisation.</div>}
              </article>
            ))}</div> : <div className="role-empty"><Briefcase size={25} /><div><strong>No offers to respond to yet.</strong><p>Offers from allocation rounds will appear here.</p></div></div>}
          </section>
          <section className="role-panel">
            <div className="role-panel-heading"><div><span className="section-kicker">DISCOVER YOUR FIT</span><h2>A few opportunities to explore.</h2><p>Personal recommendations based on your current profile.</p></div><button className="text-action" onClick={() => nav('/candidate/analytics')}>Fit analytics<ArrowRight size={14} /></button></div>
            {recs.length ? <div className="personal-recommendations">{recs.slice(0, 3).map(item => (
              <button key={item.opportunity.id} className="personal-recommendation" onClick={() => nav('/candidate/analytics')}>
                <span className="recommendation-rank">{String(item.rank).padStart(2, '0')}</span><div><h3>{item.opportunity.title}</h3><p>{item.opportunity.sector} · {item.opportunity.state}</p><small>{item.topGap ? 'Skill to develop · ' + item.topGap : 'Review your complete factor breakdown'}</small></div><strong>{item.overallScore.toFixed(0)}<small>/100 fit</small></strong><ArrowRight size={15} />
              </button>
            ))}</div> : <div className="role-empty">Add skills, interests, and preferences to discover your matches.</div>}
            <div className="panel-footnote">Recommendations show personal fit. Allocation also considers eligibility, other applicants, and seat capacity.</div>
            {topRec && <div className="recommendation-coaching"><Lightbulb size={16} /><span>{topRec.topGap ? 'Develop ' + topRec.topGap + ' to strengthen your fit for ' + topRec.opportunity.title + '.' : 'Explore the score breakdown for ' + topRec.opportunity.title + ' to understand your strongest signals.'}</span></div>}
          </section>
          <section className="clearance-panel">
            <div><span className="section-kicker">ACADEMIC & INSTITUTIONAL EVIDENCE</span><h2>Keep your clearance in view.</h2></div>
            <div className="clearance-items">
              <div><GraduationCap size={20} /><span><strong>Academic declaration</strong><small>{academic?.institutionName || 'Add your institution and programme'}</small><small>{academic?.finalYearStatus?.replace(/_/g, ' ') || 'Not declared'}</small></span></div>
              <div><FileText size={20} /><span><strong>Institutional NOC</strong><small>{noc?.issuingInstitution || 'Upload your institutional certificate'}</small><small>{noc?.verificationStatus?.replace(/_/g, ' ') || 'Not submitted'}</small></span></div>
            </div>
            <button className="text-action" onClick={() => nav('/candidate/profile#academic-section')}>Review academic & NOC details<ArrowRight size={14} /></button>
          </section>
          {history.length > 0 && <section className="role-panel"><div className="role-panel-heading"><div><span className="section-kicker">YOUR JOURNEY</span><h2>Allocation history</h2></div></div>{history.map(item => <div className="candidate-history-line" key={item.runId}><span>#{item.runNumber}</span><div><strong>{item.opportunityTitle ?? '—'}</strong><small>{fmtTime(item.completedAt)}</small></div><Badge tone="green">Allocated</Badge>{item.suitability != null && <small>{item.suitability.toFixed(1)}/100</small>}</div>)}</section>}
        </div>
      </div>
    </div>
  );
}
