import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useMembreActif } from '../context/MembreContext'
import Kanban from '../components/Kanban'
import Phases from '../components/Phases'
import Livrables from '../components/Livrables'
import Financier from '../components/Financier'
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

function ProjetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [projet, setProjet] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [ongletActif, setOngletActif] = useState('taches')
  const [afficherFormulaire, setAfficherFormulaire] = useState(false)
  const { membreActif } = useMembreActif()
  const estAdmin = membreActif?.role === 'admin'
  const estCollaborateur = !estAdmin

  async function chargerProjet() {
    setChargement(true)
    const { data, error } = await supabase.from('vue_projet_complet').select('*').eq('projet_id', id).single()
    if (error) { console.log('Erreur :', error); setChargement(false); return }
    setProjet(data); setChargement(false)
  }

  useEffect(() => { chargerProjet() }, [id])

  const onglets = [
  { key: 'taches', label: 'Tâches' },
  { key: 'phases', label: 'Phases' },
  { key: 'livrables', label: 'Livrables' },
  ...(estAdmin ? [{ key: 'financier', label: 'Financier' }] : []),
]

  if (chargement) return <div className="animate-fadeIn" style={{ padding: '32px' }}><Chargement nombre={3} /></div>
  if (!projet) return (
    <div className="animate-fadeIn">
      <button onClick={() => navigate('/projets')} className="df-back-btn">← Retour</button>
      <p style={{ color: 'var(--df-text-tertiary)', fontSize: '14px' }}>Projet introuvable.</p>
    </div>
  )

  return (
    <div className="animate-fadeIn">
      <button onClick={() => navigate('/projets')} className="df-back-btn">← Retour aux projets</button>

      {/* Header card */}
      <div className="df-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--df-text-primary)', letterSpacing: '-0.02em' }}>{projet.projet_nom}</h1>
            {projet.description && <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', marginTop: '6px' }}>{projet.description}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <BadgeStatut statut={projet.statut} />
            {estAdmin && (
             <button onClick={() => setAfficherFormulaire(true)} className="df-btn-secondary" style={{ fontSize: '13px', padding: '8px 14px' }}>Modifier</button>
              )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', paddingTop: '20px', borderTop: '1px solid var(--df-border)' }}>
          {[
            { label: 'Client', value: projet.client_nom },
            { label: 'Début', value: projet.date_debut },
            { label: 'Fin prévue', value: projet.date_fin },
            { label: 'Type de données', value: projet.type_donnees },
          ].map(item => (
            <div key={item.label}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--df-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{item.label}</p>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--df-text-primary)' }}>{item.value || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="df-tabs">
        {onglets.map(o => (
          <button
            key={o.key}
            onClick={() => setOngletActif(o.key)}
            className={`df-tab ${ongletActif === o.key ? 'active' : ''}`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fadeIn" key={ongletActif}>
        {ongletActif === 'taches' && <Kanban projetId={id} membreActif={membreActif} estCollaborateur={estCollaborateur} />}
        {ongletActif === 'phases' && <Phases projetId={id} membreActif={membreActif} estAdmin={estAdmin} />}
        {ongletActif === 'livrables' && <Livrables projetId={id} estAdmin={estAdmin} />}
        {ongletActif === 'financier' && estAdmin && <Financier projetId={id} />}
      </div>

      {afficherFormulaire && (
        <FormulaireProjet
          projetExistant={projet}
          onFermer={() => setAfficherFormulaire(false)}
          onSuccess={() => { setProjet(null); chargerProjet() }}
        />
      )}
    </div>
  )
}

export default ProjetDetail