import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Chargement from '../components/Chargement'
import FormulaireMembre from '../components/FormulaireMembre'

function BadgeRole({ role }) {
  const labels = { data_scientist: 'Data Scientist', data_scientist_junior: 'Data Scientist Jr', data_analyst: 'Data Analyst', data_engineer: 'Data Engineer', ml_engineer: 'ML Engineer', chef_de_projet: 'Chef de projet', stagiaire: 'Stagiaire', collaborateur: 'Collaborateur' }
  return <span className="df-badge" style={{ background: 'var(--df-accent-soft)', color: 'var(--df-accent)' }}>{labels[role] || role}</span>
}

function BadgeStatutTache({ statut }) {
  const config = {
    a_faire:  { label: 'À faire',  bg: 'var(--df-bg-tertiary)', color: 'var(--df-text-tertiary)' },
    en_cours: { label: 'En cours', bg: 'var(--df-accent-soft)', color: 'var(--df-accent)' },
    termine:  { label: 'Terminé',  bg: 'var(--df-success-soft)', color: 'var(--df-success)' },
    bloque:   { label: 'Bloqué',   bg: 'var(--df-danger-soft)', color: 'var(--df-danger)' },
  }
  const s = config[statut] || config.a_faire
  return <span className="df-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
}

function MembreDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [membre, setMembre] = useState(null)
  const [taches, setTaches] = useState([])
  const [charge, setCharge] = useState([])
  const [chargement, setChargement] = useState(true)
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)

  async function chargerDonnees() {
    const { data: dataMembre, error: errMembre } = await supabase.from('vue_charge_membre').select('*').eq('membre_id', id).single()
    if (errMembre) { console.log('Erreur membre:', errMembre); setChargement(false); return }
    setMembre(dataMembre)
    const { data: dataTaches, error: errTaches } = await supabase.rpc('get_taches_membre', { p_membre_id: id })
    if (errTaches) { console.log('Erreur tâches:', errTaches); setChargement(false); return }
    setTaches(dataTaches)
    const dateDebut = new Date(); dateDebut.setDate(dateDebut.getDate() - 30)
    const { data: dataCharge, error: errCharge } = await supabase.rpc('get_charge_membre', { p_membre_id: id, p_date_debut: dateDebut.toISOString().split('T')[0], p_date_fin: new Date().toISOString().split('T')[0] })
    if (errCharge) { console.log('Erreur charge:', errCharge); setChargement(false); return }
    setCharge(dataCharge); setChargement(false)
  }

  useEffect(() => { chargerDonnees() }, [id])

  if (chargement) return <div className="animate-fadeIn" style={{ padding: '32px' }}><Chargement nombre={4} /></div>
  if (!membre) return (
    <div className="animate-fadeIn">
      <button onClick={() => navigate('/membres')} className="df-back-btn">← Retour</button>
      <p style={{ color: 'var(--df-text-tertiary)', fontSize: '14px' }}>Membre introuvable.</p>
    </div>
  )

  return (
    <div className="animate-fadeIn">
      <button onClick={() => navigate('/membres')} className="df-back-btn">← Retour aux membres</button>

      {/* Header */}
      <div className="df-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div className="df-avatar df-avatar-xl">{membre.prenom?.[0]}{membre.nom?.[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--df-text-primary)', letterSpacing: '-0.02em' }}>{membre.prenom} {membre.nom}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
              <BadgeRole role={membre.role} />
              <span style={{ fontSize: '12px', color: 'var(--df-text-tertiary)' }}>depuis {membre.date_entree}</span>
              <button onClick={() => setFormulaireOuvert(true)} className="df-btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', marginLeft: 'auto' }}>Modifier</button>
            </div>
          </div>
          {membre.nb_taches_en_retard > 0 && (
            <span className="df-badge" style={{ background: 'var(--df-danger-soft)', color: 'var(--df-danger)' }}>{membre.nb_taches_en_retard} tâche(s) en retard</span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--df-border)' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--df-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Email</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--df-text-primary)' }}>{membre.email}</p>
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--df-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Taux horaire moyen</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--df-text-primary)' }}>{membre.taux_horaire_moyen ? `${Number(membre.taux_horaire_moyen).toLocaleString('fr-FR')} FCFA/h` : '—'}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { val: membre.nb_taches_total, label: 'Tâches total', color: 'var(--df-text-primary)' },
          { val: membre.nb_taches_en_cours, label: 'En cours', color: 'var(--df-accent)' },
          { val: `${membre.total_heures_enregistrees}h`, label: 'Heures loggées', color: 'var(--df-text-primary)' },
          { val: membre.nb_projets_actifs, label: 'Projets actifs', color: 'var(--df-text-primary)' },
        ].map(item => (
          <div key={item.label} className="df-stat-card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '28px', fontWeight: 800, color: item.color }}>{item.val}</p>
            <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)', marginTop: '4px' }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Tasks */}
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--df-text-primary)', marginBottom: '16px' }}>Tâches assignées ({taches.length})</h2>
      {taches.length === 0 && <p className="df-empty">Aucune tâche en cours.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
        {taches.map(tache => (
          <div
            key={tache.tache_id}
            onClick={() => tache.projet_id && navigate(`/projets/${tache.projet_id}`)}
            className="df-card df-card-interactive"
            style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}
          >
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--df-text-primary)' }}>{tache.tache_titre}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--df-text-tertiary)' }}>{tache.projet_nom}</span>
                {tache.phase_nom && <span style={{ fontSize: '12px', color: 'var(--df-text-tertiary)' }}>· {tache.phase_nom}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {tache.date_echeance && <span style={{ fontSize: '12px', color: 'var(--df-text-tertiary)' }}>{tache.date_echeance}</span>}
              <BadgeStatutTache statut={tache.statut} />
            </div>
          </div>
        ))}
      </div>

      {/* Activity */}
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--df-text-primary)', marginBottom: '16px' }}>Activité récente — 30 derniers jours ({charge.length} entrée(s))</h2>
      {charge.length === 0 && <p className="df-empty">Aucune heure loggée sur cette période.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {charge.map((c, index) => (
          <div key={index} className="df-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--df-text-primary)' }}>{c.tache_titre}</p>
              <p style={{ fontSize: '12px', color: 'var(--df-text-tertiary)', marginTop: '2px' }}>{c.projet_nom}</p>
              {c.description_travail && <p style={{ fontSize: '12px', color: 'var(--df-text-tertiary)', marginTop: '4px', fontStyle: 'italic' }}>{c.description_travail}</p>}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--df-text-primary)' }}>{c.heures}h</p>
              <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)' }}>{c.date_travail}</p>
            </div>
          </div>
        ))}
      </div>

      {formulaireOuvert && (
        <FormulaireMembre membre={membre} onFermer={() => setFormulaireOuvert(false)} onSuccess={() => chargerDonnees()} />
      )}
    </div>
  )
}

export default MembreDetail