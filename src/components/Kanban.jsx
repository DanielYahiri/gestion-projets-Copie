import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import PanneauTache from './PanneauTache'
import FormulaireTache from './FormulaireTache'

function BadgePriorite({ priorite }) {
  const config = {
    haute:   { color: 'var(--df-danger)' },
    moyenne: { color: 'var(--df-warning)' },
    basse:   { color: 'var(--df-text-tertiary)' },
  }
  const s = config[priorite] || config.basse
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: s.color }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color }} />
      {priorite}
    </span>
  )
}

function CarteTache({ tache, onClick, membreActif }) {
  const estCollaborateur = membreActif?.role === 'collaborateur'
  const membres = Array.isArray(tache.membres_affectes) ? tache.membres_affectes : (() => { try { return JSON.parse(tache.membres_affectes || '[]') } catch { return [] } })()

  return (
    <div onClick={onClick} className="df-kanban-card">
      {tache.est_en_retard && (
        <span className="df-badge" style={{ background: 'var(--df-danger-soft)', color: 'var(--df-danger)', marginBottom: '8px', fontSize: '11px', padding: '2px 8px' }}>En retard</span>
      )}
      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-primary)', marginBottom: '8px', lineHeight: 1.4 }}>{tache.titre}</p>
      {tache.phase_nom && <p style={{ fontSize: '11px', color: 'var(--df-accent)', marginBottom: '8px' }}>{tache.phase_nom}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <BadgePriorite priorite={tache.priorite} />
        {tache.date_echeance && <span style={{ fontSize: '11px', color: 'var(--df-text-tertiary)' }}>{tache.date_echeance}</span>}
      </div>

      {membres.length > 0 && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--df-border)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {membres.map(m => (
            <div key={m.membre_id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div className="df-avatar df-avatar-sm" style={{ width: '22px', height: '22px', fontSize: '9px' }}>{m.prenom?.[0]}{m.nom?.[0]}</div>
              <span style={{ fontSize: '11px', color: 'var(--df-text-secondary)' }}>{m.prenom}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '8px', display: 'flex', gap: '12px' }}>
        {tache.total_heures > 0 && !estCollaborateur && <span style={{ fontSize: '11px', color: 'var(--df-text-tertiary)' }}>{tache.total_heures}h loggées</span>}
        {tache.nb_commentaires > 0 && <span style={{ fontSize: '11px', color: 'var(--df-text-tertiary)' }}>{tache.nb_commentaires} commentaire(s)</span>}
      </div>
    </div>
  )
}

function Colonne({ titre, couleur, taches, onSelectTache, onNouveauTache, membreActif }) {
  return (
    <div className="df-kanban-col">
      <div className="df-kanban-header">
        <div className="df-kanban-dot" style={{ background: couleur }} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--df-text-primary)', flex: 1 }}>{titre}</span>
        <span className="df-badge" style={{ background: 'var(--df-bg-card)', color: 'var(--df-text-tertiary)', border: '1px solid var(--df-border)' }}>{taches.length}</span>
      </div>
      <div style={{ minHeight: '60px' }}>
        {taches.length === 0 && <p style={{ fontSize: '12px', color: 'var(--df-text-tertiary)', textAlign: 'center', padding: '20px 0' }}>Aucune tâche</p>}
        {taches.map(tache => (
          <CarteTache key={tache.tache_id} tache={tache} membreActif={membreActif} onClick={() => onSelectTache(tache.tache_id)} />
        ))}
        <button
          onClick={onNouveauTache}
          style={{ width: '100%', marginTop: '8px', fontSize: '12px', color: 'var(--df-text-tertiary)', padding: '8px', borderRadius: '8px', border: '1px dashed var(--df-border)', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s ease' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--df-accent)'; e.currentTarget.style.borderColor = 'var(--df-accent)'; e.currentTarget.style.background = 'var(--df-accent-soft)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--df-text-tertiary)'; e.currentTarget.style.borderColor = 'var(--df-border)'; e.currentTarget.style.background = 'transparent' }}
        >
          + Tâche
        </button>
      </div>
    </div>
  )
}

function Kanban({ projetId, membreActif }) {
  const [taches, setTaches] = useState([])
  const [tacheSelectionnee, setTacheSelectionnee] = useState(null)
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)

  async function chargerTaches() {
    const { data, error } = await supabase.from('vue_taches_membres').select('*').eq('projet_id', projetId)
    if (error) { console.log('Erreur :', error); return }
    setTaches(data)
  }

  useEffect(() => { chargerTaches() }, [projetId])

  const parStatut = (statut) => taches.filter(t => t.statut === statut)

  const colonnes = [
    { titre: 'À faire', couleur: 'var(--df-text-tertiary)', statut: 'a_faire' },
    { titre: 'En cours', couleur: 'var(--df-accent)', statut: 'en_cours' },
    { titre: 'Terminé', couleur: 'var(--df-success)', statut: 'termine' },
    { titre: 'Bloqué', couleur: 'var(--df-danger)', statut: 'bloque' },
  ]

  return (
    <div>
      {/* Use CSS Grid from .df-kanban-board — responsive breakpoints in CSS */}
      <div className="df-kanban-board">
        {colonnes.map(col => (
          <Colonne
            key={col.statut}
            titre={col.titre}
            couleur={col.couleur}
            taches={parStatut(col.statut)}
            onSelectTache={setTacheSelectionnee}
            onNouveauTache={() => setFormulaireOuvert(true)}
            membreActif={membreActif}
          />
        ))}
      </div>

      {formulaireOuvert && (
        <FormulaireTache projetId={projetId} membreActif={membreActif} onFermer={() => setFormulaireOuvert(false)} onSuccess={() => chargerTaches()} />
      )}

      {tacheSelectionnee && (
        <PanneauTache tacheId={tacheSelectionnee} membreActif={membreActif} onFermer={() => { setTacheSelectionnee(null); chargerTaches() }} />
      )}
    </div>
  )
}

export default Kanban