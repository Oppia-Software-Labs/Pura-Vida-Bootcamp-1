import React, { useState, useEffect } from 'react';
import { Project, WalletState, Applicant, ProjectCategory, JobType } from './types';
import { INITIAL_PROJECTS } from './data/mockProjects';
import { Navbar } from './components/Navbar';
import { FaucetBanner } from './components/FaucetBanner';
import { ProjectCard } from './components/ProjectCard';
import { ProjectDetailsModal } from './components/ProjectDetailsModal';
import { NewProjectModal } from './components/NewProjectModal';
import { PaymentModal } from './components/PaymentModal';
import { connectFreighter, fetchAccountBalance } from './services/stellar';
import { Search, Filter, Sparkles, Coins, Users, Briefcase, Info, ArrowUpRight } from 'lucide-react';

export const App: React.FC = () => {
  // Wallet State
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    network: null,
    balanceXlm: null,
    loading: false,
    error: null
  });

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('stellar_chamba_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('stellar_chamba_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Projects State with LocalStorage persistence
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('stellar_chamba_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  useEffect(() => {
    localStorage.setItem('stellar_chamba_projects', JSON.stringify(projects));
  }, [projects]);

  // UI State
  const [activeTab, setActiveTab] = useState<'explore' | 'my-applications' | 'my-projects'>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');

  // Modals
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<{ project: Project; applicant: Applicant } | null>(null);

  // Connect Wallet Handler
  const handleConnect = async () => {
    setWallet((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { address, network } = await connectFreighter();
      const balance = await fetchAccountBalance(address);
      setWallet({
        connected: true,
        address,
        network,
        balanceXlm: balance,
        loading: false,
        error: null
      });
    } catch (err: any) {
      console.warn('Freighter connect error:', err);
      // Offer demo wallet option if Freighter is not detected
      const enableDemo = window.confirm(
        `${err.message || 'No se pudo conectar Freighter.'}\n\n¿Deseas conectar una Wallet de Demostración (Stellar Testnet) para explorar y evaluar la aplicación?`
      );

      if (enableDemo) {
        const demoAddress = 'GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVGAS';
        const balance = await fetchAccountBalance(demoAddress);
        setWallet({
          connected: true,
          address: demoAddress,
          network: 'TESTNET',
          balanceXlm: balance,
          loading: false,
          error: null
        });
      } else {
        setWallet((prev) => ({
          ...prev,
          loading: false,
          error: err.message
        }));
      }
    }
  };

  const handleDisconnect = () => {
    setWallet({
      connected: false,
      address: null,
      network: null,
      balanceXlm: null,
      loading: false,
      error: null
    });
  };

  const handleRefreshBalance = async () => {
    if (!wallet.address) return;
    const balance = await fetchAccountBalance(wallet.address);
    setWallet((prev) => ({ ...prev, balanceXlm: balance }));
  };

  // Add Project
  const handleAddProject = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
    setActiveTab('explore');
  };

  // Apply to project
  const handleApply = (projectId: string, appData: Omit<Applicant, 'id' | 'appliedAt' | 'status'>) => {
    const newApplicant: Applicant = {
      ...appData,
      id: `app-${Date.now()}`,
      appliedAt: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id === projectId) {
          const updated = {
            ...proj,
            applicants: [...proj.applicants, newApplicant]
          };
          if (selectedProject?.id === projectId) {
            setSelectedProject(updated);
          }
          return updated;
        }
        return proj;
      })
    );
  };

  // Initiate Payment Modal
  const handleInitiatePayment = (project: Project, applicant: Applicant) => {
    if (!wallet.connected || !wallet.address) {
      alert('Debes conectar tu wallet para liberar y firmar pagos en Stellar.');
      return;
    }
    setPaymentTarget({ project, applicant });
  };

  // Payment Success Handler
  const handlePaymentSuccess = (projectId: string, applicantId: string, txHash: string) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id === projectId) {
          const updatedApplicants = proj.applicants.map((app) =>
            app.id === applicantId ? { ...app, status: 'paid' as const, txHash } : app
          );
          const updatedProj = { ...proj, applicants: updatedApplicants, status: 'completed' as const };
          if (selectedProject?.id === projectId) {
            setSelectedProject(updatedProj);
          }
          return updatedProj;
        }
        return proj;
      })
    );
    handleRefreshBalance();
  };

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || project.category === selectedCategory;
    const matchesType = selectedType === 'All' || project.type === selectedType;

    if (activeTab === 'my-applications') {
      if (!wallet.address) return false;
      const applied = project.applicants.some(
        (a) => a.developerAddress.toLowerCase() === wallet.address?.toLowerCase()
      );
      return applied && matchesSearch;
    }

    if (activeTab === 'my-projects') {
      if (!wallet.address) return false;
      const isOwner = project.publisherAddress.toLowerCase() === wallet.address?.toLowerCase();
      return isOwner && matchesSearch;
    }

    return matchesSearch && matchesCategory && matchesType;
  });

  // Calculate statistics
  const totalRewardsPool = projects.reduce((acc, curr) => acc + curr.rewardXlm, 0);
  const totalApplicantsCount = projects.reduce((acc, curr) => acc + curr.applicants.length, 0);

  return (
    <div className="app-container">
      {/* Navbar */}
      <Navbar
        wallet={wallet}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onRefreshBalance={handleRefreshBalance}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Faucet Banner when connected */}
        {wallet.connected && wallet.address && (
          <FaucetBanner
            walletAddress={wallet.address}
            onFunded={handleRefreshBalance}
          />
        )}

        {/* Hero Section */}
        {activeTab === 'explore' && (
          <section className="hero-section">
            <div className="hero-pill">
              <span className="hero-pill-badge">Stellar Raven MCP</span>
              Impulsado por el ecosistema Soroban & Stellar
            </div>

            <h1 className="hero-title">
              Conectando el talento tech de <span className="gradient-text">Latinoamérica</span> con proyectos Web3
            </h1>

            <p className="hero-description">
              La primera plataforma de chambas y bounties freelance para desarrolladores latinoamericanos con remuneración transparente, instantánea y de bajo costo en <strong>Stellar Lumens (XLM)</strong>.
            </p>

            {/* Metrics Row */}
            <div className="metrics-row">
              <div className="metric-card">
                <div className="metric-icon-wrap bg-cyan-glow">
                  <Coins size={22} className="text-cyan" />
                </div>
                <div>
                  <div className="metric-number">{totalRewardsPool.toLocaleString()} XLM</div>
                  <div className="metric-label">Bolsa de Recompensas</div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrap bg-emerald-glow">
                  <Briefcase size={22} className="text-emerald" />
                </div>
                <div>
                  <div className="metric-number">{projects.length}</div>
                  <div className="metric-label">Proyectos y Bounties Activos</div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrap bg-purple-glow">
                  <Users size={22} className="text-purple" />
                </div>
                <div>
                  <div className="metric-number">{totalApplicantsCount}</div>
                  <div className="metric-label">Postulaciones de Devs LATAM</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Filters and Search Bar */}
        <div className="filter-controls-area">
          <div className="search-bar-wrap">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por tecnología (Rust, Soroban, React), empresa o país..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {activeTab === 'explore' && (
            <div className="pill-filters">
              {/* Category Dropdown */}
              <select
                className="filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">Todas las Categorías</option>
                <option value="Soroban">Soroban (Smart Contracts)</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Fullstack">Fullstack</option>
                <option value="Security">Seguridad</option>
              </select>

              {/* Type Dropdown */}
              <select
                className="filter-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="All">Cualquier Modalidad</option>
                <option value="Bounty">Bounties</option>
                <option value="Gig">Gigs Freelance</option>
                <option value="Full-time">Tiempo Completo</option>
                <option value="Part-time">Medio Tiempo</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab Heading & View Details */}
        {activeTab !== 'explore' && (
          <div className="tab-heading-row">
            <div>
              <h2 className="tab-title">
                {activeTab === 'my-applications' ? 'Mis Postulaciones' : 'Mis Proyectos Publicados'}
              </h2>
              <p className="tab-subtitle">
                {activeTab === 'my-applications'
                  ? 'Gestiona tus candidaturas y el estado de tus pagos en XLM.'
                  : 'Administra tus publicaciones y libera los fondos a los desarrolladores seleccionados.'}
              </p>
            </div>
            {activeTab === 'my-projects' && (
              <button className="btn btn-primary btn-sm" onClick={() => setIsNewProjectOpen(true)}>
                <Sparkles size={16} /> Publicar Nuevo Proyecto
              </button>
            )}
          </div>
        )}

        {/* Project Cards Grid */}
        {filteredProjects.length === 0 ? (
          <div className="empty-state">
            <Briefcase size={40} className="empty-icon text-muted" />
            <h3 className="empty-title">No se encontraron proyectos</h3>
            <p className="empty-desc">
              {activeTab === 'my-applications'
                ? 'Aún no te has postulado a ningún proyecto. Conecta tu wallet y aplica a una de las oportunidades abiertas.'
                : activeTab === 'my-projects'
                ? 'No has publicado proyectos desde esta dirección de wallet todavía.'
                : 'Intenta ajustar los filtros de búsqueda o categoría.'}
            </p>
            {activeTab !== 'explore' && (
              <button className="btn btn-secondary mt-3" onClick={() => setActiveTab('explore')}>
                Explorar todos los proyectos
              </button>
            )}
          </div>
        ) : (
          <div className="projects-grid">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onSelect={(proj) => setSelectedProject(proj)}
                isOwner={
                  wallet.address
                    ? project.publisherAddress.toLowerCase() === wallet.address.toLowerCase()
                    : false
                }
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div>
            <div className="footer-brand">
              <span>✦</span> StellarChamba LATAM
            </div>
            <div className="footer-subtext">
              Desarrollado para el <strong>Pura Vida Bootcamp 1</strong> (Stellar & Soroban) · Entregable 1
            </div>
          </div>
          <div className="footer-links">
            <a href="https://stellar.org" target="_blank" rel="noreferrer" className="footer-link">
              Stellar.org <ArrowUpRight size={14} />
            </a>
            <a href="https://raven.stellar.org" target="_blank" rel="noreferrer" className="footer-link">
              Stellar Raven MCP <ArrowUpRight size={14} />
            </a>
            <a href="https://developers.stellar.org/docs" target="_blank" rel="noreferrer" className="footer-link">
              Docs Soroban <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          walletAddress={wallet.address}
          onApply={handleApply}
          onInitiatePayment={handleInitiatePayment}
          isOwner={
            wallet.address
              ? selectedProject.publisherAddress.toLowerCase() === wallet.address.toLowerCase()
              : false
          }
        />
      )}

      {isNewProjectOpen && (
        <NewProjectModal
          onClose={() => setIsNewProjectOpen(false)}
          onAddProject={handleAddProject}
          publisherAddress={wallet.address}
        />
      )}

      {paymentTarget && wallet.address && (
        <PaymentModal
          project={paymentTarget.project}
          applicant={paymentTarget.applicant}
          fromAddress={wallet.address}
          onClose={() => setPaymentTarget(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
