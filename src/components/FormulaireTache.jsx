import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function FormulaireTache({ tache = null, projetId, onFermer, onSuccess }) {
  const [phases, setPhases] = useState([])
  const [membres, setMembres] = useState([])
  const [membresAffectes, setMembresAffectes] = useState([])
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({
    titre: '', description: '', statut: 'a_faire', priorite: 'moyenne',
    date_debut: '', date_echeance: '', phase_id: '',
  })

  useEffect(() => {
    async function init() {
      const { data: dataPhases } = await supabase.from('phase').select('phase_id, nom, ordre').eq('projet_id', projetId).order('ordre')
      setPhases(dataPhases || [])
      const { data: dataMembres } = await supabase.from('membre').select('membre_id, nom, prenom').order('nom')
      setMembres(dataMembres || [])
      if (tache) {
        setForm({ titre: tache.titre || '', description: tache.description || '', statut: tache.statut || 'a_faire', priorite: tache.priorite || 'moyenne', date_debut: tache.date_debut || '', date_echeance: tache.date_echeance || '', phase_id: tache.phase_id || '' })
        const membresT = Array.isArray(tache.membres_affectes) ? tache.membres_affectes : (() => { try { return JSON.parse(tache.membres_affectes || '[]') } catch { return [] } })()
        setMembresAffectes(membresT.map(m => m.membre_id))
      }
    }
    init()
  }, [])

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }) }

  function toggleMembre(id) { setMembresAffectes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }

  async function handleSubmit() {
    if (!form.titre.trim()) { setErreur('Le titre est requis.'); return }
    setErreur(''); setEnvoi(true)
    const payload = { titre: form.titre, description: form.description || null, statut: form.statut, priorite: form.priorite, date_debut: form.date_debut || null, date_echeance: form.date_echeance || null, phase_id: form.phase_id || null, projet_id: projetId }
    let tacheId = tache?.tache_id
    if (tache) { const { error } = await supabase.from('tache').update(payload).eq('tache_id', tacheId); if (error) { setErreur('Erreur.'); setEnvoi(false); return } }
    else { const { data, error } = await supabase.from('tache').insert(payload).select('tache_id').single(); if (error) { setErreur('Erreur.'); setEnvoi(false); return }; tacheId = data.tache_id }
    await supabase.from('affectation_membre').delete().eq('tache_id', tacheId)
    if (membresAffectes.length > 0) { await supabase.from('affectation_membre').insert(membresAffectes.map(mid => ({ tache_id: tacheId, membre_id: mid }))) }
    setEnvoi(false); onSuccess(); onFermer()
  }

  const labelStyle = { fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', display: 'block', marginBottom: '6px' }

  return (
    <div className="df-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="df-modal" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', margin: '16px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--df-border)' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-primary)' }}>{tache ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
          <button onClick={onFermer} style={{ background: 'none', border: 'none', color: 'var(--df-text-tertiary)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {erreur && <div style={{ background: 'var(--df-danger-soft)', border: '1px solid var(--df-danger)', borderRadius: '10px', padding: '10px 14px' }}><p style={{ fontSize: '13px', color: 'var(--df-danger)' }}>{erreur}</p></div>}
          <div><label style={labelStyle}>Titre <span style={{ color: 'var(--df-danger)' }}>*</span></label><input name="titre" value={form.titre} onChange={handleChange} placeholder="Ex: Nettoyer les données" className="df-input" /></div>
          <div><label style={labelStyle}>Description</label><textarea name="description" value={form.description} onChange={handleChange} placeholder="Description de la tâche..." rows={3} className="df-input" style={{ resize: 'none' }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={labelStyle}>Statut</label><select name="statut" value={form.statut} onChange={handleChange} className="df-input"><option value="a_faire">À faire</option><option value="en_cours">En cours</option><option value="termine">Terminé</option><option value="bloque">Bloqué</option></select></div>
            <div><label style={labelStyle}>Priorité</label><select name="priorite" value={form.priorite} onChange={handleChange} className="df-input"><option value="basse">Basse</option><option value="moyenne">Moyenne</option><option value="haute">Haute</option></select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={labelStyle}>Date début</label><input type="date" name="date_debut" value={form.date_debut} onChange={handleChange} className="df-input" /></div>
            <div><label style={labelStyle}>Échéance</label><input type="date" name="date_echeance" value={form.date_echeance} onChange={handleChange} className="df-input" /></div>
          </div>
          <div><label style={labelStyle}>Phase</label><select name="phase_id" value={form.phase_id} onChange={handleChange} className="df-input"><option value="">Aucune</option>{phases.map(ph => <option key={ph.phase_id} value={ph.phase_id}>{ph.ordre}. {ph.nom}</option>)}</select></div>
          <div>
            <label style={labelStyle}>Membres assignés</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {membres.map(m => {
                const selected = membresAffectes.includes(m.membre_id)
                return (
                  <button key={m.membre_id} onClick={() => toggleMembre(m.membre_id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease', border: selected ? '1px solid var(--df-accent)' : '1px solid var(--df-border)', background: selected ? 'var(--df-accent-soft)' : 'var(--df-bg-tertiary)', color: selected ? 'var(--df-accent)' : 'var(--df-text-secondary)' }}>
                    <div className="df-avatar df-avatar-sm" style={{ width: '20px', height: '20px', fontSize: '8px' }}>{m.prenom?.[0]}{m.nom?.[0]}</div>
                    {m.prenom} {m.nom}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '20px 24px', borderTop: '1px solid var(--df-border)' }}>
          <button onClick={onFermer} className="df-btn-secondary">Annuler</button>
          <button onClick={handleSubmit} disabled={envoi} className="df-btn-primary">{envoi ? 'Enregistrement...' : tache ? 'Enregistrer' : 'Créer la tâche'}</button>
        </div>
      </div>
    </div>
  )
}

export default FormulaireTache