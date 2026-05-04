import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function FormulaireLivrable({ onFermer, onSuccess, livrableExistant, projetId }) {
  const [phases, setPhases] = useState([])
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({
    nom: livrableExistant?.livrable_nom || '', type: livrableExistant?.type || 'rapport',
    date_livraison: livrableExistant?.date_livraison || '', phase_id: livrableExistant?.phase_id || '',
    lien_fiche_technique: livrableExistant?.lien_fiche_technique || '', lien_fiche_presentable: livrableExistant?.lien_fiche_presentable || '',
  })

  useEffect(() => {
    async function chargerPhases() { const { data } = await supabase.from('phase').select('phase_id, nom, ordre').eq('projet_id', projetId).order('ordre'); setPhases(data || []) }
    chargerPhases()
  }, [])

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }) }

  async function handleSubmit() {
    if (!form.nom.trim()) { setErreur('Le nom du livrable est requis.'); return }
    setErreur(''); setEnvoi(true)
    const payload = { nom: form.nom, type: form.type, date_livraison: form.date_livraison || null, phase_id: form.phase_id || null, lien_fiche_technique: form.lien_fiche_technique || null, lien_fiche_presentable: form.lien_fiche_presentable || null, projet_id: projetId }
    let error
    if (livrableExistant) { const res = await supabase.from('livrable').update(payload).eq('livrable_id', livrableExistant.livrable_id); error = res.error }
    else { const res = await supabase.from('livrable').insert(payload); error = res.error }
    if (error) { setErreur('Une erreur est survenue.'); setEnvoi(false); return }
    setEnvoi(false); onSuccess(); onFermer()
  }

  const labelStyle = { fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', display: 'block', marginBottom: '6px' }

  return (
    <div className="df-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="df-modal" style={{ width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', margin: '16px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--df-border)' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-primary)' }}>{livrableExistant ? 'Modifier le livrable' : 'Nouveau livrable'}</h2>
          <button onClick={onFermer} style={{ background: 'none', border: 'none', color: 'var(--df-text-tertiary)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {erreur && <div style={{ background: 'var(--df-danger-soft)', border: '1px solid var(--df-danger)', borderRadius: '10px', padding: '10px 14px' }}><p style={{ fontSize: '13px', color: 'var(--df-danger)' }}>{erreur}</p></div>}
          <div><label style={labelStyle}>Nom du livrable <span style={{ color: 'var(--df-danger)' }}>*</span></label><input name="nom" value={form.nom} onChange={handleChange} placeholder="Ex: Rapport de segmentation" className="df-input" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={labelStyle}>Type</label><select name="type" value={form.type} onChange={handleChange} className="df-input"><option value="rapport">Rapport</option><option value="dashboard">Dashboard</option><option value="modele">Modèle</option><option value="presentation">Présentation</option><option value="autre">Autre</option></select></div>
            <div><label style={labelStyle}>Phase</label><select name="phase_id" value={form.phase_id} onChange={handleChange} className="df-input"><option value="">Aucune</option>{phases.map(ph => <option key={ph.phase_id} value={ph.phase_id}>{ph.ordre}. {ph.nom}</option>)}</select></div>
          </div>
          <div><label style={labelStyle}>Date de livraison</label><input type="date" name="date_livraison" value={form.date_livraison} onChange={handleChange} className="df-input" /></div>
          <div><label style={labelStyle}>Lien fiche technique</label><input type="url" name="lien_fiche_technique" value={form.lien_fiche_technique} onChange={handleChange} placeholder="https://..." className="df-input" /></div>
          <div><label style={labelStyle}>Lien fiche présentable</label><input type="url" name="lien_fiche_presentable" value={form.lien_fiche_presentable} onChange={handleChange} placeholder="https://..." className="df-input" /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '20px 24px', borderTop: '1px solid var(--df-border)' }}>
          <button onClick={onFermer} className="df-btn-secondary">Annuler</button>
          <button onClick={handleSubmit} disabled={envoi} className="df-btn-primary">{envoi ? 'Enregistrement...' : livrableExistant ? 'Modifier' : 'Créer le livrable'}</button>
        </div>
      </div>
    </div>
  )
}

export default FormulaireLivrable