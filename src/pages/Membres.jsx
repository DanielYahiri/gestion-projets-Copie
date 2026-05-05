import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Chargement from '../components/Chargement'
import FormulaireMembre from '../components/FormulaireMembre'
import { useMembreActif } from '../context/MembreContext'

function BadgeRole({ role }) {
  const labels = { data_scientist: 'Data Scientist', data_scientist_junior: 'Data Scientist Jr', data_analyst: 'Data Analyst', data_engineer: 'Data Engineer', ml_engineer: 'ML Engineer', chef_de_projet: 'Chef de projet', stagiaire: 'Stagiaire', collaborateur: 'Collaborateur', admin: 'Admin' }
  return <span className="df-badge" style={{ background: 'var(--df-accent-soft)', color: 'var(--df-accent)' }}>{labels[role] || role}</span>
}

function Membres() {
  const [membres, setMembres] = useState([])
  const [chargement, setChargement] = useState(true)
  const navigate = useNavigate()
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const { membreActif } = useMembreActif()
  const estAdmin = membreActif?.role === 'admin'

  async function chargerMembres() {
    const { data, error } = await supabase.from('vue_charge_membre').select('*').order('nom', { ascending: true })
    if (error) { console.log('Erreur :', error); setChargement(false); return }
    setMembres(data); setChargement(false)
  }

  useEffect(() => { chargerMembres() }, [])

  return (
    <div className="animate-fadeIn">
      <div className="df-page-header">
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--df-text-primary)', letterSpacing: '-0.02em' }}>Membres</h1>
          <p style={{ fontSize: '13px', color: 'var(--df-text-tertiary)', marginTop: '4px' }}>{membres.length} membre(s)</p>
        </div>
        {estAdmin && (
          <button onClick={() => setFormulaireOuvert(true)} className="df-btn-primary">+ Nouveau membre</button>
        )}
      </div>

      {chargement && <Chargement nombre={4} />}

      <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
        {membres.map(membre => (
          <div
            key={membre.membre_id}
            onClick={() => navigate(`/membres/${membre.membre_id}`)}
            className="df-card df-card-interactive"
            style={{ padding: '24px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div className="df-avatar df-avatar-lg">{membre.prenom?.[0]}{membre.nom?.[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-primary)' }}>{membre.prenom} {membre.nom}</h3>
                <div style={{ marginTop: '4px' }}><BadgeRole role={membre.role} /></div>
              </div>
              {membre.nb_taches_en_retard > 0 && (
                <span className="df-badge" style={{ background: 'var(--df-danger-soft)', color: 'var(--df-danger)' }}>{membre.nb_taches_en_retard} en retard</span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '14px 0', borderTop: '1px solid var(--df-border)', borderBottom: '1px solid var(--df-border)', marginBottom: '16px' }}>
              {[
                { val: membre.nb_taches_total, label: 'Total', color: 'var(--df-text-primary)' },
                { val: membre.nb_taches_en_cours, label: 'En cours', color: 'var(--df-accent)' },
                { val: membre.nb_taches_terminees, label: 'Terminées', color: 'var(--df-success)' },
                { val: membre.nb_projets_actifs, label: 'Projets', color: 'var(--df-text-primary)' },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '18px', fontWeight: 800, color: item.color }}>{item.val}</p>
                  <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)' }}>{item.label}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)' }}>Heures loggées</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--df-text-primary)' }}>{membre.total_heures_enregistrees}h</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)' }}>Taux horaire moy.</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--df-text-primary)' }}>{membre.taux_horaire_moyen ? `${Number(membre.taux_horaire_moyen).toLocaleString('fr-FR')} FCFA` : '—'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {formulaireOuvert && (
        <FormulaireMembre onFermer={() => setFormulaireOuvert(false)} onSuccess={() => chargerMembres()} />
      )}
    </div>
  )
}

export default Membres