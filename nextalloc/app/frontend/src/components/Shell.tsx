import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Database, History, FlaskConical, RefreshCcw, ScrollText,
  Compass, Cpu, User, Briefcase, Building2, LogOut, Gauge, ShieldCheck,
  Menu, X, ChevronDown, ArrowUpRight, Users, GitBranch, ScanEye, Check,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const ADMIN_NAV = [
  { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/verification', label: 'Verification & NOCs', icon: ShieldCheck },
  { to: '/admin/scenarios', label: 'Datasets & scenarios', icon: Database },
  { to: '/admin/runs', label: 'Allocation runs', icon: History },
  { to: '/admin/whatif', label: 'Policy lab', icon: FlaskConical },
  { to: '/admin/reallocation', label: 'Reallocation', icon: RefreshCcw },
  { to: '/admin/audit', label: 'Audit trail', icon: ScrollText },
  { to: '/admin/judge', label: 'Product walkthrough', icon: Compass },
  { to: '/admin/technical', label: 'System health', icon: Cpu },
];
const CANDIDATE_NAV = [
  { to: '/candidate', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/candidate/explore', label: 'Opportunities', icon: Briefcase },
  { to: '/candidate/analytics', label: 'Fit analytics', icon: Gauge },
  { to: '/candidate/profile', label: 'My profile', icon: User },
];
const PROVIDER_NAV = [
  { to: '/provider', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/provider/opportunities', label: 'My opportunities', icon: Building2 },
];
const DESCRIPTIONS: Record<string, string> = {
  '/admin/verification': 'Review academic evidence and eligibility',
  '/admin/scenarios': 'Choose and manage the active candidate pool',
  '/admin/runs': 'Explore results and assignment explanations',
  '/admin/whatif': 'Compare policies before your next round',
  '/admin/reallocation': 'Plan changes to an existing allocation',
  '/admin/audit': 'Follow actions and decision records',
  '/admin/judge': 'Explore the demonstration step by step',
  '/admin/technical': 'Inspect services and optimizer diagnostics',
};

const GROUP_PRESENTATION: Record<string, {
  step: string; title: string; description: string; note: string; icon: typeof Users;
}> = {
  people: {
    step: '01 / PREPARE',
    title: 'Start with the right inputs.',
    description: 'Bring your candidate pool and eligibility evidence into the next round.',
    note: 'Candidate records & institutional evidence',
    icon: Users,
  },
  allocation: {
    step: '02 / ALLOCATE',
    title: 'Shape the next outcome.',
    description: 'Test a policy, inspect a run, or explore what changes in the next round.',
    note: 'Policy exploration & allocation results',
    icon: GitBranch,
  },
  governance: {
    step: '03 / UNDERSTAND',
    title: 'See the whole decision.',
    description: 'Follow recorded actions, inspect service diagnostics, and explore the product.',
    note: 'Activity, diagnostics & product guidance',
    icon: ScanEye,
  },
};
const DESTINATION_TYPES: Record<string, string> = {
  '/admin/verification': 'EVIDENCE REVIEW',
  '/admin/scenarios': 'ROUND INPUTS',
  '/admin/runs': 'RESULTS & EXPLANATIONS',
  '/admin/whatif': 'POLICY SIMULATION',
  '/admin/reallocation': 'ROUND COMPARISON',
  '/admin/audit': 'RECORDED ACTIVITY',
  '/admin/technical': 'SERVICE DIAGNOSTICS',
  '/admin/judge': 'GUIDED DEMONSTRATION',
};
export default function Shell() {
  const { me, logout } = useAuth();
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const nav = me?.role === 'ADMIN' ? ADMIN_NAV : me?.role === 'PROVIDER' ? PROVIDER_NAV : CANDIDATE_NAV;
  const groups = me?.role === 'ADMIN' ? [
    { id: 'people', label: 'People & data', caption: 'PREPARE YOUR ROUND', items: [ADMIN_NAV[1], ADMIN_NAV[2]] },
    { id: 'allocation', label: 'Allocation', caption: 'MATCH & OPTIMIZE', items: [ADMIN_NAV[3], ADMIN_NAV[4], ADMIN_NAV[5]] },
    { id: 'governance', label: 'Governance', caption: 'REVIEW & UNDERSTAND', items: [ADMIN_NAV[6], ADMIN_NAV[8], ADMIN_NAV[7]] },
  ] : [];
  const currentPage = nav.find(item => item.end
    ? location.pathname === item.to
    : location.pathname.startsWith(item.to))?.label ?? 'Workspace';

  useEffect(() => {
    function dismissOutside(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) {
        setOpenGroup(null);
        setMobileOpen(false);
      }
    }
    function dismissWithEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (openGroup) {
        setOpenGroup(null);
        lastTrigger.current?.focus();
      } else if (mobileOpen) {
        setMobileOpen(false);
        mobileTrigger.current?.focus();
      }
    }
    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('keydown', dismissWithEscape);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('keydown', dismissWithEscape);
    };
  }, [openGroup, mobileOpen]);

  function closeNavigation() {
    setOpenGroup(null);
    setMobileOpen(false);
  }

  function toggleGroup(id: string, event: React.MouseEvent<HTMLButtonElement>) {
    lastTrigger.current = event.currentTarget;
    setOpenGroup(current => current === id ? null : id);
  }

  return (
    <div className="app-frame">
      <header className="app-header" ref={headerRef} onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpenGroup(null);
      }}>
        <div className="navigation-surface">
          <NavLink className="nav-brand" to={nav[0].to} onClick={closeNavigation} aria-label="NextAlloc home">
            <span className="nav-brand-symbol"><Compass size={21} strokeWidth={1.7} /></span>
            <span>NextAlloc<span className="nav-brand-dot">.</span></span>
          </NavLink>

          <nav className={'primary-navigation ' + (mobileOpen ? 'mobile-expanded' : '')} aria-label="Main navigation" id="primary-navigation">
            <NavLink to={nav[0].to} end onClick={closeNavigation} className={({ isActive }) => 'nav-control ' + (isActive ? 'nav-current' : '')}>Overview</NavLink>
            {groups.map(group => {
              const presentation = GROUP_PRESENTATION[group.id];
              const FeatureIcon = presentation.icon;
              const active = group.items.some(item => location.pathname.startsWith(item.to));
              const expanded = openGroup === group.id;
              return (
                <div className="navigation-group" key={group.id}>
                  <button type="button" className={'nav-control ' + (active ? 'nav-current' : '')}
                    aria-expanded={expanded} aria-controls={'navigation-' + group.id}
                    onClick={event => toggleGroup(group.id, event)}>
                    {group.label}<ChevronDown size={13} className={expanded ? 'chevron-open' : ''} />
                  </button>
                  {expanded && (
                    <div className={'navigation-dropdown workspace-dropdown dropdown-' + group.id} id={'navigation-' + group.id}>
                      <div className="dropdown-feature">
                        <span className="feature-step">{presentation.step}</span>
                        <div className="feature-illustration" aria-hidden="true"><FeatureIcon size={32} strokeWidth={1.2} /></div>
                        <h2>{presentation.title}</h2>
                        <p>{presentation.description}</p>
                        <span className="feature-note">{presentation.note}</span>
                      </div>
                      <div className="dropdown-workspaces">
                        <div className="workspaces-heading"><span>{group.caption}</span><span>{String(group.items.length).padStart(2, '0')}</span></div>
                        {group.items.map(item => (
                          <NavLink to={item.to} key={item.to} onClick={closeNavigation}
                            className={({ isActive }) => 'dropdown-destination ' + (isActive ? 'destination-current' : '')}>
                            {({ isActive }) => <>
                              <span className="destination-icon"><item.icon size={19} strokeWidth={1.7} /></span>
                              <span className="destination-copy">
                                <span className="destination-type">{DESTINATION_TYPES[item.to]}</span>
                                <strong>{item.label}</strong>
                                <small>{DESCRIPTIONS[item.to]}</small>
                              </span>
                              {isActive
                                ? <span className="current-destination"><Check size={11} />Here</span>
                                : <ArrowUpRight size={15} className="destination-arrow" />}
                            </>}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {groups.length === 0 && nav.slice(1).map(item => (
              <NavLink to={item.to} key={item.to} onClick={closeNavigation}
                className={({ isActive }) => 'nav-control ' + (isActive ? 'nav-current' : '')}>{item.label}</NavLink>
            ))}
          </nav>

          <div className="navigation-actions">
            <span className="workspace-badge"><span />Demo workspace</span>
            <span className="navigation-divider" />
            <div className="navigation-account">
              <button type="button" className="account-trigger" aria-label="Open account menu"
                aria-expanded={openGroup === 'account'} aria-controls="account-dropdown"
                onClick={event => toggleGroup('account', event)}>
                <span>{me?.name?.slice(0, 1) ?? '?'}</span><ChevronDown size={12} />
              </button>
              {openGroup === 'account' && (
                <div className="navigation-dropdown account-dropdown" id="account-dropdown">
                  <div className="account-identity">
                    <span className="identity-avatar">{me?.name?.slice(0, 1)}</span>
                    <div><span className="dropdown-caption">SIGNED IN AS</span><strong className="account-name">{me?.name}</strong><span className="account-role">{me?.role === 'ADMIN' ? 'Administrator' : me?.role === 'PROVIDER' ? 'Organisation partner' : 'Candidate'}</span></div>
                  </div>
                  <span className="account-email">{me?.email}</span>
                  <div className="account-environment"><span />Demonstration workspace</div>
                  <button className="account-signout" onClick={logout}><LogOut size={16} />Sign out<ArrowUpRight size={14} /></button>
                </div>
              )}
            </div>
            <button type="button" ref={mobileTrigger} className="navigation-toggle" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileOpen} aria-controls="primary-navigation"
              onClick={() => { setMobileOpen(!mobileOpen); setOpenGroup(null); }}>
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>
      <main className="app-content" aria-label={currentPage}><Outlet /></main>
      <footer className="app-footer"><span>NextAlloc / Internship allocation</span><span>Demonstration workspace · all candidate data is synthetic</span></footer>
    </div>
  );
}

