import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Building2, User, ArrowRight, Lock, Briefcase, Check, GitBranch, ArrowUpRight, ScanLine, ListChecks } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { errMsg } from '../api/client';

const ROLES = [
  { id: 'admin', label: 'Administrator', sub: 'Command center, runs, policy, fairness', icon: ShieldCheck, email: 'admin@nextalloc.in', pass: 'Admin@123' },
  { id: 'provider', label: 'Organisation Partner', sub: 'Publish & manage opportunities', icon: Building2, email: 'provider@nextalloc.in', pass: 'Provider@123' },
  { id: 'candidate', label: 'Candidate', sub: 'Profile, readiness, allocation result', icon: User, email: 'candidate@nextalloc.in', pass: 'Candidate@123' },
];

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState(ROLES[0].email);
  const [pass, setPass] = useState(ROLES[0].pass);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const pick = (r: typeof ROLES[number]) => { setRole(r.id); setEmail(r.email); setPass(r.pass); setErr(''); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const me = await login(email, pass);
      nav(me.role === 'ADMIN' ? '/admin' : me.role === 'PROVIDER' ? '/provider' : '/candidate');
    } catch (ex) {
      setErr(errMsg(ex));
    } finally { setBusy(false); }
  };

  return (
    <div className="access-page" id="top">
      <a className="landing-skip-link" href="#workspaces">Skip to workspace sign-in</a>
      <header className="access-header landing-header">
        <a className="landing-brand" href="#top" aria-label="NextAlloc home"><img src="/nextalloc-favicon.svg?v=2" alt="" width="33" height="33" /><strong>NextAlloc<span>®</span></strong></a>
        <nav aria-label="Page navigation"><a href="#how-it-works">How it works</a><a href="#workspaces">Workspaces</a></nav>
        <a className="landing-sign-in" href="#sign-in">Sign in<ArrowUpRight size={14} /></a>
      </header>
      <main className="access-content landing-content">
        <section className="allocation-hero" aria-labelledby="hero-title">
          <div className="allocation-hero-copy">
            <span className="hero-eyebrow"><span />POTENTIAL. POSSIBILITY. PLACEMENT.</span>
            <h1 id="hero-title">Great potential.<br />The right<br /><em>opportunity.</em></h1>
            <p>Bring people, opportunities, and policy together. Make internship allocation clearer for everyone on both sides of the match.</p>
            <div className="hero-actions"><a className="hero-primary-action" href="#workspaces">Explore the demo<ArrowUpRight size={18} /></a><a className="hero-secondary-action" href="#how-it-works">See how it works<ArrowRight size={15} /></a></div>
            <div className="hero-role-note"><div aria-hidden="true"><User size={15} /><Building2 size={15} /><ShieldCheck size={15} /></div><span>Three workspaces.<br /><strong>One connected journey.</strong></span></div>
          </div>
          <div className="hero-visual" aria-label="Illustrated journey from candidate profile through allocation checks to an internship offer">
            <div className="hero-visual-heading"><span className="section-kicker">THE BIG PICTURE</span><span className="hero-preview-label">Illustrative journey</span></div>
            <h2>More than a match.<br /><em>A path forward.</em></h2>
            <div className="hero-journey">
              <div className="journey-profile"><span className="journey-step">01</span><span className="journey-avatar"><User size={23} strokeWidth={1.5} /></span><div><span className="journey-label">THE CANDIDATE</span><h3>A profile full of potential</h3><p>Skills, interests & aspirations</p></div><span className="journey-profile-badge"><Check size={13} /></span></div>
              <div className="journey-connector" aria-hidden="true"><span /></div>
              <div className="journey-engine"><span className="journey-step">02</span><div className="journey-engine-title"><span><GitBranch size={17} /></span><h3>The full picture, considered.</h3></div><div className="journey-checks"><span><Check size={12} />Eligibility</span><span><Check size={12} />Preferences</span><span><Check size={12} />Seat capacity</span></div></div>
              <div className="journey-connector" aria-hidden="true"><span /></div>
              <div className="journey-opportunity"><span className="journey-step">03</span><span className="journey-opportunity-icon"><Briefcase size={24} strokeWidth={1.5} /></span><div><span className="journey-label">THE OPPORTUNITY</span><h3>A place to put it into practice.</h3><p>Allocation → Offer → Joining</p></div><ArrowUpRight size={19} /></div>
            </div>
            <div className="hero-visual-foot"><span className="hero-foot-dot" />Explainable decisions. Human possibilities.</div>
            <span className="hero-corner-note" aria-hidden="true">A BETTER WAY TO BEGIN ↗</span>
          </div>
        </section>
        <section className="landing-principles" id="how-it-works" aria-label="How NextAlloc works">
          <article><span className="principle-number">01 / PREPARE</span><ScanLine size={21} strokeWidth={1.5} /><h2>Start with the person.</h2><p>Build a profile and check it against the skills, qualifications, and evidence each internship needs.</p></article>
          <article><span className="principle-number">02 / ALLOCATE</span><GitBranch size={21} strokeWidth={1.5} /><h2>Consider the whole picture.</h2><p>Balance suitability and preferences with configured policy and the seats organisations can offer.</p></article>
          <article><span className="principle-number">03 / MOVE FORWARD</span><ListChecks size={21} strokeWidth={1.5} /><h2>Make the next step clear.</h2><p>Explore the reasons behind a match, respond to an offer, and follow the journey through joining.</p></article>
        </section>
        <section className="landing-workspaces" id="workspaces" aria-labelledby="workspace-title">
        <div className="landing-workspace-heading"><span className="section-kicker">A WORKSPACE FOR EVERY PERSPECTIVE</span><h2 id="workspace-title">Where will you <em>make an impact?</em></h2><p>Choose a role and explore the demonstration with a pre-filled account.</p></div>
        <div className="access-roles">
          {ROLES.map(item => <button type="button" key={item.id} aria-pressed={role === item.id} onClick={() => pick(item)} className={role === item.id ? 'chosen-role' : ''}>
            <item.icon size={26} /><strong>{item.label}</strong><span>{item.sub}</span><ArrowRight size={18} />
          </button>)}
        </div>
        <form onSubmit={submit} className="access-form" id="sign-in" aria-label="Workspace sign-in">
          <div><span className="section-kicker">ENTER YOUR WORKSPACE</span><h2>Welcome back.</h2><p>Demo credentials are filled for your selected role.</p></div>
          <div className="access-fields"><div><label htmlFor="login-email">Email address</label><input id="login-email" className="input" type="email" required value={email} onChange={event => setEmail(event.target.value)} autoComplete="username" /></div>
          <div><label htmlFor="login-password">Password</label><input id="login-password" className="input" type="password" required value={pass} onChange={event => setPass(event.target.value)} autoComplete="current-password" /></div></div>
          {err && <p className="access-error" role="alert">{err}</p>}
          <button type="submit" className="room-launch" disabled={busy}><Lock size={16} />{busy ? 'Signing in…' : 'Open workspace'}<ArrowRight size={17} /></button>
        </form>
        </section>
      </main>
      <footer className="access-footer"><span>Smart India Hackathon · SIH25033</span><span>Demonstration environment / Synthetic data</span></footer>
    </div>
  );
}
