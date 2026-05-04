import { useState } from 'react'
import { supabase } from '../supabase'
import { useMembreActif } from '../context/MembreContext'
import { useTheme } from '../context/ThemeContext'

function PageConnexion() {
  const { erreurAuth } = useMembreActif()
  const { theme, toggleTheme } = useTheme()
  const [mode, setMode] = useState('connexion')
  const [form, setForm] = useState({ email: '', motDePasse: '' })
  const [erreur, setErreur] = useState(erreurAuth || '')
  const [succes, setSucces] = useState('')
  const [envoi, setEnvoi] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErreur(''); setSucces('')
  }

  function basculerMode() {
    setMode(mode === 'connexion' ? 'reinitialisation' : 'connexion')
    setErreur(''); setSucces('')
  }

  async function handleConnexion() {
    if (!form.email.trim() || !form.motDePasse.trim()) { setErreur('Email et mot de passe requis.'); return }
    setErreur(''); setEnvoi(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.motDePasse })
      if (error) { setErreur('Email ou mot de passe incorrect.'); setEnvoi(false); return }
      const { data: membre, error: membreErr } = await supabase.from('membre').select('membre_id').eq('auth_id', data.user.id).single()
      if (membreErr || !membre) { await supabase.auth.signOut(); setErreur('Aucun profil membre associé à ce compte. Contactez un administrateur.'); setEnvoi(false); return }
    } catch (e) {
      if (e.name === 'AbortError') { setErreur('Le serveur ne répond pas. Réessayez dans quelques instants.') }
      else { setErreur('Impossible de se connecter. Vérifiez votre connexion internet.') }
      setEnvoi(false); return
    }
    setEnvoi(false)
  }

  async function handleReinitialisation() {
    if (!form.email.trim()) { setErreur('Veuillez entrer votre email.'); return }
    setErreur(''); setEnvoi(true)
    try {
      const { data, error } = await supabase.from('membre').select('membre_id').eq('email', form.email.trim()).single()
      if (error || !data) { setErreur("Si ce compte existe, un lien de réinitialisation a été envoyé."); setEnvoi(false); return }
      const { error: erreurReset } = await supabase.auth.resetPasswordForEmail(form.email.trim(), { redirectTo: window.location.origin + '/nouveau-mot-de-passe' })
      if (erreurReset) { setErreur("Erreur lors de l'envoi. Réessayez."); setEnvoi(false); return }
      setSucces('Lien envoyé ! Vérifiez votre boîte mail.')
    } catch (e) { setErreur('Impossible de se connecter au serveur. Vérifiez votre connexion.') }
    setEnvoi(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--df-bg-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Gradient orbs */}
      <div style={{
        position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        top: '-200px', right: '-200px', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
        bottom: '-200px', left: '-150px', pointerEvents: 'none',
      }} />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'absolute', top: '24px', right: '24px',
          padding: '10px', borderRadius: '12px',
          background: 'var(--df-bg-card)', border: '1px solid var(--df-border)',
          color: 'var(--df-text-secondary)', cursor: 'pointer',
          transition: 'all 0.2s ease', zIndex: 10,
        }}
        title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
      >
        {theme === 'dark' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        )}
      </button>

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 5 }} className="animate-scaleIn">
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
          <div className="df-logo-icon" style={{ width: '56px', height: '56px', marginBottom: '16px', boxShadow: '0 8px 32px rgba(99,102,241,0.3)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="df-logo-text" style={{ fontSize: '28px' }}>DataFlow</span>
          <span style={{ fontSize: '13px', color: 'var(--df-text-tertiary)', marginTop: '6px' }}>Gestion de projets Data</span>
        </div>

        {/* Card */}
        <div className="df-glass" style={{ borderRadius: '24px', padding: '36px', boxShadow: 'var(--df-shadow-xl)' }}>
          {mode === 'connexion' ? (
            <>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-primary)', marginBottom: '4px' }}>Connexion</h1>
              <p style={{ fontSize: '13px', color: 'var(--df-text-tertiary)', marginBottom: '28px' }}>Accès sur invitation uniquement.</p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-primary)', marginBottom: '4px' }}>Mot de passe oublié</h1>
              <p style={{ fontSize: '13px', color: 'var(--df-text-tertiary)', marginBottom: '28px' }}>Entrez votre email pour recevoir un lien de réinitialisation.</p>
            </>
          )}

          {(erreur || erreurAuth) && (
            <div style={{ background: 'var(--df-danger-soft)', border: '1px solid var(--df-danger)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--df-danger)' }}>{erreur || erreurAuth}</p>
            </div>
          )}

          {succes && (
            <div style={{ background: 'var(--df-success-soft)', border: '1px solid var(--df-success)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--df-success)' }}>{succes}</p>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Email</label>
            <input
              type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="votre@email.com" className="df-input"
            />
          </div>

          {mode === 'connexion' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Mot de passe</label>
              <input
                type="password" name="motDePasse" value={form.motDePasse} onChange={handleChange}
                placeholder="••••••••" className="df-input"
                onKeyDown={e => e.key === 'Enter' && handleConnexion()}
              />
            </div>
          )}

          <button
            onClick={mode === 'connexion' ? handleConnexion : handleReinitialisation}
            disabled={envoi}
            className="df-btn-primary"
            style={{ width: '100%', marginBottom: '16px', padding: '12px 20px' }}
          >
            {envoi ? (mode === 'connexion' ? 'Connexion...' : 'Envoi...') : (mode === 'connexion' ? 'Se connecter' : 'Envoyer le lien')}
          </button>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--df-text-tertiary)' }}>
            {mode === 'connexion' ? (
              <>
                Mot de passe oublié ?{' '}
                <button onClick={basculerMode} style={{ color: 'var(--df-accent)', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px' }}>Réinitialiser</button>
              </>
            ) : (
              <button onClick={basculerMode} style={{ color: 'var(--df-accent)', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px' }}>← Retour à la connexion</button>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PageConnexion