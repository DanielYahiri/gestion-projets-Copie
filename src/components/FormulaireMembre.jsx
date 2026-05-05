import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function FormulaireMembre({ membre = null, onFermer, onSuccess }) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', role: 'collaborateur', date_entree: '' })

  useEffect(() => {
    if (membre) setForm({ nom: membre.nom ?? '', prenom: membre.prenom ?? '', email: membre.email ?? '', role: membre.role ?? 'collaborateur', date_entree: membre.date_entree ?? '' })
  }, [membre])

  function changer(e) { const { name, value, type, checked } = e.target; setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value })) }

  async function soumettre() {
    if (!form.nom.trim() || !form.prenom.trim()) { setErreur('Le nom et le prénom sont obligatoires'); return }
    if (!form.email.trim()) { setErreur("L'email est obligatoire"); return }
    setEnvoi(true); setErreur('')
    const payload = { nom: form.nom, prenom: form.prenom, email: form.email, role: form.role, date_entree: form.date_entree || null }
    if (membre) {
      const { error } = await supabase.from('membre').update(payload).eq('membre_id', membre.membre_id)
      if (error) { setErreur('Erreur lors de la modification'); setEnvoi(false); return }
    } else {
      const { error: erreurInsert } = await supabase.from('membre').insert(payload)
      if (erreurInsert) { setErreur('Erreur lors de la création du membre'); setEnvoi(false); return }
      const { error: erreurInvit } = await supabase.functions.invoke('inviter-membre', { body: { email: form.email, nom: form.nom, prenom: form.prenom, role: form.role } })
      if (erreurInvit) { setErreur("Membre créé mais l'invitation mail a échoué."); setEnvoi(false); onSuccess(); return }
    }
    setEnvoi(false); onSuccess(); onFermer()
  }

  const labelStyle = { fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', display: 'block', marginBottom: '6px' }

  return (
    <div className="df-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="df-modal" style={{ width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', margin: '16px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--df-border)' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-primary)' }}>{membre ? 'Modifier le membre' : 'Nouveau membre'}</h2>
          <button onClick={onFermer} style={{ background: 'none', border: 'none', color: 'var(--df-text-tertiary)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {erreur && <div style={{ background: 'var(--df-danger-soft)', border: '1px solid var(--df-danger)', borderRadius: '10px', padding: '10px 14px' }}><p style={{ fontSize: '13px', color: 'var(--df-danger)' }}>{erreur}</p></div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={labelStyle}>Prénom <span style={{ color: 'var(--df-danger)' }}>*</span></label><input name="prenom" value={form.prenom} onChange={changer} placeholder="Prénom" className="df-input" /></div>
            <div><label style={labelStyle}>Nom <span style={{ color: 'var(--df-danger)' }}>*</span></label><input name="nom" value={form.nom} onChange={changer} placeholder="Nom" className="df-input" /></div>
          </div>
          <div>
            <label style={labelStyle}>Email <span style={{ color: 'var(--df-danger)' }}>*</span>{!membre && <span style={{ color: 'var(--df-text-tertiary)', fontWeight: 400, marginLeft: '6px' }}>(invitation envoyée)</span>}</label>
            <input name="email" value={form.email} onChange={changer} placeholder="email@exemple.com" disabled={!!membre} className="df-input" style={membre ? { opacity: 0.5 } : {}} />
          </div>
          <div><label style={labelStyle}>Rôle</label><select name="role" value={form.role} onChange={changer} className="df-input"><option value="data_scientist">Data Scientist</option><option value="data_scientist_junior">Data Scientist Jr</option><option value="data_analyst">Data Analyst</option><option value="data_engineer">Data Engineer</option><option value="ml_engineer">ML Engineer</option><option value="chef_de_projet">Chef de projet</option><option value="stagiaire">Stagiaire</option><option value="collaborateur">Collaborateur</option><option value="admin">Admin</option></select></div>
          <div><label style={labelStyle}>Date d'entrée</label><input name="date_entree" value={form.date_entree} onChange={changer} type="date" className="df-input" /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '20px 24px', borderTop: '1px solid var(--df-border)' }}>
          <button onClick={onFermer} className="df-btn-secondary">Annuler</button>
          <button onClick={soumettre} disabled={envoi} className="df-btn-primary">{envoi ? 'Enregistrement...' : membre ? 'Enregistrer' : 'Créer et inviter'}</button>
        </div>
      </div>
    </div>
  )
}

export default FormulaireMembre