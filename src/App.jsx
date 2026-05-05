import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { useMembreActif } from './context/MembreContext'
import { useTheme } from './context/ThemeContext'
import Projets from './pages/Projets'
import Clients from './pages/Clients'
import Membres from './pages/Membres'
import ProjetDetail from './pages/ProjetDetail'
import ClientDetail from './pages/ClientDetail'
import MembreDetail from './pages/MembreDetail'
import Dashboard from './pages/Dashboard'
import PageConnexion from './pages/PageConnexion'
import PageNouveauMotDePasse from './pages/PageNouveauMotDePasse'
import Chargement from './components/Chargement'
import Enigme from './components/Enigme'
import './App.css'

/* ──────────── Le mail magique qui ouvre toutes les portes ──────────── */
const EMAIL_SUPER_ADMIN = 'bohdaniel946@gmail.com'

/* ──────────── Mes super icônes dessinées à la main (ou presque) ──────────── */
function IconDashboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function IconProjets() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconClients() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconMembres() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function IconPanelLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  )
}

/* ──────────── Le lien magique qui nous transporte ailleurs ──────────── */
function NavItem({ to, icon, label, onClick }) {
  const location = useLocation()
  const actif = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`df-nav-link ${actif ? 'active' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

/* ──────────── Halte là ! Seuls les membres VIP passent ──────────── */
function RouteProtegee({ children, adminSeulement = false }) {
  const { membreActif, chargementAuth } = useMembreActif()

  if (chargementAuth) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--df-bg-primary)' }}>
      <Chargement nombre={3} />
    </div>
  )

  if (!membreActif) return <Navigate to="/connexion" replace />

  if (adminSeulement && membreActif.role !== 'admin') {
    return <Navigate to="/projets" replace />
  }

  return children
}

/* ──────────── La fameuse barre latérale (qui aime bien jouer à cache-cache) ──────────── */
function Sidebar({ membreActif, estAdmin, deconnexion, collapsed, setCollapsed }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      {/* Overlay — visible when sidebar is open on any screen */}
      {!collapsed && (
        <div
          className="df-sidebar-overlay"
          style={{ display: 'none' }}
          onClick={() => setCollapsed(true)}
        />
      )}

      <aside className={`df-sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Logo + Close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px 28px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="df-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="df-logo-text">DataFlow</span>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="df-hamburger"
            title="Masquer le menu"
            style={{ width: '32px', height: '32px', border: 'none', background: 'transparent' }}
          >
            <IconPanelLeft />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0 12px' }}>
          <p className="df-section-title">Menu</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {estAdmin && (
              <NavItem to="/" icon={<IconDashboard />} label="Dashboard" onClick={() => setCollapsed(true)} />
            )}
            <NavItem to="/projets" icon={<IconProjets />} label="Projets" onClick={() => setCollapsed(true)} />
            {estAdmin && (
              <>
                <NavItem to="/clients" icon={<IconClients />} label="Clients" onClick={() => setCollapsed(true)} />
                <NavItem to="/membres" icon={<IconMembres />} label="Membres" onClick={() => setCollapsed(true)} />
              </>
            )}
          </div>
        </nav>

        {/* Theme toggle */}
        <div style={{ padding: '0 12px', marginBottom: '8px' }}>
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--df-bg-tertiary)',
              color: 'var(--df-text-secondary)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
            <span>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>
          </button>
        </div>

        {/* User card */}
        <div className="df-user-card">
          <div className="df-avatar df-avatar-md">
            {membreActif.prenom?.[0]}{membreActif.nom?.[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {membreActif.prenom} {membreActif.nom}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)', textTransform: 'capitalize' }}>
              {membreActif.role?.replace(/_/g, ' ')}
            </p>
          </div>
          <button
            onClick={deconnexion}
            title="Déconnexion"
            style={{
              padding: '6px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: 'var(--df-text-tertiary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--df-danger)'; e.currentTarget.style.background = 'var(--df-danger-soft)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--df-text-tertiary)'; e.currentTarget.style.background = 'transparent' }}
          >
            <IconLogout />
          </button>
        </div>
      </aside>
    </>
  )
}

/* ──────────── La barre du haut (notre plan B quand le menu fait sa sieste) ──────────── */
function TopBar({ collapsed, setCollapsed, membreActif }) {
  if (!collapsed) return null

  return (
    <div className="df-topbar">
      <button
        onClick={() => setCollapsed(false)}
        className="df-hamburger"
        title="Afficher le menu"
      >
        <IconMenu />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        <div className="df-logo-icon" style={{ width: '30px', height: '30px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <span className="df-logo-text" style={{ fontSize: '17px' }}>DataFlow</span>
      </div>

      <div className="df-avatar df-avatar-sm">
        {membreActif.prenom?.[0]}{membreActif.nom?.[0]}
      </div>
    </div>
  )
}

/* ──────────── Le grand chef d'orchestre de l'application ──────────── */
function App() {
  const { membreActif, chargementAuth, deconnexion } = useMembreActif()
  /* on donne l'acces juste qu'au membre admin */
  const estAdmin = membreActif?.role === 'admin'
  const estCollaborateur = !estAdmin
  const [collapsed, setCollapsed] = useState(false)

  /* ──── Le piège à énigmes (héhé, t'y échapperas pas) ──── */
  const [enigmeVisible, setEnigmeVisible] = useState(false)

  useEffect(() => {
    if (!membreActif) return
    /* Premier passage ? Cadeau : 40 secondes de paix */
    const unlockUntil = parseInt(localStorage.getItem('df-enigme-unlock-until') || '0')
    if (unlockUntil === 0) {
      localStorage.setItem('df-enigme-unlock-until', String(Date.now() + 40000))
      localStorage.setItem('df-enigme-duree', '40')
    }
    /* On vérifie toutes les secondes si le temps est écoulé (on est vicieux) */
    const intervalle = setInterval(() => {
      const limite = parseInt(localStorage.getItem('df-enigme-unlock-until') || '0')
      if (Date.now() > limite) setEnigmeVisible(true)
    }, 1000)
    return () => clearInterval(intervalle)
  }, [membreActif])

  function onEnigmeResolue() {
    /* Bravo ! Tu gagnes 10x plus de temps (ça monte viiiiite) */
    const dureePrecedente = parseInt(localStorage.getItem('df-enigme-duree') || '40')
    const nouvelleDuree = dureePrecedente * 10
    localStorage.setItem('df-enigme-duree', String(nouvelleDuree))
    localStorage.setItem('df-enigme-unlock-until', String(Date.now() + nouvelleDuree * 1000))
    setEnigmeVisible(false)
  }

  if (chargementAuth) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--df-bg-primary)' }}>
      <Chargement nombre={3} />
    </div>
  )

  return (
    <BrowserRouter>
      {membreActif ? (
        <div className="df-layout">
          <Sidebar
            membreActif={membreActif}
            estAdmin={estAdmin}
            deconnexion={deconnexion}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />

          <div className={`df-main ${collapsed ? 'expanded' : ''}`}>
            <TopBar collapsed={collapsed} setCollapsed={setCollapsed} membreActif={membreActif} />

            <main style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
              <Routes>
                <Route path="/" element={
                  <RouteProtegee adminSeulement={true}>
                    <Dashboard />
                  </RouteProtegee>
                } />

                <Route path="/projets" element={
                  <RouteProtegee>
                    <Projets />
                  </RouteProtegee>
                } />
                <Route path="/projets/:id" element={
                  <RouteProtegee>
                    <ProjetDetail />
                  </RouteProtegee>
                } />

                <Route path="/clients" element={
                  <RouteProtegee adminSeulement={true}>
                    <Clients />
                  </RouteProtegee>
                } />
                <Route path="/clients/:id" element={
                  <RouteProtegee adminSeulement={true}>
                    <ClientDetail />
                  </RouteProtegee>
                } />

                <Route path="/membres" element={
                  <RouteProtegee adminSeulement={true}>
                    <Membres />
                  </RouteProtegee>
                } />
                <Route path="/membres/:id" element={
                  <RouteProtegee adminSeulement={true}>
                    <MembreDetail />
                  </RouteProtegee>
                } />

                <Route path="*" element={<Navigate to="/projets" replace />} />
              </Routes>
            </main>
          </div>
          {/* Le mur d'énigmes — personne n'y échappe */}
          {enigmeVisible && <Enigme onResolue={onEnigmeResolue} />}
        </div>
      ) : (
        <Routes>
          <Route path="/connexion" element={<PageConnexion />} />
          <Route path="/nouveau-mot-de-passe" element={<PageNouveauMotDePasse />} />
          <Route path="*" element={<Navigate to="/connexion" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  )
}

export default App