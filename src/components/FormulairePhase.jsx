import { useState } from 'react'
import { supabase } from '../supabase'

function FormulairePhase({ onFermer, onSuccess, phaseExistante, projetId }) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({ nom: phaseExistante?.nom || '', description: phaseExistante?.description || '', ordre: phaseExistante?.ordre || '' })

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }) }

  async function handleSubmit() {
    if (!form.nom.trim()) { setErreur('Le nom de la phase est requis.'); return }
    if (!form.ordre) { setErreur("L'ordre est requis."); return }
    setErreur(''); setEnvoi(true)
    const payload = { nom: form.nom, description: form.description || null, ordre: Number(form.ordre), projet_id: projetId }
    let error
    if (phaseExistante) { const res = await supabase.from('phase').update(payload).eq('phase_id', phaseExistante.phase_id); error = res.error }
    else { const res = await supabase.from('phase').insert(payload); error = res.error }
    if (error) { setErreur('Une erreur est survenue.'); setEnvoi(false); return }
    setEnvoi(false); onSuccess(); onFermer()
  }

  const labelStyle = { fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', display: 'block', marginBottom: '6px' }

  return (
    <div className="df-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="df-modal" style={{ width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', margin: '16px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--df-border)' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-primary)' }}>{phaseExistante ? 'Modifier la phase' : 'Nouvelle phase'}</h2>
          <button onClick={onFermer} style={{ background: 'none', border: 'none', color: 'var(--df-text-tertiary)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {erreur && <div style={{ background: 'var(--df-danger-soft)', border: '1px solid var(--df-danger)', borderRadius: '10px', padding: '10px 14px' }}><p style={{ fontSize: '13px', color: 'var(--df-danger)' }}>{erreur}</p></div>}
          <div><label style={labelStyle}>Nom de la phase <span style={{ color: 'var(--df-danger)' }}>*</span></label><input name="nom" value={form.nom} onChange={handleChange} placeholder="Ex: Collecte des données" className="df-input" /></div>
          <div><label style={labelStyle}>Description</label><textarea name="description" value={form.description} onChange={handleChange} placeholder="Décrivez cette phase..." rows={3} className="df-input" style={{ resize: 'none' }} /></div>
          <div><label style={labelStyle}>Ordre <span style={{ color: 'var(--df-danger)' }}>*</span></label><input type="number" name="ordre" value={form.ordre} onChange={handleChange} placeholder="Ex: 1" min="1" className="df-input" /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '20px 24px', borderTop: '1px solid var(--df-border)' }}>
          <button onClick={onFermer} className="df-btn-secondary">Annuler</button>
          <button onClick={handleSubmit} disabled={envoi} className="df-btn-primary">{envoi ? 'Enregistrement...' : phaseExistante ? 'Modifier' : 'Créer la phase'}</button>
        </div>
      </div>
    </div>
  )
}

export default FormulairePhase