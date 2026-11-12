import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Building2, User, Sparkles, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { errMsg } from '../api/client';
import { Logo, LogoMark } from '../components/Logo';

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
    <div className="access-page">
      <header className="access-header"><strong>NextAlloc<span>®</span></strong><span>INTERNSHIP ALLOCATION PLATFORM</span></header>
      <main className="access-content">
        <span className="section-kicker">CHOOSE YOUR WORKSPACE</span>
        <h1>Where will you<br /><em>make an impact?</em></h1>
        <p>Manage the next round, discover an opportunity, or grow your team.</p>
        <div className="access-roles">
          {ROLES.map(item => <button type="button" key={item.id} aria-pressed={role === item.id} onClick={() => pick(item)} className={role === item.id ? 'chosen-role' : ''}>
            <item.icon size={26} /><strong>{item.label}</strong><span>{item.sub}</span><ArrowRight size={18} />
          </button>)}
        </div>
        <form onSubmit={submit} className="access-form">
          <div><span className="section-kicker">ENTER YOUR WORKSPACE</span><h2>Welcome back.</h2><p>Demo credentials are filled for your selected role.</p></div>
          <div className="access-fields"><div><label htmlFor="login-email">Email address</label><input id="login-email" className="input" type="email" required value={email} onChange={event => setEmail(event.target.value)} autoComplete="username" /></div>
          <div><label htmlFor="login-password">Password</label><input id="login-password" className="input" type="password" required value={pass} onChange={event => setPass(event.target.value)} autoComplete="current-password" /></div></div>
          {err && <p className="access-error" role="alert">{err}</p>}
          <button type="submit" className="room-launch" disabled={busy}><Lock size={16} />{busy ? 'Signing in…' : 'Open workspace'}<ArrowRight size={17} /></button>
        </form>
      </main>
      <footer className="access-footer"><span>Smart India Hackathon · SIH25033</span><span>Demonstration environment / Synthetic data</span></footer>
    </div>
  );
}
