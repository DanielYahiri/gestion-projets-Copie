import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useMembreActif } from '../context/MembreContext'
import Chargement from '../components/Chargement'
import FormulaireProjet from '../components/FormulaireProjet'

function BadgeStatut({ statut }) {
  const config = {
    en_cours:   { label: 'En cours',   bg: 'var(--df-accent-soft)', color: 'var(--df-accent)' },
    terminé:    { label: 'Terminé',    bg: 'var(--df-success-soft)', color: 'var(--df-success)' },
    en_attente: { label: 'En attente', bg: 'var(--df-warning-soft)', color: 'var(--df-warning)' },
    annulé:     { label: 'Annulé',     bg: 'var(--df-danger-soft)', color: 'var(--df-danger)' },
  }
  const s = config[statut] || config.en_attente
  return <span className="df-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
}

function Projets() {
  const [projets, setProjets] = useState([])
  const [avancements, setAvancements] = useState({})
  const [chargement, setChargement] = useState(true)
  const [afficherFormulaire, setAfficherFormulaire] = useState(false)
  const navigate = useNavigate()
  const { membreActif } = useMembreActif()
  const estAdmin = membreActif?.role === 'admin'

  async function chargerDonnees() {
    setChargement(true)
    let dataProjets = []

    if (estAdmin) {
      const { data, error } = await supabase.from('vue_projet_complet').select('*')
      if (error) { console.log('Erreur admin:', error); setChargement(false); return }
      dataProjets = data || []
    } else {
      const { data: affectations, error: errAff } = await supabase
        .from('affectation')
        .select('tache_id, tache(projet_id)')
        .eq('membre_id', membreActif.membre_id)

      if (errAff) { console.log('Erreur affectations:', errAff); setChargement(false); return }

      const projetIds = [...new Set(affectations.map(a => a.tache?.projet_id).filter(Boolean))]

      if (projetIds.length === 0) { setProjets([]); setAvancements({}); setChargement(false); return }

      const { data, error } = await supabase
        .from('vue_projet_complet')
        .select('*')
        .in('projet_id', projetIds)

      if (error) { console.log('Erreur projets:', error); setChargement(false); return }
      dataProjets = data || []
    }

    // Dédupliquer par projet_id
    const vus = new Set()
    dataProjets = dataProjets.filter(p => {
      if (vus.has(p.projet_id)) return false
      vus.add(p.projet_id)
      return true
    })

    setProjets(dataProjets)

    const resultats = {}
    await Promise.all(dataProjets.map(async (projet) => {
      const { data } = await supabase.rpc('get_avancement_projet', { p_projet_id: projet.projet_id })
      if (data && data[0]) resultats[projet.projet_id] = projet.statut === 'terminé' ? 100 : data[0].pourcentage ?? 0
    }))
    setAvancements(resultats)
    setChargement(false)
  }

  useEffect(() => { if (membreActif) chargerDonnees() }, [membreActif])

  return (
    <div className="animate-fadeIn">
      <div className="df-page-header">
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--df-text-primary)', letterSpacing: '-0.02em' }}>Projets</h1>
          <p style={{ fontSize: '13px', color: 'var(--df-text-tertiary)', marginTop: '4px' }}>{projets.length} projet(s) au total</p>
        </div>
        {estAdmin && (
          <button onClick={() => setAfficherFormulaire(true)} className="df-btn-primary">+ Nouveau projet</button>
        )}
      </div>

      {chargement && <Chargement nombre={3} />}

      {!chargement && (
        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {projets.map(projet => {
            const pct = avancements[projet.projet_id] ?? 0
            return (
              <div
                key={projet.projet_id}
                onClick={() => navigate(`/projets/${projet.projet_id}`)}
                className="df-card df-card-interactive"
                style={{ padding: '24px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-primary)', flex: 1, marginRight: '8px' }}>{projet.projet_nom}</h3>
                  <BadgeStatut statut={projet.statut} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--df-text-tertiary)', minWidth: '50px' }}>Client</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-secondary)' }}>{projet.client_nom}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--df-text-tertiary)', minWidth: '50px' }}>Secteur</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-secondary)' }}>{projet.secteur_activite}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--df-border)', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--df-text-tertiary)' }}>{projet.date_debut}</span>
                  <span style={{ fontSize: '12px', color: 'var(--df-text-tertiary)' }}>→</span>
                  <span style={{ fontSize: '12px', color: 'var(--df-text-tertiary)' }}>{projet.date_fin}</span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--df-text-tertiary)', marginBottom: '6px' }}>
                    <span>Avancement</span>
                    <span style={{ fontWeight: 700, color: 'var(--df-accent)' }}>{pct}%</span>
                  </div>
                  <div className="df-progress-track">
                    <div className="df-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {afficherFormulaire && (
        <FormulaireProjet onFermer={() => setAfficherFormulaire(false)} onSuccess={chargerDonnees} />
      )}
    </div>
  )
}

export default Projets