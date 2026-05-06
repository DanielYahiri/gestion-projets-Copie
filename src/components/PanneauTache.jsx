import { supabase } from '../supabase'
import { useState, useEffect } from 'react'
import { useMembreActif } from '../context/MembreContext'
import FormulaireTache from './FormulaireTache'

function BadgePriorite({ priorite }) {
  const config = { haute: { bg: 'var(--df-danger-soft)', color: 'var(--df-danger)' }, moyenne: { bg: 'var(--df-warning-soft)', color: 'var(--df-warning)' }, basse: { bg: 'var(--df-bg-tertiary)', color: 'var(--df-text-tertiary)' } }
  const s = config[priorite] || config.basse
  return <span className="df-badge" style={{ background: s.bg, color: s.color }}>{priorite}</span>
}

function BadgeStatut({ statut }) {
  const config = { a_faire: { label: 'À faire', bg: 'var(--df-bg-tertiary)', color: 'var(--df-text-tertiary)' }, en_cours: { label: 'En cours', bg: 'var(--df-accent-soft)', color: 'var(--df-accent)' }, termine: { label: 'Terminé', bg: 'var(--df-success-soft)', color: 'var(--df-success)' }, bloque: { label: 'Bloqué', bg: 'var(--df-danger-soft)', color: 'var(--df-danger)' } }
  const s = config[statut] || config.a_faire
  return <span className="df-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
}

function DropdownStatut({ statut, onChange }) {
  const config = { a_faire: { bg: 'var(--df-bg-tertiary)', color: 'var(--df-text-tertiary)' }, en_cours: { bg: 'var(--df-accent-soft)', color: 'var(--df-accent)' }, termine: { bg: 'var(--df-success-soft)', color: 'var(--df-success)' }, bloque: { bg: 'var(--df-danger-soft)', color: 'var(--df-danger)' } }
  const s = config[statut] || config.a_faire
  return (
    <select value={statut} onChange={e => onChange(e.target.value)}
      style={{ fontSize: '12px', fontWeight: 600, padding: '4px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', outline: 'none', background: s.bg, color: s.color }}>
      <option value="a_faire">À faire</option>
      <option value="en_cours">En cours</option>
      <option value="termine">Terminé</option>
      <option value="bloque">Bloqué</option>
    </select>
  )
}

function FormulaireTempsPassé({ tacheId, entree = null, onFermer, onSuccess }) {
  const [membres, setMembres] = useState([])
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({ membre_id: '', date: new Date().toISOString().split('T')[0], heures: '', taux_horaire: '', description_travail: '', est_facture: false })

  useEffect(() => {
    async function chargerMembres() { const { data } = await supabase.from('membre').select('membre_id, nom, prenom').order('nom'); setMembres(data || []) }
    chargerMembres()
    if (entree) setForm({ membre_id: entree.membre_id, date: entree.date, heures: entree.heures, taux_horaire: entree.taux_horaire, description_travail: entree.description_travail || '', est_facture: entree.est_facture === true })
  }, [])

  function handleChange(e) { const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value; setForm({ ...form, [e.target.name]: val }) }

  async function handleSubmit() {
    if (!form.membre_id) { setErreur('Veuillez sélectionner un membre.'); return }
    if (!form.heures || Number(form.heures) <= 0) { setErreur("Le nombre d'heures est requis."); return }
    if (!form.taux_horaire || Number(form.taux_horaire) <= 0) { setErreur('Le taux horaire est requis.'); return }
    if (!form.date) { setErreur('La date est requise.'); return }
    setErreur(''); setEnvoi(true)
    const payload = { membre_id: form.membre_id, date: form.date, heures: Number(form.heures), taux_horaire: Number(form.taux_horaire), description_travail: form.description_travail || null, est_facture: form.est_facture }
    if (entree) { const { error } = await supabase.from('temps_passe').update(payload).eq('id', entree.id); if (error) { setErreur('Une erreur est survenue.'); setEnvoi(false); return } }
    else { const { error } = await supabase.from('temps_passe').insert({ ...payload, tache_id: tacheId }); if (error) { setErreur('Une erreur est survenue.'); setEnvoi(false); return } }
    setEnvoi(false); onSuccess(); onFermer()
  }

  return (
    <div className="df-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
      <div className="df-modal" style={{ width: '100%', maxWidth: '480px', margin: '16px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--df-border)' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-primary)' }}>{entree ? 'Modifier les heures' : 'Logger des heures'}</h2>
          <button onClick={onFermer} style={{ background: 'none', border: 'none', color: 'var(--df-text-tertiary)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {erreur && <div style={{ background: 'var(--df-danger-soft)', border: '1px solid var(--df-danger)', borderRadius: '10px', padding: '10px 14px' }}><p style={{ fontSize: '13px', color: 'var(--df-danger)' }}>{erreur}</p></div>}
          <div><label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', display: 'block', marginBottom: '6px' }}>Membre <span style={{ color: 'var(--df-danger)' }}>*</span></label><select name="membre_id" value={form.membre_id} onChange={handleChange} className="df-input"><option value="">Sélectionner...</option>{membres.map(m => <option key={m.membre_id} value={m.membre_id}>{m.prenom} {m.nom}</option>)}</select></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', display: 'block', marginBottom: '6px' }}>Date <span style={{ color: 'var(--df-danger)' }}>*</span></label><input type="date" name="date" value={form.date} onChange={handleChange} className="df-input" /></div>
            <div><label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', display: 'block', marginBottom: '6px' }}>Heures <span style={{ color: 'var(--df-danger)' }}>*</span></label><input type="number" name="heures" value={form.heures} onChange={handleChange} placeholder="Ex: 2.5" min="0.5" step="0.5" className="df-input" /></div>
          </div>
          <div><label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', display: 'block', marginBottom: '6px' }}>Taux horaire (FCFA) <span style={{ color: 'var(--df-danger)' }}>*</span></label><input type="number" name="taux_horaire" value={form.taux_horaire} onChange={handleChange} placeholder="Ex: 15000" className="df-input" /></div>
          <div><label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', display: 'block', marginBottom: '6px' }}>Description du travail</label><textarea name="description_travail" value={form.description_travail} onChange={handleChange} placeholder="Décrivez le travail effectué..." rows={3} className="df-input" style={{ resize: 'none' }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--df-bg-tertiary)', borderRadius: '10px', padding: '12px 14px' }}>
            <input type="checkbox" name="est_facture" id="est_facture" checked={form.est_facture === true} onChange={handleChange} style={{ width: '16px', height: '16px', accentColor: 'var(--df-accent)', cursor: 'pointer' }} />
            <label htmlFor="est_facture" style={{ fontSize: '13px', color: 'var(--df-text-primary)', cursor: 'pointer' }}>Ces heures sont facturables</label>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '20px 24px', borderTop: '1px solid var(--df-border)' }}>
          <button onClick={onFermer} className="df-btn-secondary">Annuler</button>
          <button onClick={handleSubmit} disabled={envoi} className="df-btn-primary">{envoi ? 'Enregistrement...' : entree ? 'Enregistrer' : 'Logger les heures'}</button>
        </div>
      </div>
    </div>
  )
}

function PanneauTache({ tacheId, onFermer }) {
  const { membreActif } = useMembreActif()
  const estSuperAdmin = membreActif?.email === 'bohdaniel946@gmail.com'
  const estAdmin = membreActif?.role === 'admin'
  const estCollaborateur = !estAdmin
  const [tache, setTache] = useState(null)
  const [tempsEntrees, setTempsEntrees] = useState([])
  const [chargement, setChargement] = useState(true)
  const [nouveauCommentaire, setNouveauCommentaire] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [formulaireModif, setFormulaireModif] = useState(false)
  const [formulaireTemps, setFormulaireTemps] = useState(false)
  const [entreeModif, setEntreeModif] = useState(null)
  const [majStatut, setMajStatut] = useState(false)

  useEffect(() => {
    if (!tacheId) return
    async function chargerTache() {
      setChargement(true)
      const { data, error } = await supabase.from('vue_taches_membres').select('*').eq('tache_id', tacheId).single()
      if (error) { setChargement(false); return }
      setTache(data)
      if (estAdmin) { const { data: dataTemps } = await supabase.from('temps_passe').select('*, membre:membre_id(nom, prenom)').eq('tache_id', tacheId).order('date', { ascending: false }); setTempsEntrees(dataTemps || []) }
      setChargement(false)
    }
    chargerTache()
  }, [tacheId])

  async function rechargerTache() {
    const { data } = await supabase.from('vue_taches_membres').select('*').eq('tache_id', tacheId).single()
    if (data) setTache(data)
    if (estAdmin) { const { data: dataTemps } = await supabase.from('temps_passe').select('*, membre:membre_id(nom, prenom)').eq('tache_id', tacheId).order('date', { ascending: false }); setTempsEntrees(dataTemps || []) }
  }

  const membres = tache ? (Array.isArray(tache.membres_affectes) ? tache.membres_affectes : (() => { try { return JSON.parse(tache.membres_affectes || '[]') } catch { return [] } })()) : []
  const commentaires = tache ? (Array.isArray(tache.commentaires_rattaches) ? tache.commentaires_rattaches : (() => { try { return JSON.parse(tache.commentaires_rattaches || '[]') } catch { return [] } })()) : []
  const estAffecte = membres.some(m => m.membre_id === membreActif?.membre_id)
  const peutModifier = estSuperAdmin || estAffecte

  async function changerStatut(nouveauStatut) {
    if (majStatut || (!estAffecte && !estSuperAdmin)) return
    setMajStatut(true)
    const { error } = await supabase.from('tache').update({ statut: nouveauStatut }).eq('tache_id', tacheId)

    if (!error) {
      try {
        const membresAssignes = Array.isArray(membres) ? membres : []
        const aNotifier = membresAssignes.filter(m => m.membre_id !== membreActif.membre_id)
        const labelStatut = { a_faire: 'À faire', en_cours: 'En cours', termine: 'Terminé', bloque: 'Bloqué' }

        if (aNotifier.length > 0) {
          await supabase.from('notification').insert(
            aNotifier.map(m => ({
              membre_id: m.membre_id,
              type: 'tache',
              contenu: `${membreActif.prenom} ${membreActif.nom} a changé le statut de "${tache?.titre}" en "${labelStatut[nouveauStatut] || nouveauStatut}"`,
              lien: `/projets/${tache?.projet_id}`
            }))
          )
        }
      } catch (e) { console.log('Erreur notification statut:', e) }
    }
  }

  async function envoyerCommentaire() {
    if (!nouveauCommentaire.trim() || !membreActif) return
    const contenu = nouveauCommentaire.trim()

    const { error } = await supabase.from('commentaire').insert({ contenu, date: new Date().toISOString(), membre_id: membreActif.membre_id, tache_id: tacheId })

    if (!error) {
      // Notifier tous les membres assignés à la tâche sauf moi
      try {
        const membresAssignes = Array.isArray(membres) ? membres : []
        const aNotifier = membresAssignes.filter(m => m.membre_id !== membreActif.membre_id)

        if (aNotifier.length > 0) {
          await supabase.from('notification').insert(
            aNotifier.map(m => ({
              membre_id: m.membre_id,
              type: 'commentaire',
              contenu: `${membreActif.prenom} ${membreActif.nom} a commenté sur "${tache?.titre}" : ${contenu.slice(0, 60)}${contenu.length > 60 ? '...' : ''}`,
              lien: `/projets/${tache?.projet_id}`
            }))
          )
        }
      } catch (e) { console.log('Erreur notification commentaire:', e) }
    }

    setNouveauCommentaire(''); setEnvoi(false); rechargerTache()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', justifyContent: 'flex-end' }}>
      <div className="animate-overlayIn" style={{ flex: 1, background: 'var(--df-bg-overlay)', backdropFilter: 'blur(4px)' }} onClick={onFermer} />

      <div className="df-panel">
        {chargement ? (
          <p style={{ color: 'var(--df-text-tertiary)', fontSize: '14px', padding: '24px' }}>Chargement...</p>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--df-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--df-text-primary)', paddingRight: '16px', flex: 1 }}>{tache.titre}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {peutModifier && <button onClick={() => setFormulaireModif(true)} className="df-btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>Modifier</button>}
                  <button onClick={onFermer} style={{ background: 'none', border: 'none', color: 'var(--df-text-tertiary)', cursor: 'pointer', fontSize: '20px', padding: '4px' }}>✕</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {(estAffecte || estSuperAdmin) ? (
                  <><DropdownStatut statut={tache.statut} onChange={changerStatut} />{majStatut && <span style={{ fontSize: '11px', color: 'var(--df-text-tertiary)', fontStyle: 'italic' }}>Mise à jour...</span>}</>
                ) : <BadgeStatut statut={tache.statut} />}
                <BadgePriorite priorite={tache.priorite} />
                {tache.est_en_retard && <span className="df-badge" style={{ background: 'var(--df-danger-soft)', color: 'var(--df-danger)' }}>En retard</span>}
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[{ label: 'Projet', value: tache.projet_nom }, { label: 'Phase', value: tache.phase_nom ?? '—' }, { label: 'Début', value: tache.date_debut ?? '—' }, { label: 'Échéance', value: tache.date_echeance ?? '—' }].map(item => (
                  <div key={item.label}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--df-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{item.label}</p>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--df-text-primary)' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {tache.description && (
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--df-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Description</p>
                  <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>{tache.description}</p>
                </div>
              )}

              {/* Members */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--df-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Membres affectés</p>
                {membres.length === 0 && <p style={{ fontSize: '13px', color: 'var(--df-text-tertiary)' }}>Aucun membre assigné</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {membres.map(m => (
                    <div key={m.membre_id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="df-avatar df-avatar-sm">{m.prenom?.[0]}{m.nom?.[0]}</div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-primary)' }}>{m.prenom} {m.nom}</p>
                        <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)' }}>{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hours */}
              {estSuperAdmin && (
                <div style={{ background: 'var(--df-bg-tertiary)', borderRadius: '14px', padding: '18px', border: '1px solid var(--df-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--df-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Heures loggées</p>
                    <button onClick={() => { setEntreeModif(null); setFormulaireTemps(true) }} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--df-accent)', background: 'var(--df-accent-soft)', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s ease' }}>+ Logger des heures</button>
                  </div>
                  {tache.total_heures > 0 ? (
                    <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--df-text-primary)', marginBottom: '12px' }}>{tache.total_heures}h <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--df-text-tertiary)' }}>— {(tache.montant_facturable ?? 0).toLocaleString('fr-FR')} FCFA facturables</span></p>
                  ) : <p style={{ fontSize: '13px', color: 'var(--df-text-tertiary)', marginBottom: '12px' }}>Aucune heure loggée</p>}
                  {tempsEntrees.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--df-border)', paddingTop: '10px' }}>
                      {tempsEntrees.map(t => (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--df-bg-card)', borderRadius: '10px', padding: '10px 14px' }}>
                          <div>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--df-text-primary)' }}>{t.membre?.prenom} {t.membre?.nom}</p>
                            <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)' }}>{t.date} · {t.est_facture === true ? 'Facturable' : 'Non facturable'}</p>
                            {t.description_travail && <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)', fontStyle: 'italic', marginTop: '2px' }}>{t.description_travail}</p>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--df-text-primary)' }}>{t.heures}h</p>
                              <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)' }}>{Number(t.montant_calcule).toLocaleString('fr-FR')} FCFA</p>
                            </div>
                            <button onClick={() => { setEntreeModif(t); setFormulaireTemps(true) }} className="df-btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }}>Modifier</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Comments */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--df-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Commentaires ({commentaires.length})</p>
                {commentaires.length === 0 && <p style={{ fontSize: '13px', color: 'var(--df-text-tertiary)' }}>Aucun commentaire</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {commentaires.map((c, index) => (
                    <div key={index} style={{ background: 'var(--df-bg-tertiary)', borderRadius: '12px', padding: '14px', border: '1px solid var(--df-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)' }}>{c.membre_prenom} {c.membre_nom}</span>
                        <span style={{ fontSize: '11px', color: 'var(--df-text-tertiary)' }}>{c.date ? new Date(c.date).toLocaleDateString('fr-FR') : ''}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--df-text-primary)', lineHeight: 1.5 }}>{c.contenu}</p>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--df-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div className="df-avatar df-avatar-sm" style={{ width: '24px', height: '24px', fontSize: '9px' }}>{membreActif?.prenom?.[0]}{membreActif?.nom?.[0]}</div>
                    <p style={{ fontSize: '12px', color: 'var(--df-text-tertiary)' }}>Commenter en tant que <span style={{ fontWeight: 600, color: 'var(--df-text-secondary)' }}>{membreActif?.prenom} {membreActif?.nom}</span></p>
                  </div>
                  <textarea value={nouveauCommentaire} onChange={e => setNouveauCommentaire(e.target.value)} placeholder="Écrire un commentaire..." rows={3} className="df-input" style={{ resize: 'none', marginBottom: '10px' }} />
                  <button onClick={envoyerCommentaire} disabled={!nouveauCommentaire.trim() || envoi} className="df-btn-primary" style={{ width: '100%' }}>
                    {envoi ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {formulaireModif && peutModifier && <FormulaireTache tache={tache} projetId={tache.projet_id} onFermer={() => setFormulaireModif(false)} onSuccess={rechargerTache} />}
        {formulaireTemps && estAdmin && <FormulaireTempsPassé tacheId={tacheId} entree={entreeModif} onFermer={() => { setFormulaireTemps(false); setEntreeModif(null) }} onSuccess={rechargerTache} />}
      </div>
    </div>
  )
}

export default PanneauTache