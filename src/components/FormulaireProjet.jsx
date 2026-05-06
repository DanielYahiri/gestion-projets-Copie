import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { envoyerNotifEmail } from '../utils/notifEmail'

function FormulaireProjet({ onFermer, onSuccess, projetExistant, membreActif }) {
  const [clients, setClients] = useState([])
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({
    nom: '', description: '', statut: 'en_attente', type_donnees: '', date_debut: '', date_fin: '', client_id: '',
    montant_facture_forfait: '', notes_facturation: '', date_facture: '', date_paiement: '', statut_paiement: 'en_attente',
  })

  useEffect(() => {
    async function init() {
      const { data } = await supabase.from('client').select('client_id, nom').order('nom')
      setClients(data || [])
    }
    init()
    if (projetExistant) {
      setForm({
        nom: projetExistant.projet_nom ?? '', description: projetExistant.description ?? '',
        statut: projetExistant.statut ?? 'en_attente', type_donnees: projetExistant.type_donnees ?? '',
        date_debut: projetExistant.date_debut ?? '', date_fin: projetExistant.date_fin ?? '',
        client_id: projetExistant.client_id ?? '', montant_facture_forfait: projetExistant.montant_facture_forfait ?? '',
        notes_facturation: projetExistant.notes_facturation ?? '', date_facture: projetExistant.date_facture ?? '',
        date_paiement: projetExistant.date_paiement ?? '', statut_paiement: projetExistant.statut_paiement ?? 'en_attente',
      })
    }
  }, [projetExistant])

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }) }

  async function handleSubmit() {
    if (!form.nom.trim()) { setErreur('Le nom du projet est requis.'); return }
    if (!form.client_id) { setErreur('Le client est requis.'); return }
    setErreur(''); setEnvoi(true)
    const payload = { nom: form.nom, description: form.description || null, statut: form.statut, type_donnees: form.type_donnees || null, date_debut: form.date_debut || null, date_fin: form.date_fin || null, client_id: form.client_id || null }
    let error
    if (projetExistant) {
      const facture = { montant_facture_forfait: form.montant_facture_forfait || null, notes_facturation: form.notes_facturation || null, date_facture: form.date_facture || null, date_paiement: form.date_paiement || null, statut_paiement: form.statut_paiement }
      const res = await supabase.from('projet').update(payload).eq('projet_id', projetExistant.projet_id)
      error = res.error
      if (!error) { await supabase.from('facturation').upsert({ projet_id: projetExistant.projet_id, ...facture }, { onConflict: 'projet_id' }) }
    } else {
      const res = await supabase.from('projet').insert(payload).select('projet_id').single()
      error = res.error
      if (!error && res.data) { await supabase.from('facturation').insert({ projet_id: res.data.projet_id, montant_facture_forfait: form.montant_facture_forfait || null, notes_facturation: form.notes_facturation || null, date_facture: form.date_facture || null, date_paiement: form.date_paiement || null, statut_paiement: form.statut_paiement }) }
    }
    if (error) { setErreur('Une erreur est survenue.'); setEnvoi(false); return }

    // Notification si projet marqué terminé
    if (projetExistant && form.statut === 'terminé' && projetExistant?.statut !== 'terminé') {
      try {
        const { data: affectations } = await supabase
          .from('affectation')
          .select('membre_id, tache(projet_id)')

        const membreIds = [...new Set(
          (affectations || [])
            .filter(a => {
              const projetId = Array.isArray(a.tache) ? a.tache[0]?.projet_id : a.tache?.projet_id
              return projetId === projetExistant.projet_id && a.membre_id !== membreActif?.membre_id
            })
            .map(a => a.membre_id)
        )]

        if (membreIds.length > 0) {
          await supabase.from('notification').insert(
            membreIds.map(mid => ({
              membre_id: mid,
              type: 'tache',
              contenu: `Le projet "${form.nom}" a été marqué comme terminé par ${membreActif?.prenom} ${membreActif?.nom}`,
              lien: `/projets/${projetExistant.projet_id}`
            }))
          )
          // Email pour chaque membre
          for (const mid of membreIds) {
            await envoyerNotifEmail(
              mid,
              'tache',
              `Le projet "${form.nom}" a été marqué comme terminé par ${membreActif?.prenom} ${membreActif?.nom}`,
              `/projets/${projetExistant.projet_id}`
            )
          }
        }
      } catch (e) { console.log('Erreur notification projet terminé:', e) }
    }

    setEnvoi(false); onSuccess(); onFermer()
  }

  const inputStyle = "df-input"
  const labelStyle = { fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', display: 'block', marginBottom: '6px' }

  return (
    <div className="df-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="df-modal" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', margin: '16px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--df-border)' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-primary)' }}>{projetExistant ? 'Modifier le projet' : 'Nouveau projet'}</h2>
          <button onClick={onFermer} style={{ background: 'none', border: 'none', color: 'var(--df-text-tertiary)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {erreur && <div style={{ background: 'var(--df-danger-soft)', border: '1px solid var(--df-danger)', borderRadius: '10px', padding: '10px 14px' }}><p style={{ fontSize: '13px', color: 'var(--df-danger)' }}>{erreur}</p></div>}
          <div><label style={labelStyle}>Nom du projet <span style={{ color: 'var(--df-danger)' }}>*</span></label><input name="nom" value={form.nom} onChange={handleChange} placeholder="Ex: Analyse de données X" className={inputStyle} /></div>
          <div><label style={labelStyle}>Description</label><textarea name="description" value={form.description} onChange={handleChange} placeholder="Décrivez le projet..." rows={3} className={inputStyle} style={{ resize: 'none' }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={labelStyle}>Client <span style={{ color: 'var(--df-danger)' }}>*</span></label><select name="client_id" value={form.client_id} onChange={handleChange} className={inputStyle}><option value="">Sélectionner...</option>{clients.map(c => <option key={c.client_id} value={c.client_id}>{c.nom}</option>)}</select></div>
            <div><label style={labelStyle}>Statut</label><select name="statut" value={form.statut} onChange={handleChange} className={inputStyle}><option value="en_attente">En attente</option><option value="en_cours">En cours</option><option value="terminé">Terminé</option><option value="annulé">Annulé</option></select></div>
          </div>
          <div><label style={labelStyle}>Type de données</label><input name="type_donnees" value={form.type_donnees} onChange={handleChange} placeholder="Ex: CSV, SQL, API..." className={inputStyle} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={labelStyle}>Date de début</label><input type="date" name="date_debut" value={form.date_debut} onChange={handleChange} className={inputStyle} /></div>
            <div><label style={labelStyle}>Date de fin</label><input type="date" name="date_fin" value={form.date_fin} onChange={handleChange} className={inputStyle} /></div>
          </div>
          <div style={{ borderTop: '1px solid var(--df-border)', paddingTop: '16px', marginTop: '4px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--df-text-primary)', marginBottom: '12px' }}>Facturation</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={labelStyle}>Montant forfait (FCFA)</label><input type="number" name="montant_facture_forfait" value={form.montant_facture_forfait} onChange={handleChange} placeholder="Ex: 5000000" className={inputStyle} /></div>
              <div><label style={labelStyle}>Statut paiement</label><select name="statut_paiement" value={form.statut_paiement} onChange={handleChange} className={inputStyle}><option value="en_attente">En attente</option><option value="payee">Payé</option><option value="en_retard">En retard</option></select></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <div><label style={labelStyle}>Date de facture</label><input type="date" name="date_facture" value={form.date_facture} onChange={handleChange} className={inputStyle} /></div>
              <div><label style={labelStyle}>Date de paiement</label><input type="date" name="date_paiement" value={form.date_paiement} onChange={handleChange} className={inputStyle} /></div>
            </div>
            <div style={{ marginTop: '12px' }}><label style={labelStyle}>Notes</label><textarea name="notes_facturation" value={form.notes_facturation} onChange={handleChange} placeholder="Notes de facturation..." rows={2} className={inputStyle} style={{ resize: 'none' }} /></div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '20px 24px', borderTop: '1px solid var(--df-border)' }}>
          <button onClick={onFermer} className="df-btn-secondary">Annuler</button>
          <button onClick={handleSubmit} disabled={envoi} className="df-btn-primary">{envoi ? 'Enregistrement...' : projetExistant ? 'Enregistrer' : 'Créer le projet'}</button>
        </div>
      </div>
    </div>
  )
}

export default FormulaireProjet