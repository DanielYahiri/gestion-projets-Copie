import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import FormulairePhase from './FormulairePhase'

function Phases({ projetId }) {
  const [phases, setPhases] = useState([])
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const [phaseModif, setPhaseModif] = useState(null)

  async function chargerPhases() {
    const { data, error } = await supabase.from('phase').select('*').eq('projet_id', projetId).order('ordre', { ascending: true })
    if (error) { console.log('Erreur :', error); return }
    setPhases(data)
  }

  useEffect(() => { chargerPhases() }, [projetId])

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button onClick={() => { setPhaseModif(null); setFormulaireOuvert(true) }} className="df-btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>+ Nouvelle phase</button>
      </div>

      {phases.length === 0 && <p className="df-empty">Aucune phase définie pour ce projet.</p>}

      <div style={{ position: 'relative', paddingLeft: '24px' }}>
        {/* Timeline line */}
        {phases.length > 1 && (
          <div style={{
            position: 'absolute', left: '14px', top: '20px', bottom: '20px', width: '2px',
            background: 'var(--df-border)',
          }} />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {phases.map((phase, index) => (
            <div key={phase.phase_id} style={{ position: 'relative' }}>
              {/* Dot */}
              <div style={{
                position: 'absolute', left: '-24px', top: '20px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: 'var(--df-accent-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 800, color: '#fff',
                boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                zIndex: 1,
              }}>
                {phase.ordre}
              </div>

              <div className="df-card df-card-interactive" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => { setPhaseModif(phase); setFormulaireOuvert(true) }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-primary)' }}>{phase.nom}</h3>
                    {phase.description && <p style={{ fontSize: '13px', color: 'var(--df-text-secondary)', marginTop: '4px' }}>{phase.description}</p>}
                  </div>
                  <span className="df-badge" style={{ background: 'var(--df-bg-tertiary)', color: 'var(--df-text-tertiary)' }}>Phase {phase.ordre}</span>
                </div>
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