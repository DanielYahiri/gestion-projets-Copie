import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function Financier({ projetId }) {
  const [facturation, setFacturation] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    async function chargerFacturation() {
      const { data, error } = await supabase.from('vue_facturation').select('*').eq('projet_id', projetId).single()
      if (error) { console.log('Erreur :', error); setChargement(false); return }
      setFacturation(data); setChargement(false)
    }
    chargerFacturation()
  }, [projetId])

  if (chargement) return <p style={{ color: 'var(--df-text-tertiary)', fontSize: '14px', padding: '24px' }}>Chargement...</p>
  if (!facturation) return <p className="df-empty">Aucune donnée financière pour ce projet.</p>

  function badgePaiement(statut) {
    const config = { payee: { label: 'Payé', bg: 'var(--df-success-soft)', color: 'var(--df-success)' }, en_retard: { label: 'En retard', bg: 'var(--df-danger-soft)', color: 'var(--df-danger)' }, en_attente: { label: 'En attente', bg: 'var(--df-warning-soft)', color: 'var(--df-warning)' } }
    const s = config[statut] || config.en_attente
    return <span className="df-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
  }

  return (
    <div className="animate-fadeIn">
      <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Heures totales', value: `${facturation.total_heures}h`, color: 'var(--df-text-primary)' },
          { label: 'Heures facturables', value: `${facturation.heures_facturables}h`, color: 'var(--df-accent)' },
          { label: 'Montant (heures)', value: `${Number(facturation.montant_heures_facturables).toLocaleString('fr-FR')} FCFA`, color: 'var(--df-text-primary)' },
          { label: 'Forfait facturé', value: `${Number(facturation.montant_facture_forfait).toLocaleString('fr-FR')} FCFA`, color: 'var(--df-text-primary)' },
        ].map(item => (
          <div key={item.label} className="df-stat-card">
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--df-text-tertiary)', marginBottom: '8px' }}>{item.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="df-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--df-text-primary)', marginBottom: '16px' }}>Détails</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Client', value: facturation.client_nom },
            { label: 'Statut du paiement', value: badgePaiement(facturation.statut_paiement) },
            { label: 'Date de facture', value: facturation.date_facture || '—' },
            { label: 'Date de paiement', value: facturation.date_paiement || '—' },
            { label: 'Notes de facturation', value: facturation.notes_facturation || '—' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--df-border)' }}>
              <span style={{ fontSize: '13px', color: 'var(--df-text-tertiary)' }}>{item.label}</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--df-text-primary)' }}>{typeof item.value === 'string' ? item.value : item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Financier