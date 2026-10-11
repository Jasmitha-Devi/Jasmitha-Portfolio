import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowDownRight, ArrowRight, ArrowUp, BrainCircuit, BriefcaseBusiness, Check,
  CheckCircle2, Code2, Copy, ExternalLink, Github, GraduationCap, Layers3,
  Linkedin, Mail, Menu, Moon, Network, PanelTop, Send, Sparkles, Sun, Terminal,
  X, Search, RotateCcw, Square, CalendarDays, Compass, Lightbulb, Globe2,
} from 'lucide-react';
import {
  getStreamPortfolioChatUrl,
  useGetPortfolioChatStatus,
  useGetPortfolioGithub,
  useSubmitPortfolioContact,
  type ChatInput,
  type ChatMessage,
  type GitHubRepository,
} from '@workspace/api-client-react';
import { portfolioContent } from '@workspace/portfolio-content';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
type ThemeChoice = 'light' | 'dark' | 'system';
type Project = (typeof portfolioContent.projects)[number] & {
  key: (typeof portfolioContent.projects)[number]['id'];
  repo: string;
  stack: readonly string[];
  category: readonly string[];
  image?: string;
};
const projects: Project[] = portfolioContent.projects.map((project) => ({
  ...project,
  key: project.id,
  repo: project.repository,
  stack: project.technologies,
  category: project.categories,
  image: project.id === 'harvest-shield' ? '/images/harvest-shield.png'
    : project.id === 'python-complexity-lab' ? '/images/complexity-lab.png' : undefined,
}));
const projectCopy = {
  'harvest-shield': {
    problem: 'Perishable goods cannot be routed like ordinary freight; delays, traffic incidents and weather can affect a delivery.',
    how: "It requests real routes from a routing service, brings in live traffic, incident and weather data from external providers, and lets users compare the alternatives the routing service actually returns. A what-if simulation interface lets users explore how conditions could change a trip. External data and the app's own simulations are labelled separately.",
    status: 'Deployed; built with AI assistance, with implementation validation and learning ongoing. No ETA accuracy or savings are claimed.',
  },
  'python-complexity-lab': {
    problem: 'Estimating the complexity of code by eye is hard and error-prone, especially for beginners.',
    how: 'It parses submitted Python into an Abstract Syntax Tree and applies hand-written rules to recognise structures such as loops, nested loops and recursion, then shows a complexity estimate. Code is analysed statically and never executed. The rules were tested against a dataset.',
    status: 'Deployed; main features tested. Results are estimates from the implemented rules and can be wrong, so continued validation is needed.',
  },
  'expiry-guard': {
    problem: 'Expiry-sensitive items are easy to forget until it is too late.',
    how: 'An ongoing project exploring ways to organise expiry information and highlight items needing attention. The unfinished Streamlit app uses local CSV examples for inventory-risk, demand-forecast and transfer-planning views.',
    status: 'In development; unfinished.',
  },
} as const;

const navItems = [
  ['home', 'Home'], ['projects', 'Projects'], ['about', 'About'],
  ['skills', 'Skills'], ['hackathons', 'Hackathons'], ['contact', 'Contact'],
];
const techs = [...new Set([
  ...portfolioContent.skills.flatMap((group) => group.items.map((item) => item.name)),
  ...portfolioContent.projects.flatMap((project) => project.technologies),
])];
const quickPrompts = [
  `Tell me about ${portfolioContent.profile.name}.`,
  `Explain ${portfolioContent.projects[0].name}.`,
  `What does ${portfolioContent.projects[1].name} do?`,
  `What is ${portfolioContent.skills[2].items[0].name}?`,
  'Help me understand DSA.',
  'What can I learn to become an AI full-stack developer?',
];

function getSystemDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(() => {
    try { return (localStorage.getItem('jasmitha-theme') as ThemeChoice) || 'system'; } catch { return 'system'; }
  });
  const [systemDark, setSystemDark] = useState(getSystemDark);
  const dark = choice === 'dark' || (choice === 'system' && systemDark);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#171923' : '#f8f6ef');
  }, [dark]);
  const select = (value: ThemeChoice) => {
    setChoice(value);
    try { localStorage.setItem('jasmitha-theme', value); } catch { /* Storage can be disabled. */ }
  };
  return { choice, dark, select };
}

function useFocusTrap(ref: { current: HTMLElement | null }, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = ref.current;
    if (!root) return;
    const getFocusable = () => Array.from(root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ));
    getFocusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { closeRef.current(); return; }
      if (event.key !== 'Tab') return;
      const items = getFocusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) { event.preventDefault(); root.focus(); return; }
      if (!root.contains(document.activeElement)) {
        event.preventDefault(); (event.shiftKey ? last : first).focus(); return;
      }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previousFocus?.focus(); };
  }, []);
}

function ThemeToggle({ choice, onSelect }: { choice: ThemeChoice; onSelect: (value: ThemeChoice) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const dismiss = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', dismiss);
    return () => document.removeEventListener('mousedown', dismiss);
  }, []);
  const options: { id: ThemeChoice; label: string; icon: typeof Sun }[] = [
    { id: 'light', label: 'Light', icon: Sun }, { id: 'dark', label: 'Dark', icon: Moon }, { id: 'system', label: 'System', icon: PanelTop },
  ];
  const Icon = choice === 'dark' ? Moon : choice === 'light' ? Sun : PanelTop;
  return <div className="theme-wrap" ref={ref}>
    <button className="icon-button" aria-label={`Theme: ${choice}. Choose theme`} aria-pressed={choice === 'dark'} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} data-testid="button-theme">
      <Icon size={17} />
    </button>
    {open && <div className="theme-menu" role="menu" aria-label="Theme preference">
      {options.map(({ id, label, icon: ChoiceIcon }) => <button key={id} className={`theme-choice ${choice === id ? 'selected' : ''}`} role="menuitemradio" aria-checked={choice === id} onClick={() => { onSelect(id); setOpen(false); }}>
        <ChoiceIcon size={15} />{label}{choice === id && <Check size={14} style={{ marginLeft: 'auto' }} />}
      </button>)}
    </div>}
  </div>;
}

function Architecture({ project }: { project: Project }) {
  const nodes = project.id === 'harvest-shield'
    ? ['Origins + destinations', 'OSRM road routes', 'Traffic + weather context', 'Route risk comparison']
    : project.id === 'python-complexity-lab'
      ? ['Python source', 'AST parsing', 'Rules + patterns', 'Static estimates']
      : ['CSV example data', 'Streamlit screens', 'Risk + transfer views'];
  return <div className="architecture" aria-label="High-level project flow">
    <div className="eyebrow">High-level flow</div>
    <svg viewBox={`0 0 ${nodes.length * 190} 84`} role="img" aria-label={nodes.join(' then ')}>
      {nodes.map((node, index) => <g key={node} transform={`translate(${index * 190 + 5} 17)`}>
        <rect width="150" height="48" rx="10" fill="var(--surface-raised)" stroke="currentColor" strokeOpacity=".55" />
        <text x="75" y="29" textAnchor="middle" fill="currentColor" fontSize="12" fontFamily="DM Mono">{node}</text>
        {index < nodes.length - 1 && <path d="M153 24h25m-7-6 7 6-7 6" stroke="currentColor" fill="none" strokeWidth="1.5" />}
      </g>)}
    </svg>
    <small className="muted">Conceptual flow only; no unverified internal architecture is implied.</small>
  </div>;
}

function ProjectDetails({ project, close }: { project: Project; close: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, close);
  const copy = projectCopy[project.key];
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <div className="modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="project-dialog-title">
      <div className="modal-head"><div><div className="eyebrow">{project.status}</div><h2 id="project-dialog-title">{project.name}</h2><div className="project-subtitle">{project.subtitle}</div></div>
        <button className="icon-button" aria-label="Close project details" onClick={close}><X size={18} /></button>
      </div>
      <div className="modal-body">
        <h3>The problem</h3><p>{copy.problem}</p>
        <h3>How it works</h3><p>{copy.how}</p>
        <h3>Current status &amp; limits</h3><p>{copy.status}</p>
        <div className="modal-split">
          <div><h3>Implemented</h3><ul>{project.implemented.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div><h3>Intended / in progress</h3><ul>{project.intended.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
        <h3>Limitations</h3><ul>{project.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>Architecture sketch</h3><Architecture project={project} />
        <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a className="button button-primary" href={project.repo} target="_blank" rel="noopener noreferrer"><Github size={16} /> View repository <ExternalLink size={14} /></a>
          {project.key === 'harvest-shield' && <a className="button" href="https://harvest-sheild-api.onrender.com" target="_blank" rel="noopener noreferrer"><Globe2 size={15} /> Backend API <ExternalLink size={13} /></a>}
        </div>
      </div>
    </div>
  </div>;
}

function BigOVisualizer() {
  const [complexity, setComplexity] = useState('O(n)');
  const [n, setN] = useState(12);
  const points = useMemo(() => {
    const fns: Record<string, (x: number) => number> = {
      'O(1)': () => 1, 'O(log n)': (x) => Math.log2(x + 1), 'O(n)': (x) => x,
      'O(n log n)': (x) => x * Math.log2(x + 1), 'O(n²)': (x) => x * x, 'O(2ⁿ)': (x) => Math.pow(2, x / 4),
    };
    const fn = fns[complexity];
    const max = fn(n);
    return Array.from({ length: 25 }, (_, i) => {
      const x = (i + 1) * n / 25;
      const y = fn(x) / max;
      return `${i === 0 ? 'M' : 'L'} ${(i / 24) * 100} ${94 - Math.min(84, y * 82)}`;
    }).join(' ');
  }, [complexity, n]);
  return <div className="surface-card bigo-layout">
    <div className="bigo-controls">
      <label htmlFor="growth-type">Growth function</label>
      <select id="growth-type" value={complexity} onChange={(event) => setComplexity(event.target.value)}>
        {['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)'].map((item) => <option key={item}>{item}</option>)}
      </select>
      <label htmlFor="growth-n">Input size n: {n}</label>
      <input id="growth-n" type="range" min="4" max="28" value={n} onChange={(event) => setN(Number(event.target.value))} />
        <div className="form-note">A general learning visualizer; not an output from {portfolioContent.projects[1].name}.</div>
    </div>
    <div className="bigo-chart" role="img" aria-label={`${complexity} growth curve at input size ${n}`}><div className="bigo-caption">{complexity} · illustrative growth</div><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d={points} /><circle cx="96" cy={94 - Math.min(84, 82)} r="1.8" /></svg></div>
  </div>;
}

function Roadmap() {
  const steps = [
    ['Foundations', 'Programming basics and problem decomposition'],
    ['DSA', 'Data structures, algorithms, and complexity'],
    ['Web', 'Frontend fundamentals and accessible interfaces'],
    ['Backend', 'APIs, server logic, and integration'],
    ['Databases', 'Data modeling and persistence concepts'],
    ['AI / ML', 'Core ideas, evaluation, and responsible use'],
    ['Deployment', 'Testing, release, and operational learning'],
  ];
  const [checked, setChecked] = useState<boolean[]>(() => {
    try { const saved = JSON.parse(localStorage.getItem('roadmap-checks') || '[]'); return steps.map((_, i) => Boolean(saved[i])); } catch { return steps.map(() => false); }
  });
  const toggle = (index: number) => setChecked((old) => {
    const next = old.map((v, i) => i === index ? !v : v);
    try { localStorage.setItem('roadmap-checks', JSON.stringify(next)); } catch { /* Optional persistence. */ }
    return next;
  });
  return <div className="roadmap-grid">{steps.map(([title, detail], index) => <label className="roadmap-item" key={title}>
    <input type="checkbox" checked={checked[index]} onChange={() => toggle(index)} />
    <span>{title}<small>{detail}</small></span>
  </label>)}</div>;
}

type PaletteAction = { id: string; label: string; icon: typeof ArrowDownRight };

function PaletteDialog({
  query,
  setQuery,
  actions,
  onChoose,
  close,
}: {
  query: string;
  setQuery: (value: string) => void;
  actions: PaletteAction[];
  onChoose: (id: string) => void;
  close: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useFocusTrap(dialogRef, close);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return <div className="palette" ref={dialogRef} role="dialog" aria-modal="true" aria-label="Command palette">
    <div className="palette-search">
      <Search size={17} aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search pages and actions…"
        aria-label="Search pages and actions"
        data-testid="input-command-palette"
        onKeyDown={(event) => {
          if (event.key === 'Escape') close();
          if (event.key === 'Enter' && actions[0]) onChoose(actions[0].id);
        }}
      />
    </div>
    <div className="palette-items" role="listbox" aria-label="Command results">
      {actions.length ? actions.map(({ id, label, icon: Icon }) => <button
        type="button"
        className="palette-item"
        key={id}
        role="option"
        onClick={() => onChoose(id)}
        data-testid={`command-${id}`}
      ><Icon size={16} aria-hidden="true" />{label}</button>) : <p className="muted" role="status">No matching pages or actions.</p>}
    </div>
  </div>;
}

function Portfolio() {
  const { choice, select } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState('home');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState('All');
  const [chatOpen, setChatOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const toastId = useRef(0);
  const toast = useCallback((text: string) => {
    const id = ++toastId.current;
    setToasts((current) => [...current, { id, text }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 3000);
  }, []);
  const github = useGetPortfolioGithub();
  const chatStatus = useGetPortfolioChatStatus();

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? window.scrollY / max * 100 : 0);
      const sections = navItems.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
      const current = sections.find((section) => section.getBoundingClientRect().top <= 140 && section.getBoundingClientRect().bottom > 140);
      if (current) setActive(current.id);
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPaletteOpen((v) => !v); }
      if (event.key === 'Escape') { setPaletteOpen(false); setMenuOpen(false); setSelectedProject(null); setChatOpen(false); }
    };
    window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown);
  }, []);
  useEffect(() => {
    if (!menuOpen && !paletteOpen && !selectedProject) return;
    const closeOnEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenuOpen(false); setPaletteOpen(false); setSelectedProject(null); } };
    window.addEventListener('keydown', closeOnEsc); return () => window.removeEventListener('keydown', closeOnEsc);
  }, [menuOpen, paletteOpen, selectedProject]);
  const goTo = (id: string) => {
    setMenuOpen(false); setPaletteOpen(false);
    if (id === 'chat') { setChatOpen(true); return; }
    if (id.startsWith('project-')) { setSelectedProject(projects.find((p) => p.key === id.replace('project-', '')) || null); return; }
    if (id === 'theme') { select(choice === 'dark' ? 'light' : 'dark'); return; }
    if (id === 'copy-email') { void copyEmail(); return; }
    if (id === 'top') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
  const copyEmail = async () => {
    try { await navigator.clipboard.writeText(portfolioContent.profile.email); toast('Email address copied'); }
    catch { toast('Copy unavailable. Use the email link instead.'); }
  };
  const filteredProjects = projects.filter((project) => filter === 'All' || project.category.includes(filter));
  const projectFilters = ['All', ...new Set(projects.flatMap((project) => project.category))];
  const paletteActions = [
    ...navItems.map(([id, label]) => ({ id, label: `Go to ${label}`, icon: ArrowDownRight })),
    { id: 'chat', label: 'Open Jas AI', icon: Sparkles }, { id: 'theme', label: 'Toggle light / dark theme', icon: Moon },
    { id: 'copy-email', label: 'Copy email address', icon: Copy },
    ...projects.map((project) => ({ id: `project-${project.key}`, label: `Open ${project.name} details`, icon: Layers3 })),
    { id: 'top', label: 'Back to top', icon: ArrowUp },
  ].filter((item) => item.label.toLowerCase().includes(paletteQuery.toLowerCase()));

  return <div>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="top-progress" style={{ width: `${scrollProgress}%` }} aria-hidden="true" />
    <header className="site-header">
      <div className="container nav-wrap">
        <a className="brand" href="#home" onClick={() => setMenuOpen(false)} aria-label={`${portfolioContent.profile.name}, home`}>
          <span className="brand-mark">JD</span><span><span className="brand-name">{portfolioContent.profile.name}</span><span className="brand-sub" style={{ display: 'block' }}>{portfolioContent.profile.headline}</span></span>
        </a>
        <nav id="mobile-navigation" className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
          {navItems.map(([id, label]) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)} className={`nav-link ${active === id ? 'active' : ''}`} aria-current={active === id ? 'location' : undefined}>{label}</a>)}
        </nav>
        <div className="nav-actions">
          <a className="icon-button" href={portfolioContent.profile.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub profile"><Github size={17} /></a>
          <ThemeToggle choice={choice} onSelect={select} />
          <button className="button button-primary nav-ask" onClick={() => setChatOpen(true)}><Sparkles size={15} /> Ask Jas AI</button>
          <button className="icon-button mobile-toggle" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}><Menu size={18} /></button>
        </div>
      </div>
    </header>
    <main id="main">
      <section className="hero container" id="home">
        <div className="hero-grid">
          <div className="reveal">
            <div className="eyebrow">CSE-AIML STUDENT · DEVELOPER IN PROGRESS</div>
            <h1>Building practical<br />software.<br /><span className="accent-word">Learning by making.</span></h1>
            <p className="hero-copy">{portfolioContent.profile.headline}</p>
            <div className="hero-ctas">
              <button className="button button-primary" onClick={() => goTo('projects')}>Explore my projects <ArrowDownRight size={16} /></button>
              <button className="button button-quiet" onClick={() => goTo('contact')}>Let's connect <ArrowRight size={15} /></button>
              <button className="button button-quiet" onClick={() => setChatOpen(true)}><Sparkles size={15} /> Ask Jas AI</button>
            </div>
            <div className="status-line"><span className="status-dot" /> Currently learning · Building · Improving</div>
          </div>
          <div className="hero-art" aria-label="Selected project previews">
            <button className="hero-preview hero-preview-back" onClick={() => document.getElementById('project-python-complexity-lab')?.scrollIntoView({ behavior: 'smooth' })} aria-label="See Python Code Complexity Lab project">
              <span className="browser-bar"><i /><i /><i /><b>complexity lab</b></span>
              <img src="/images/complexity-lab.png" alt="Python Code Complexity Lab application preview" />
            </button>
            <button className="hero-preview hero-preview-front" onClick={() => document.getElementById('project-harvest-shield')?.scrollIntoView({ behavior: 'smooth' })} aria-label="See Harvest Shield project">
              <span className="browser-bar"><i /><i /><i /><b>Harvest Shield</b></span>
              <img src="/images/harvest-shield.png" alt="Harvest Shield application preview" />
            </button>
            <div className="learning-card"><span className="eyebrow">CURRENTLY</span><code>learning.status =<br /><strong>"ongoing"</strong></code></div>
          </div>
        </div>
        <div className="facts" aria-label="Quick facts">
          <div className="fact"><strong>{portfolioContent.profile.year}</strong><small>CSE-AIML student</small></div>
          <div className="fact"><strong>{portfolioContent.profile.college.split(',')[0]}</strong><small>Hyderabad, Telangana</small></div>
          <div className="fact"><strong>{portfolioContent.profile.firstYearOverallCgpa}</strong><small>First-year overall CGPA</small></div>
          <div className="fact"><strong>{portfolioContent.profile.location}</strong><small>Based in</small></div>
          <div className="fact"><strong>{portfolioContent.projects.length} projects</strong><small>Featured work</small></div>
        </div>
      </section>
      <section className="section container projects-section" id="projects">
        <div className="section-head"><div className="eyebrow">01 / Selected work</div><h2>Projects that taught me something.</h2><p>Practical explorations in route intelligence, code analysis, and expiry management—with status and limitations kept in view.</p></div>
        <div className="project-tools"><span className="form-note">{portfolioContent.projects.length} projects · selected work</span><div className="filters" aria-label="Filter projects">
          {projectFilters.map((item) => <button key={item} className={`filter ${filter === item ? 'active' : ''}`} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}
        </div></div>
        <div className="project-rows">
          {filteredProjects.map((project) => {
            const copy = projectCopy[project.key];
            const index = projects.findIndex((item) => item.key === project.key) + 1;
            return <article key={project.key} className={`project-row ${index % 2 === 0 ? 'reverse' : ''}`} id={`project-${project.key}`} data-testid={`card-project-${project.key}`}>
              <div className="project-visual">
                {project.image ? <div className="browser-frame">
                  <div className="browser-chrome"><span className="browser-dots"><i /><i /><i /></span><span className="browser-address">{project.key === 'harvest-shield' ? 'harvest-shield · live route view' : 'complexity lab · Python AST workbench'}</span><span className="browser-window-mark" aria-hidden="true">↗</span></div>
                  <div className="browser-image"><img src={project.image} alt={`${project.name} application screenshot`} loading="lazy" width="1024" height="640" /></div>
                </div> : <div className="expiry-cover" aria-label="ExpiryGuard typographic project cover"><span className="cover-index">PROJECT 03 / IN DEVELOPMENT</span><strong>Expiry<br /><em>Guard</em></strong><span className="cover-note">LOCAL CSV EXAMPLES<br />STREAMLIT APP</span><span className="cover-rule" /></div>}
              </div>
              <div className="project-row-content">
                <div className="project-row-top"><span className="project-number">0{index}</span><span className="project-status">{index === 3 ? 'In development' : 'Deployed'}</span></div>
                <h3>{project.name}</h3><div className="project-subtitle">{project.subtitle}</div>
                <div className="project-copy-blocks">
                  <div><h4>The problem</h4><p>{copy.problem}</p></div>
                  <div><h4>How it works</h4><p>{copy.how}</p></div>
                  <div><h4>Current status &amp; limits</h4><p>{copy.status}</p></div>
                </div>
                <div className="skill-list project-tags">{project.stack.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
                <div className="project-row-actions">
                  <a className="button button-primary" href={project.repo} target="_blank" rel="noopener noreferrer"><Github size={16} /> GitHub repository <ExternalLink size={14} /></a>
                  {project.key === 'harvest-shield' && <a className="button" href="https://harvest-sheild-api.onrender.com" target="_blank" rel="noopener noreferrer"><Globe2 size={16} /> Backend API <ExternalLink size={14} /></a>}
                  <button className="button button-quiet" onClick={() => setSelectedProject(project)}>View full details <ArrowRight size={16} /></button>
                </div>
              </div>
            </article>;
          })}
        </div>
      </section>
      <div className="marquee" aria-label="Technologies explored"><div className="container marquee-track">{techs.map((tech) => <span key={tech}>{tech}</span>)}</div></div>

      <section className="section container" id="about">
        <div className="section-head"><div className="eyebrow">02 / A little about how I build</div><h2>Curious by default.<br />Practical by design.</h2><p>A student learning by building, testing, and asking how the pieces fit together.</p></div>
        <div className="about-layout">
          <div className="about-copy">
            <p>{portfolioContent.about}</p>
            <div className="about-pull">Hands-on experiments, followed by a closer look at why they work.</div>
          </div>
          <div className="work-bento" aria-label="How I work">
            {portfolioContent.waysOfWorking.map((item, index) => {
              const Icon = [Terminal, Network, BrainCircuit, Lightbulb][index] || Lightbulb;
              return <div className="work-tile" key={item}><Icon size={20} /><strong>{item}</strong><small>{['Try, observe, refine.', 'Look beyond the interface.', 'Reasoning one problem at a time.', 'Explore useful applications.'][index]}</small></div>;
            })}
          </div>
        </div>
        <div className="timeline">
          <h3>Learning journey</h3>
          <div className="timeline-list">
            {portfolioContent.learningJourney.map((item) => <div className="timeline-item" key={item}><span className="timeline-mark" /><div><strong>{item}</strong></div></div>)}
          </div>
        </div>
      </section>

      <section className="section section-tint" id="skills">
        <div className="container">
          <div className="section-head"><div className="eyebrow">03 / Tools & foundations</div><h2>Building blocks I'm learning with.</h2><p>A grounded snapshot of the languages, tools, and concepts I've worked with—no proficiency scores, just honest context.</p></div>
          <div className="skills-grid">
            {portfolioContent.skills.map((group, index) => {
              const Icon = [Code2, PanelTop, Layers3, Compass][index] || Code2;
              return <div className="surface-card skill-card" key={group.category}>
                <div className="skill-icon"><Icon size={20} /></div><h3>{group.category}</h3>
                <p>{group.items.map((item) => item.level).filter((level, i, list) => list.indexOf(level) === i).join(' · ')}</p>
                <div className="skill-list">{group.items.map((item) => <span className="tag" key={item.name} title={item.level}>{item.name}</span>)}</div>
                <div className="skill-used">{group.items.flatMap((item) => projects.filter((project) => project.technologies.some((technology) => technology.toLowerCase() === item.name.toLowerCase())).map((project) => ({ item: item.name, project })))
                  .map(({ item, project }) => <button className="text-link" key={`${item}-${project.id}`} onClick={() => goTo('projects')}>{item} → {project.name}</button>)}
                  {!group.items.some((item) => projects.some((project) => project.technologies.some((technology) => technology.toLowerCase() === item.name.toLowerCase()))) && 'Learning in progress'}
                </div>
              </div>;
            })}
          </div>
          <div className="surface-card focus-panel"><strong>How I approach my learning</strong><div className="focus-items">{portfolioContent.waysOfWorking.map((item) => <span key={item}><CheckCircle2 size={16} /> {item}</span>)}</div></div>
        </div>
      </section>

      <section className="section section-tint" id="hackathons">
        <div className="container">
          <div className="section-head"><div className="eyebrow">04 / Hackathons & problem exploration</div><h2>Questions worth exploring.</h2><p>Participated in problem-solving settings and explored concepts. These are problem explorations—not claims of launched systems, awards, or validated solutions.</p></div>
          <div className="hack-grid">{portfolioContent.hackathons.map((hackathon, index) => {
            const Icon = [BriefcaseBusiness, Network, CalendarDays][index] || Compass;
            const linkedProject = 'projectId' in hackathon && hackathon.projectId
              ? projects.find((project) => project.id === hackathon.projectId)
              : undefined;
            return <article className="surface-card hack-card" key={hackathon.name}><Icon size={21} /><h3>{hackathon.name}</h3><p>{hackathon.note}</p><div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, flexWrap: 'wrap' }}><span className="project-status">Problem explored</span>{linkedProject && <a className="text-link" href={linkedProject.repo} target="_blank" rel="noopener noreferrer">{linkedProject.name} <ExternalLink size={12} /></a>}</div></article>;
          })}</div>
        </div>
      </section>

      <section className="section container" id="education">
        <div className="section-head"><div className="eyebrow">05 / Education</div><h2>Learning the foundations.</h2><p>My academic home and the context behind this work.</p></div>
        <div className="education-layout">
          <div className="surface-card education-card"><GraduationCap size={22} color="var(--accent-violet)" /><h3 style={{ marginTop: 13 }}>{portfolioContent.profile.college}</h3><p>{portfolioContent.profile.degree}</p><div className="edu-meta"><span className="tag">{portfolioContent.profile.year}</span><span className="tag">Expected graduation {portfolioContent.profile.expectedGraduation}</span></div></div>
          <div className="surface-card cgpa-card"><div><div className="eyebrow">ACADEMIC SNAPSHOT</div><strong>{portfolioContent.profile.firstYearOverallCgpa}</strong></div><small>First-year overall CGPA<br />Not a current SGPA or final CGPA</small></div>
        </div>
      </section>

      <section className="section section-tint" id="profiles">
        <div className="container">
          <div className="section-head"><div className="eyebrow">06 / Around the web</div><h2>Find me where I build and learn.</h2><p>Public profiles and live repository information, where available.</p></div>
          <div className="profile-grid">{portfolioContent.codingProfiles.map((profile) => {
            const Icon = profile.name === 'GitHub' ? Github : profile.name === 'LinkedIn' ? Linkedin : Code2;
            const content = <><Icon size={21} /><span><strong>{profile.name}</strong><small>{profile.username}</small></span>{profile.verified && <ExternalLink size={14} style={{ marginLeft: 'auto' }} />}</>;
            return profile.verified && profile.url
              ? <a className="profile-link" href={profile.url} target="_blank" rel="noopener noreferrer" key={profile.name}>{content}</a>
              : <div className="profile-link" key={profile.name}>{content}</div>;
          })}</div>
          <LiveRepositories data={github.data} isLoading={github.isLoading} isError={github.isError} refetch={github.refetch} />
        </div>
      </section>

      <section className="section container" id="learning-tools">
        <div className="section-head"><div className="eyebrow">07 / Learn by exploring</div><h2>A small space for the curious.</h2><p>Interactive study tools and a general roadmap. Checkmarks below are saved only in this browser; they do not represent {portfolioContent.profile.name}'s progress.</p></div>
        <h3 className="display" style={{ fontSize: '1.1rem', margin: '0 0 5px' }}>See how code speed scales</h3>
        <p className="bigo-intro">This chart shows how the work can grow as a program handles more input.</p><BigOVisualizer />
        <div style={{ marginTop: 27 }}><div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 13 }}><h3 className="display" style={{ fontSize: '1.1rem', margin: 0 }}>AI Full-Stack Developer Roadmap</h3><span className="tag">General learning guide</span></div><Roadmap /></div>
      </section>

      <section className="section section-tint" id="contact">
        <div className="container">
          <div className="section-head"><div className="eyebrow">08 / Contact</div><h2>Have an idea, question, or opportunity?</h2><p>I'm happy to connect about projects, learning, collaboration, and technical discussions.</p></div>
          <div className="contact-layout">
            <div className="surface-card contact-info"><h3>Let's start a conversation.</h3><p>Choose the channel that works for you. I look forward to hearing what you're exploring.</p>
              <div className="contact-way"><div className="contact-way-main"><Mail size={18} /><span><strong>{portfolioContent.profile.email}</strong><small>Direct email</small></span></div><div style={{ display: 'flex', gap: 7 }}><button className="icon-button" aria-label="Copy email address" onClick={copyEmail} data-testid="button-copy-email"><Copy size={15} /></button><a className="icon-button" aria-label="Send email" href={`mailto:${portfolioContent.profile.email}`}><ArrowRight size={15} /></a></div></div>
              <div className="contact-way"><div className="contact-way-main"><Linkedin size={18} /><span><strong>LinkedIn</strong><small>Connect professionally</small></span></div><a className="icon-button" href={portfolioContent.profile.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Open LinkedIn"><ExternalLink size={15} /></a></div>
              <div className="contact-way"><div className="contact-way-main"><Github size={18} /><span><strong>GitHub</strong><small>Projects and code</small></span></div><a className="icon-button" href={portfolioContent.profile.github} target="_blank" rel="noopener noreferrer" aria-label="Open GitHub"><ExternalLink size={15} /></a></div>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
    <footer className="site-footer"><div className="container footer-inner">
      <div><div className="brand-name">{portfolioContent.profile.name}</div><div className="footer-copy">Student developer, learning by building. © {new Date().getFullYear()}</div></div>
      <div className="footer-actions"><a className="icon-button" href={portfolioContent.profile.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub"><Github size={16} /></a><a className="icon-button" href={portfolioContent.profile.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><Linkedin size={16} /></a><ThemeToggle choice={choice} onSelect={select} /><button className="icon-button" onClick={() => goTo('top')} aria-label="Back to top"><ArrowUp size={16} /></button></div>
    </div></footer>
    <button className="button button-primary chat-launcher" onClick={() => setChatOpen(true)} aria-label="Open Jas AI assistant" title="Ask Jas AI"><Sparkles size={17} /><span>Ask Jas AI</span></button>
    {chatOpen && <ChatPanel status={chatStatus.data?.mode} close={() => setChatOpen(false)} />}
    {selectedProject && <ProjectDetails project={selectedProject} close={() => setSelectedProject(null)} />}
    {paletteOpen && <div className="palette-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setPaletteOpen(false); }}>
      <PaletteDialog query={paletteQuery} setQuery={setPaletteQuery} actions={paletteActions} onChoose={goTo} close={() => setPaletteOpen(false)} />
    </div>}
    <div className="toast-region" aria-live="polite">{toasts.map(({ id, text }) => <div className="toast" key={id}>{text}</div>)}</div>
    <button className="palette-trigger" aria-label="Open command palette" onClick={() => setPaletteOpen(true)} title="Command palette · Ctrl K" style={{ position: 'fixed', bottom: 24, left: 22, zIndex: 30, opacity: .78, width: 39, height: 39, display: 'grid', placeItems: 'center', borderRadius: '50%', border: '1px solid var(--line)', background: 'var(--surface-raised)', cursor: 'pointer' }}><Search size={16} /></button>
  </div>;
}

function LiveRepositories({ data, isLoading, isError, refetch }: { data?: GitHubRepository[]; isLoading: boolean; isError: boolean; refetch: () => unknown }) {
  if (isError) return <div className="surface-card repo-panel"><div className="repo-head"><h3>Public GitHub repositories</h3><button className="text-link" onClick={() => void refetch()}>Retry <RotateCcw size={13} /></button></div><p className="muted">Repository activity is temporarily unavailable.</p></div>;
  if (!isLoading && (!data || data.length === 0)) return null;
  return <div className="surface-card repo-panel"><div className="repo-head"><h3>Public GitHub repositories</h3><a className="text-link" href={portfolioContent.profile.github} target="_blank" rel="noopener noreferrer">All on GitHub <ExternalLink size={12} /></a></div>
    {isLoading ? <div aria-label="Loading repositories"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div> :
      <div className="repo-list">{data?.slice(0, 6).map((repo) => <RepositoryItem repo={repo} key={repo.htmlUrl} />)}</div>}
  </div>;
}

function RepositoryItem({ repo }: { repo: GitHubRepository }) {
  const date = new Date(repo.updatedAt);
  return <div className="repo-item"><a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer">{repo.name} <ExternalLink size={11} /></a>
    <p>{repo.description || 'Public repository'}</p><div className="repo-meta"><span>{repo.language || 'Language not specified'}</span><time dateTime={repo.updatedAt}>{Number.isNaN(date.getTime()) ? 'Updated date unavailable' : `Updated ${date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`}</time></div>
  </div>;
}

function ContactForm() {
  const submit = useSubmitPortfolioContact();
  const [values, setValues] = useState({ name: '', email: '', subject: '', message: '', website: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const update = (field: keyof typeof values, value: string) => setValues((old) => ({ ...old, [field]: value }));
  const validate = () => {
    const next: Record<string, string> = {};
    if (values.name.trim().length < 2 || values.name.length > 100) next.name = 'Please enter a name (2–100 characters).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || values.email.length > 254) next.email = 'Enter a valid email address.';
    if (values.subject.trim().length < 3 || values.subject.length > 160) next.subject = 'Subject should be 3–160 characters.';
    if (values.message.trim().length < 10 || values.message.length > 4000) next.message = 'Message should be 10–4,000 characters.';
    setErrors(next); return Object.keys(next).length === 0;
  };
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setNotice(null);
    if (!validate()) { setNotice({ text: 'Please review the highlighted fields.', error: true }); return; }
    if (values.website) return;
    submit.mutate({ data: { name: values.name.trim(), email: values.email.trim(), subject: values.subject.trim(), message: values.message.trim(), website: values.website } }, {
      onSuccess: () => { setNotice({ text: 'Your message was sent. Thank you for reaching out.', error: false }); setValues({ name: '', email: '', subject: '', message: '', website: '' }); setErrors({}); },
      onError: (error) => {
        const detail = typeof error === 'object' && error !== null && 'error' in error ? String(error.error) : error instanceof Error ? error.message : '';
        const unconfigured = /not configured|missing.*email|email.*disabled/i.test(detail);
        setNotice({ text: unconfigured ? 'The email service is not configured yet. Please use the direct email link.' : 'The message could not be sent. Please try again or use the direct email link.', error: true });
      },
    });
  };
  return <form className="surface-card contact-form" onSubmit={onSubmit} noValidate>
    {notice && <div className={`form-alert ${notice.error ? 'error' : ''}`} role="status" aria-live="polite">{notice.text}{notice.error && <a href={`mailto:${portfolioContent.profile.email}`} style={{ marginLeft: 5, textDecoration: 'underline' }}>Email directly</a>}</div>}
    <div className="form-grid">
      <div className="field"><label htmlFor="contact-name">Name</label><input id="contact-name" autoComplete="name" maxLength={100} value={values.name} onChange={(e) => update('name', e.target.value)} placeholder="Your name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'error-name' : undefined} />{errors.name && <small id="error-name" className="muted">{errors.name}</small>}</div>
      <div className="field"><label htmlFor="contact-email">Email</label><input id="contact-email" type="email" autoComplete="email" maxLength={254} value={values.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'error-email' : undefined} />{errors.email && <small id="error-email" className="muted">{errors.email}</small>}</div>
      <div className="field full"><label htmlFor="contact-subject">Subject</label><input id="contact-subject" maxLength={160} value={values.subject} onChange={(e) => update('subject', e.target.value)} placeholder="What would you like to talk about?" aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? 'error-subject' : undefined} />{errors.subject && <small id="error-subject" className="muted">{errors.subject}</small>}</div>
      <div className="field full"><label htmlFor="contact-message">Message</label><textarea id="contact-message" maxLength={4000} value={values.message} onChange={(e) => update('message', e.target.value)} placeholder="A little context helps me reply thoughtfully…" aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'error-message' : undefined} />{errors.message && <small id="error-message" className="muted">{errors.message}</small>}<div className="form-note" style={{ textAlign: 'right' }}>{values.message.length}/4000</div></div>
      <div className="honeypot" aria-hidden="true"><label htmlFor="contact-website">Website</label><input id="contact-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => update('website', e.target.value)} /></div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><span className="form-note">Your message will be sent to {portfolioContent.profile.name}.</span><button className="button button-primary" type="submit" disabled={submit.isPending}>{submit.isPending ? <><span className="status-dot" /> Sending…</> : <>Send message <Send size={15} /></>}</button></div>
  </form>;
}

type UiMessage = { role: 'user' | 'assistant'; content: string };
function ChatPanel({ status, close }: { status?: string; close: () => void }) {
  const offline = status === 'offline';
  const [audience, setAudience] = useState<ChatInput['audience']>('recruiter');
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streaming]);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const stop = () => { abortRef.current?.abort(); abortRef.current = null; setStreaming(false); };
  const reset = () => { stop(); setMessages([]); setError(''); setInput(''); };
  const send = async (text = input) => {
    const message = text.trim();
    if (!message || streaming || message.length > 2000) return;
    const nextMessages: UiMessage[] = [...messages, { role: 'user', content: message }, { role: 'assistant', content: '' }];
    setMessages(nextMessages); setInput(''); setError(''); setStreaming(true);
    const controller = new AbortController(); abortRef.current = controller;
    const history: ChatMessage[] = messages.slice(-12).map((item) => ({ role: item.role, content: item.content }));
    try {
      const payload: ChatInput = { message, history, audience };
      const response = await fetch(getStreamPortfolioChatUrl(), {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        credentials: 'include', body: JSON.stringify(payload), signal: controller.signal,
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: unknown } | null;
        const fallback = response.status === 429
          ? 'Rate limit reached, try again shortly'
          : response.status >= 400 && response.status < 500
            ? 'AI provider rejected the request'
            : 'AI provider is temporarily unavailable. Please try again shortly.';
        throw new Error(typeof result?.error === 'string' ? result.error : fallback);
      }
      if (!response.body) throw new Error('Streaming is not available in this browser.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const append = (chunk: string) => {
        if (!chunk) return;
        setMessages((current) => current.map((item, index) => index === current.length - 1 ? { ...item, content: item.content + chunk } : item));
      };
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        if (done && buffer) buffer += '\n\n';
        const events = buffer.split(/\r?\n\r?\n/); buffer = events.pop() || '';
        for (const event of events) {
          const data = event.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('\n');
          if (!data || data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            append(typeof parsed === 'string' ? parsed : parsed.delta ?? parsed.token ?? parsed.text ?? parsed.content ?? '');
          } catch (parseError) {
            if (parseError instanceof SyntaxError) append(data);
            else throw parseError;
          }
        }
        if (done) break;
      }
      setMessages((current) => current.map((item, index) => index === current.length - 1 && !item.content ? { ...item, content: 'I could not form a response. Please try asking another way.' } : item));
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message || 'Something went wrong. Please try again.');
        setMessages((current) => current[current.length - 1]?.content === '' ? current.slice(0, -1) : current);
      }
    } finally { if (abortRef.current === controller) abortRef.current = null; setStreaming(false); }
  };
  return <div className="chat-panel" role="dialog" aria-modal="true" aria-label="Jas AI assistant">
    <div className="chat-header"><div className="chat-title"><span className="ai-mark"><Sparkles size={18} /></span><span><strong>Jas AI</strong><small><span className="status-dot" style={{ width: 6, height: 6, animation: 'none' }} />{offline ? 'AI key not configured · offline mode' : 'Portfolio assistant'}</small></span></div>
      <div style={{ display: 'flex', gap: 7 }}><button className="icon-button" aria-label="Start a new chat" onClick={reset}><RotateCcw size={15} /></button><button className="icon-button" aria-label="Close Jas AI" onClick={close}><X size={17} /></button></div></div>
    <div className="chat-body" aria-live="polite" aria-relevant="additions text">
      {!messages.length && <><div className="chat-welcome">Hi! I'm Jas AI. Ask me about {portfolioContent.profile.name}'s projects, skills, and learning journey—or explore programming, DSA, AI, and full-stack development.{offline && <><br /><br /><strong>AI key not configured.</strong> Offline mode answers only from this portfolio's data. The owner can add an OpenAI API key in Replit Secrets to enable AI responses.</>}</div><div className="chat-suggestions">{quickPrompts.map((prompt) => <button className="suggestion" key={prompt} onClick={() => void send(prompt)}>{prompt}</button>)}</div></>}
      {messages.map((message, index) => <div key={`${index}-${message.role}`} className={`chat-msg ${message.role}`}>{message.content || (streaming && index === messages.length - 1 ? '…' : '')}{message.role === 'assistant' && streaming && index === messages.length - 1 && <span aria-hidden="true">▍</span>}</div>)}
      {error && <div className="form-alert error" role="alert">{error} <button className="text-link" onClick={() => void send(messages.at(-1)?.role === 'user' ? messages.at(-1)?.content || '' : '')}>Retry</button></div>}
      <div ref={endRef} />
    </div>
    <div className="audience-row" aria-label="Choose answer style">{([
      ['recruiter', 'Recruiter'], ['beginner', 'Student / beginner'], ['developer', 'Developer'], ['judge', 'Hackathon judge'],
    ] as const).map(([value, label]) => <button key={value} className={`audience-chip ${audience === value ? 'active' : ''}`} aria-pressed={audience === value} onClick={() => setAudience(value)}>{label}</button>)}</div>
    <div className="chat-entry"><textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question…" maxLength={2000} aria-label="Ask Jas AI a question" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }} />
      <div className="chat-entry-bottom"><span>{input.length}/2000 · Enter to send</span>{streaming ? <button className="icon-button" onClick={stop} aria-label="Stop response"><Square size={14} /></button> : <button className="icon-button" onClick={() => void send()} disabled={!input.trim()} aria-label="Send message"><Send size={15} /></button>}</div></div>
    <div className="chat-footnote">AI can make mistakes. Facts about {portfolioContent.profile.name} come from this portfolio.</div>
  </div>;
}

function Router() {
  return <ErrorBoundary resetKey={useLocation()[0]}><Switch>
    <Route path="/" component={Portfolio} /><Route component={NotFound} />
  </Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
