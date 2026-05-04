import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

function PageNouveauMotDePasse() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [form, setForm] = useState({ motDePasse: '', confirmation: '' })
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [sessionPrete, setSessionPrete] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && session) setSessionPrete(true)
    })
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) setSessionPrete(true) })
    const timeout = setTimeout(() => { setSessionPrete(prev => { if (!prev) setErreur('Le lien est invalide ou a expiré. Demandez un nouveau lien.'); return prev }) }, 10000)
    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [])

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); setErreur('') }

  async function handleSubmit() {
    if (!form.motDePasse.trim()) { setErreur('Le mot de passe est requis.'); return }
    if (form.motDePasse.length < 8) { setErreur('Le mot de passe doit contenir au moins 8 caractères.'); return }
    if (form.motDePasse !== form.confirmation) { setErreur('Les mots de passe ne correspondent pas.'); return }
    setErreur(''); setEnvoi(true)
    const { error } = await supabase.auth.updateUser({ password: form.motDePasse })
    if (error) { setErreur('Erreur lors de la mise à jour. Réessayez.'); setEnvoi(false); return }
    setSucces('Mot de passe mis à jour avec succès !'); setEnvoi(false)
    setTimeout(async () => { await supabase.auth.signOut(); navigate('/connexion') }, 2000)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--df-bg-primary)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', top: '-200px', right: '-200px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', bottom: '-200px', left: '-150px', pointerEvents: 'none' }} />

      <button onClick={toggleTheme} style={{ position: 'absolute', top: '24px', right: '24px', padding: '10px', borderRadius: '12px', background: 'var(--df-bg-card)', border: '1px solid var(--df-border)', color: 'var(--df-text-secondary)', cursor: 'pointer', transition: 'all 0.2s ease', zIndex: 10 }}>
        {theme === 'dark' ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
      </button>

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 5 }} className="animate-scaleIn">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
          <div className="df-logo-icon" style={{ width: '56px', height: '56px', marginBottom: '16px', boxShadow: '0 8px 32px rgba(99,102,241,0.3)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          </div>
          <span className="df-logo-text" style={{ fontSize: '28px' }}>DataFlow</span>
        </div>

        <div className="df-glass" style={{ borderRadius: '24px', padding: '36px', boxShadow: 'var(--df-shadow-xl)' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-primary)', marginBottom: '4px' }}>Nouveau mot de passe</h1>
          <p style={{ fontSize: '13px', color: 'var(--df-text-tertiary)', marginBottom: '28px' }}>Choisissez un nouveau mot de passe pour votre compte.</p>

          {!sessionPrete && !succes && !erreur && (
            <div style={{ background: 'var(--df-warning-soft)', border: '1px solid var(--df-warning)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--df-warning)' }}>Vérification du lien en cours...</p>
            </div>
          )}
          {erreur && (
            <div style={{ background: 'var(--df-danger-soft)', border: '1px solid var(--df-danger)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--df-danger)' }}>{erreur}</p>
            </div>
          )}
          {succes && (
            <div style={{ background: 'var(--df-success-soft)', border: '1px solid var(--df-success)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--df-success)' }}>{succes}</p>
              <p style={{ fontSize: '11px', color: 'var(--df-success)', marginTop: '4px' }}>Redirection vers la connexion...</p>
            </div>
          )}

          {sessionPrete && !succes && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nouveau mot de passe <span style={{ color: 'var(--df-danger)' }}>*</span></label>
                <input type="password" name="motDePasse" value={form.motDePasse} onChange={handleChange} placeholder="Min. 8 caractères" className="df-input" />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Confirmer le mot de passe <span style={{ color: 'var(--df-danger)' }}>*</span></label>
                <input type="password" name="confirmation" value={form.confirmation} onChange={handleChange} placeholder="Répétez le mot de passe" className="df-input" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
              <button onClick={handleSubmit} disabled={envoi} className="df-btn-primary" style={{ width: '100%', padding: '12px 20px' }}>
                {envoi ? 'Mise à jour...' : 'Enregistrer le mot de passe'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PageNouveauMotDePasse