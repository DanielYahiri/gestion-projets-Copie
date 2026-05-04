import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Chargement from '../components/Chargement'
import FormulaireClient from '../components/FormulaireClient'

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

function BadgePaiement({ statut }) {
  const config = {
    a_jour:     { label: 'À jour',     bg: 'var(--df-success-soft)', color: 'var(--df-success)' },
    en_attente: { label: 'En attente', bg: 'var(--df-warning-soft)', color: 'var(--df-warning)' },
    en_retard:  { label: 'En retard',  bg: 'var(--df-danger-soft)', color: 'var(--df-danger)' },
  }
  const s = config[statut] || config.en_attente
  return <span className="df-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
}

function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [projets, setProjets] = useState([])
  const [chargement, setChargement] = useState(true)
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)

  async function chargerDonnees() {
    const { data: dataClient, error: errClient } = await supabase.from('vue_client_complet').select('*').eq('client_id', id).single()
    if (errClient) { console.log('Erreur client:', errClient); setChargement(false); return }
    setClient(dataClient)
    const { data: dataProjets, error: errProjets } = await supabase.from('vue_projet_complet').select('*').eq('client_id', id)
    if (errProjets) { console.log('Erreur projets:', errProjets); setChargement(false); return }
    setProjets(dataProjets); setChargement(false)
  }

  useEffect(() => { chargerDonnees() }, [id])

  if (chargement) return <div className="animate-fadeIn" style={{ padding: '32px' }}><Chargement nombre={3} /></div>
  if (!client) return (
    <div className="animate-fadeIn">
      <button onClick={() => navigate('/clients')} className="df-back-btn">← Retour</button>
      <p style={{ color: 'var(--df-text-tertiary)', fontSize: '14px' }}>Client introuvable.</p>
    </div>
  )

  return (
    <div className="animate-fadeIn">
      <button onClick={() => navigate('/clients')} className="df-back-btn">← Retour aux clients</button>

      {/* Header */}
      <div className="df-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--df-text-primary)', letterSpacing: '-0.02em' }}>{client.client_nom}</h1>
            <p style={{ fontSize: '13px', color: 'var(--df-text-tertiary)', marginTop: '4px' }}>{client.secteur_activite}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BadgePaiement statut={client.statut_paiement_global} />
            <button onClick={() => setFormulaireOuvert(true)} className="df-btn-secondary" style={{ fontSize: '13px', padding: '8px 14px' }}>Modifier</button>
          </div>
        </div>

        {client.dernier_projet_en_cours && (
          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--df-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p style={{ fontSize: '12px', color: 'var(--df-text-tertiary)' }}>Projet en cours</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--df-accent)' }}>{client.dernier_projet_en_cours}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--df-border)' }}>
          {[
            { label: 'Email', value: client.email_contact },
            { label: 'Téléphone', value: client.telephone },
            { label: 'Adresse', value: client.adresse },
            { label: 'Premier contrat', value: client.date_premier_contrat },
          ].map(item => (
            <div key={item.label}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--df-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{item.label}</p>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--df-text-primary)' }}>{item.value ?? '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { val: client.nb_projets_total, label: 'Projets total', color: 'var(--df-text-primary)' },
          { val: client.nb_projets_en_cours, label: 'En cours', color: 'var(--df-accent)' },
          { val: client.nb_projets_termines, label: 'Terminés', color: 'var(--df-success)' },
          { val: `${(client.montant_total_facture ?? 0).toLocaleString('fr-FR')}`, label: 'FCFA facturés', color: 'var(--df-text-primary)' },
        ].map(item => (
          <div key={item.label} className="df-stat-card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '28px', fontWeight: 800, color: item.color }}>{item.val}</p>
            <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)', marginTop: '4px' }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Projects list */}
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--df-text-primary)', marginBottom: '16px' }}>Projets ({projets.length})</h2>
      {projets.length === 0 && <p className="df-empty">Aucun projet pour ce client.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {projets.map(projet => (
          <div
            key={projet.projet_id}
            onClick={() => navigate(`/projets/${projet.projet_id}`)}
            className="df-card df-card-interactive"
            style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}
          >
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--df-text-primary)' }}>{projet.projet_nom}</h3>
              <p style={{ fontSize: '12px', color: 'var(--df-text-tertiary)', marginTop: '2px' }}>{projet.date_debut} → {projet.date_fin}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <p style={{ fontSize: '12px', color: 'var(--df-text-tertiary)' }}>{projet.type_donnees}</p>
              <BadgeStatut statut={projet.statut} />
            </div>
          </div>
        ))}
      </div>

      {formulaireOuvert && (
        <FormulaireClient client={client} onFermer={() => setFormulaireOuvert(false)} onSuccess={() => chargerDonnees()} />
      )}
    </div>
  )
}

export default ClientDetail