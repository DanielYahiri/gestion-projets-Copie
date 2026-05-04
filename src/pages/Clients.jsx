import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Chargement from '../components/Chargement'
import FormulaireClient from '../components/FormulaireClient'

function BadgePaiement({ statut }) {
  const config = {
    a_jour:     { label: 'À jour',     bg: 'var(--df-success-soft)', color: 'var(--df-success)' },
    en_attente: { label: 'En attente', bg: 'var(--df-warning-soft)', color: 'var(--df-warning)' },
    en_retard:  { label: 'En retard',  bg: 'var(--df-danger-soft)', color: 'var(--df-danger)' },
  }
  const s = config[statut] || config.en_attente
  return <span className="df-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
}

function Clients() {
  const [clients, setClients] = useState([])
  const [chargement, setChargement] = useState(true)
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const navigate = useNavigate()

  async function chargerClients() {
    const { data, error } = await supabase.from('vue_client_complet').select('*').order('client_nom', { ascending: true })
    if (error) { console.log('Erreur :', error); setChargement(false); return }
    setClients(data); setChargement(false)
  }

  useEffect(() => { chargerClients() }, [])

  return (
    <div className="animate-fadeIn">
      <div className="df-page-header">
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--df-text-primary)', letterSpacing: '-0.02em' }}>Clients</h1>
          <p style={{ fontSize: '13px', color: 'var(--df-text-tertiary)', marginTop: '4px' }}>{clients.length} client(s)</p>
        </div>
        <button onClick={() => setFormulaireOuvert(true)} className="df-btn-primary">+ Nouveau client</button>
      </div>

      {chargement && <Chargement nombre={3} />}

      <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {clients.map(client => (
          <div
            key={client.client_id}
            onClick={() => navigate(`/clients/${client.client_id}`)}
            className="df-card df-card-interactive"
            style={{ padding: '24px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-primary)' }}>{client.client_nom}</h3>
                <p style={{ fontSize: '12px', color: 'var(--df-text-tertiary)', marginTop: '2px' }}>{client.secteur_activite}</p>
              </div>
              <BadgePaiement statut={client.statut_paiement_global} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', margin: '16px 0', padding: '14px 0', borderTop: '1px solid var(--df-border)', borderBottom: '1px solid var(--df-border)' }}>
              {[
                { val: client.nb_projets_total, label: 'Total', color: 'var(--df-text-primary)' },
                { val: client.nb_projets_en_cours, label: 'En cours', color: 'var(--df-accent)' },
                { val: client.nb_projets_termines, label: 'Terminés', color: 'var(--df-success)' },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '20px', fontWeight: 800, color: item.color }}>{item.val}</p>
                  <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)' }}>{item.label}</p>
                </div>
              ))}
            </div>

            {client.dernier_projet_en_cours && (
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)' }}>Projet en cours</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.dernier_projet_en_cours}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--df-border)' }}>
              <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)' }}>Total facturé</p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--df-text-primary)' }}>{(client.montant_total_facture ?? 0).toLocaleString('fr-FR')} FCFA</p>
            </div>
          </div>
        ))}
      </div>

      {formulaireOuvert && (
        <FormulaireClient onFermer={() => setFormulaireOuvert(false)} onSuccess={() => chargerClients()} />
      )}
    </div>
  )
}

export default Clients