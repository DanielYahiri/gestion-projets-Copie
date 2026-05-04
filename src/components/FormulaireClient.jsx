import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function FormulaireClient({ client = null, onFermer, onSuccess }) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({ nom: '', secteur_activite: '', email_contact: '', telephone: '', adresse: '', date_premier_contrat: '' })

  useEffect(() => {
    if (client) setForm({ nom: client.client_nom ?? '', secteur_activite: client.secteur_activite ?? '', email_contact: client.email_contact ?? '', telephone: client.telephone ?? '', adresse: client.adresse ?? '', date_premier_contrat: client.date_premier_contrat ?? '' })
  }, [client])

  function changer(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  async function soumettre() {
    if (!form.nom.trim()) { setErreur('Le nom est obligatoire'); return }
    setEnvoi(true); setErreur('')
    const payload = { nom: form.nom, secteur_activite: form.secteur_activite || null, email_contact: form.email_contact || null, telephone: form.telephone || null, adresse: form.adresse || null, date_premier_contrat: form.date_premier_contrat || null }
    if (client) { const { error } = await supabase.from('client').update(payload).eq('client_id', client.client_id); if (error) { setErreur('Erreur lors de la modification'); setEnvoi(false); return } }
    else { const { error } = await supabase.from('client').insert(payload); if (error) { setErreur('Erreur lors de la création'); setEnvoi(false); return } }
    setEnvoi(false); onSuccess(); onFermer()
  }

  const labelStyle = { fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', display: 'block', marginBottom: '6px' }

  return (
    <div className="df-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="df-modal" style={{ width: '100%', maxWidth: '480px', margin: '16px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--df-border)' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-primary)' }}>{client ? 'Modifier le client' : 'Nouveau client'}</h2>
          <button onClick={onFermer} style={{ background: 'none', border: 'none', color: 'var(--df-text-tertiary)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {erreur && <div style={{ background: 'var(--df-danger-soft)', border: '1px solid var(--df-danger)', borderRadius: '10px', padding: '10px 14px' }}><p style={{ fontSize: '13px', color: 'var(--df-danger)' }}>{erreur}</p></div>}
          <div><label style={labelStyle}>Nom <span style={{ color: 'var(--df-danger)' }}>*</span></label><input name="nom" value={form.nom} onChange={changer} placeholder="Nom du client" className="df-input" /></div>
          <div><label style={labelStyle}>Secteur d'activité</label><input name="secteur_activite" value={form.secteur_activite} onChange={changer} placeholder="Ex : Banque, Commerce..." className="df-input" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={labelStyle}>Email</label><input name="email_contact" value={form.email_contact} onChange={changer} placeholder="email@exemple.com" className="df-input" /></div>
            <div><label style={labelStyle}>Téléphone</label><input name="telephone" value={form.telephone} onChange={changer} placeholder="+225 00 00 00 00" className="df-input" /></div>
          </div>
          <div><label style={labelStyle}>Adresse</label><input name="adresse" value={form.adresse} onChange={changer} placeholder="Adresse du client" className="df-input" /></div>
          <div><label style={labelStyle}>Date premier contrat</label><input type="date" name="date_premier_contrat" value={form.date_premier_contrat} onChange={changer} className="df-input" /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '20px 24px', borderTop: '1px solid var(--df-border)' }}>
          <button onClick={onFermer} className="df-btn-secondary">Annuler</button>
          <button onClick={soumettre} disabled={envoi} className="df-btn-primary">{envoi ? 'Enregistrement...' : client ? 'Enregistrer' : 'Créer le client'}</button>
        </div>
      </div>
    </div>
  )
}

export default FormulaireClient