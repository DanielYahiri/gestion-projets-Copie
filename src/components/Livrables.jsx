import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import FormulaireLivrable from './FormulaireLivrable'

function Livrables({ projetId, estAdmin }) {
  const [livrables, setLivrables] = useState([])
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const [livrableModif, setLivrableModif] = useState(null)

  async function chargerLivrables() {
    const { data, error } = await supabase.from('vue_livrable_projet').select('*').eq('projet_id', projetId).order('date_livraison', { ascending: true })
    if (error) { console.log('Erreur :', error); return }
    setLivrables(data)
  }

  useEffect(() => { chargerLivrables() }, [projetId])

  function badgeType(type) {
    const icons = { rapport: '📄', dashboard: '📊', modele: '🧠', presentation: '📽️', autre: '📎' }
    return <span className="df-badge" style={{ background: 'var(--df-accent-soft)', color: 'var(--df-accent)' }}>{icons[type] || '📎'} {type}</span>
  }

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        {estAdmin && (
          <button onClick={() => { setLivrableModif(null); setFormulaireOuvert(true) }} className="df-btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>+ Nouveau livrable</button>
        )}
      </div>

      {livrables.length === 0 && <p className="df-empty">Aucun livrable défini.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
        {livrables.map(l => (
          <div key={l.livrable_id} className="df-card" style={{ padding: '20px', cursor: estAdmin ? 'pointer' : 'default' }} onClick={() => { if (estAdmin) { setLivrableModif(l); setFormulaireOuvert(true) } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--df-text-primary)', flex: 1, marginRight: '8px' }}>{l.livrable_nom}</h3>
              {badgeType(l.type)}
            </div>
            {l.phase_nom && <p style={{ fontSize: '12px', color: 'var(--df-text-tertiary)', marginBottom: '8px' }}>Phase : {l.phase_nom}</p>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--df-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--df-text-tertiary)' }}>{l.date_livraison || 'Pas de date'}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {l.lien_fiche_technique && <a href={l.lien_fiche_technique} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--df-accent)' }}>Technique ↗</a>}
                {l.lien_fiche_presentable && <a href={l.lien_fiche_presentable} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--df-accent)' }}>Présentable ↗</a>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {formulaireOuvert && estAdmin && (
  <FormulaireLivrable projetId={projetId} livrableExistant={livrableModif} onFermer={() => setFormulaireOuvert(false)} onSuccess={chargerLivrables} />
)}
    </div>
  )
}

export default Livrables