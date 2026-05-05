import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import FormulairePhase from './FormulairePhase'

function Phases({ projetId, membreActif, estAdmin }) {
  const [phases, setPhases] = useState([])
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const [phaseModif, setPhaseModif] = useState(null)
  const [phaseSelectionnee, setPhaseSelectionnee] = useState(null)
  const [tachesPhase, setTachesPhase] = useState([])

  // Charge toutes les phases du projet
  async function chargerPhases() {
    const { data, error } = await supabase
      .from('phase')
      .select('*')
      .eq('projet_id', projetId)
      .order('ordre', { ascending: true })

    if (error) {
      console.error('Erreur :', error)
      return
    }
    setPhases(data)
  }

  // Charge les tâches d'une phase spécifique
  async function chargerTachesPhase(phaseId) {
    const { data, error } = await supabase
      .from('vue_taches_membres')
      .select('*')
      .eq('phase_id', phaseId)

    if (error) {
      console.error('Erreur tâches :', error)
      setTachesPhase([])
      return
    }
    setTachesPhase(data || [])
  }

  useEffect(() => {
    chargerPhases()
  }, [projetId])

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        {estAdmin && (
          <button 
            onClick={() => { setPhaseModif(null); setFormulaireOuvert(true) }} 
            className="df-btn-primary"
          >
            + Nouvelle phase
          </button>
        )}
      </div>

      {phases.length === 0 && <p className="df-empty">Aucune phase définie pour ce projet.</p>}

      <div style={{ position: 'relative', paddingLeft: '24px' }}>
        {/* Ligne de la timeline */}
        {phases.length > 1 && (
          <div style={{ position: 'absolute', left: '14px', top: '20px', bottom: '20px', width: '2px', background: 'var(--df-border)' }} />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {phases.map((phase) => (
            <div key={phase.phase_id} style={{ position: 'relative' }}>
              
              {/* Point de la timeline */}
              <div style={{ position: 'absolute', left: '-24px', top: '20px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--df-accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#fff', boxShadow: '0 2px 8px rgba(99,102,241,0.3)', zIndex: 1 }}>
                {phase.ordre}
              </div>

              <div className="df-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  
                  {/* Clic sur le titre : vide les anciennes tâches d'abord, puis charge les nouvelles */}
                  <div 
                    style={{ flex: 1, cursor: 'pointer' }} 
                    onClick={async () => {
                      if (phaseSelectionnee?.phase_id === phase.phase_id) {
                        setPhaseSelectionnee(null)
                        setTachesPhase([])
                      } else {
                        setTachesPhase([]) // On vide le tableau avant de charger les nouvelles tâches
                        setPhaseSelectionnee(phase)
                        await chargerTachesPhase(phase.phase_id)
                      }
                    }}
                  >
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-primary)' }}>{phase.nom}</h3>
                    {phase.description && <p style={{ fontSize: '13px', color: 'var(--df-text-secondary)', marginTop: '4px' }}>{phase.description}</p>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="df-badge" style={{ background: 'var(--df-bg-tertiary)', color: 'var(--df-text-tertiary)' }}>Phase {phase.ordre}</span>
                    
                    {(estAdmin || tachesPhase.some(t => t.membres_affectes && JSON.parse(t.membres_affectes || '[]').some(m => m.membre_id === membreActif?.membre_id))) && (
                      <button 
                        onClick={e => { e.stopPropagation(); setPhaseModif(phase); setFormulaireOuvert(true) }} 
                        className="df-btn-secondary" 
                        style={{ fontSize: '11px', padding: '4px 10px' }}
                      >
                        Modifier
                      </button>
                    )}
                  </div>
                </div>

                {/* Affichage des tâches de la phase sélectionnée */}
                {phaseSelectionnee?.phase_id === phase.phase_id && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--df-border)' }}>
                    {tachesPhase.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--df-text-tertiary)' }}>Aucune tâche dans cette phase.</p>
                    ) : (
                      tachesPhase.map((t) => (
                        <div key={t.tache_id} style={{ fontSize: '13px', color: 'var(--df-text-primary)', padding: '6px 0', borderBottom: '1px solid var(--df-border)' }}>
                          {t.titre}
                        </div>
                      ))
                    )}
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      </div>

      {formulaireOuvert && (
        <FormulairePhase projetId={projetId} phaseExistante={phaseModif} onFermer={() => setFormulaireOuvert(false)} onSuccess={chargerPhases} />
      )}
    </div>
  )
}

export default Phases
