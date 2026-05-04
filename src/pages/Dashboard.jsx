import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Chargement from '../components/Chargement'

function StatCard({ label, valeur, unite, couleur, icone }) {
  return (
    <div className="df-stat-card">
      <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--df-text-tertiary)', marginBottom: '8px' }}>{label}</p>
      <p style={{ fontSize: '28px', fontWeight: 800, color: couleur || 'var(--df-text-primary)', lineHeight: 1.1 }}>
        {typeof valeur === 'number' ? valeur.toLocaleString('fr-FR') : valeur}
        {unite && <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--df-text-tertiary)', marginLeft: '6px' }}>{unite}</span>}
      </p>
    </div>
  )
}

function SectionCard({ titre, count, couleur, children }) {
  return (
    <div className="df-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        {couleur && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: couleur, flexShrink: 0 }} />}
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--df-text-primary)', flex: 1 }}>{titre}</h2>
        {count !== undefined && (
          <span className="df-badge" style={{ background: 'var(--df-bg-tertiary)', color: 'var(--df-text-tertiary)' }}>{count}</span>
        )}
      </div>
      {children}
    </div>
  )
}

function ListItem({ primary, secondary, right, rightSub, rightColor, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 12px',
        borderRadius: '10px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'var(--df-bg-hover)' }}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--df-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{primary}</p>
        {secondary && <p style={{ fontSize: '12px', color: 'var(--df-text-tertiary)', marginTop: '2px' }}>{secondary}</p>}
      </div>
      {(right || rightSub) && (
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
          {right && <p style={{ fontSize: '13px', fontWeight: 600, color: rightColor || 'var(--df-text-secondary)' }}>{right}</p>}
          {rightSub && <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)', marginTop: '1px' }}>{rightSub}</p>}
        </div>
      )}
    </div>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const [projets, setProjets] = useState([])
  const [retards, setRetards] = useState([])
  const [bloques, setBloques] = useState([])
  const [membres, setMembres] = useState([])
  const [livrables, setLivrables] = useState([])
  const [facturation, setFacturation] = useState([])
  const [activite, setActivite] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    async function chargerDonnees() {
      const { data: dataProjets } = await supabase.from('vue_projet_complet').select('*').eq('statut', 'en_cours').order('date_debut', { ascending: false })
      const { data: dataRetards } = await supabase.rpc('get_retard_taches')
      const { data: dataBloques } = await supabase.from('vue_taches_membres').select('tache_id, titre, projet_id, projet_nom, phase_nom, membres_affectes, date_echeance').eq('statut', 'bloque').order('date_echeance', { ascending: true })
      const { data: dataMembres } = await supabase.from('vue_charge_membre').select('*').gt('nb_taches_en_cours', 0).order('nb_taches_en_cours', { ascending: false })
      const today = new Date().toISOString().split('T')[0]
      const in30 = new Date(); in30.setDate(in30.getDate() + 30)
      const { data: dataLivrables } = await supabase.from('vue_livrable_projet').select('*').gte('date_livraison', today).lte('date_livraison', in30.toISOString().split('T')[0]).order('date_livraison', { ascending: true })
      const { data: dataFacturation } = await supabase.from('vue_facturation').select('*')
      const { data: dataActivite } = await supabase.from('vue_taches_membres').select('tache_id, titre, projet_nom, projet_id, commentaires_rattaches, nb_commentaires').gt('nb_commentaires', 0).order('updated_at', { ascending: false }).limit(5)

      setProjets(dataProjets || []); setRetards(dataRetards || []); setBloques(dataBloques || [])
      setMembres(dataMembres || []); setLivrables(dataLivrables || []); setFacturation(dataFacturation || [])
      setActivite(dataActivite || []); setChargement(false)
    }
    chargerDonnees()
  }, [])

  const totalFacturable = facturation.reduce((sum, f) => sum + Number(f.montant_heures_facturables), 0)
  const totalFacture    = facturation.reduce((sum, f) => sum + Number(f.montant_facture_forfait), 0)

  if (chargement) return <div className="animate-fadeIn"><Chargement nombre={4} /></div>

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="df-page-header">
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--df-text-primary)', letterSpacing: '-0.02em' }}>Tableau de bord</h1>
          <p style={{ fontSize: '13px', color: 'var(--df-text-tertiary)', marginTop: '4px' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard label="Projets en cours" valeur={projets.length} couleur="var(--df-accent)" />
        <StatCard label="Tâches en retard" valeur={retards.length} couleur={retards.length > 0 ? 'var(--df-danger)' : 'var(--df-success)'} />
        <StatCard label="Membres actifs" valeur={membres.length} couleur="var(--df-accent)" />
        <StatCard label="Total facturable" valeur={totalFacturable} couleur="var(--df-text-primary)" unite="FCFA" />
      </div>

      {/* Alerts */}
      {retards.length > 0 && (
        <SectionCard titre="Tâches en retard" count={retards.length} couleur="var(--df-danger)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {retards.slice(0, 5).map(t => (
              <ListItem
                key={t.tache_id}
                primary={t.titre}
                secondary={`${t.projet_nom} · ${t.membre_prenom} ${t.membre_nom}`}
                right={`${t.jours_retard}j`}
                rightColor="var(--df-danger)"
                onClick={() => t.projet_id && navigate(`/projets/${t.projet_id}`)}
              />
            ))}
          </div>
        </SectionCard>
      )}

      {bloques.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <SectionCard titre="Tâches bloquées" count={bloques.length} couleur="var(--df-warning)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {bloques.slice(0, 5).map(t => {
                const membresT = Array.isArray(t.membres_affectes) ? t.membres_affectes : (() => { try { return JSON.parse(t.membres_affectes || '[]') } catch { return [] } })()
                const premierMembre = membresT[0]
                return (
                  <ListItem
                    key={t.tache_id}
                    primary={t.titre}
                    secondary={`${t.projet_nom}${t.phase_nom ? ` · ${t.phase_nom}` : ''}${premierMembre ? ` · ${premierMembre.prenom} ${premierMembre.nom}` : ''}`}
                    right={t.date_echeance}
                    rightColor="var(--df-warning)"
                    onClick={() => t.projet_id && navigate(`/projets/${t.projet_id}`)}
                  />
                )
              })}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px', marginTop: '24px' }}>
        <SectionCard titre="Projets en cours" count={projets.length}>
          {projets.length === 0 && <p className="df-empty">Aucun projet en cours.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {projets.map(p => (
              <ListItem
                key={p.projet_id}
                primary={p.projet_nom}
                secondary={p.client_nom}
                right={p.date_fin}
                onClick={() => navigate(`/projets/${p.projet_id}`)}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard titre="Livrables à venir" count={livrables.length}>
          {livrables.length === 0 && <p className="df-empty">Aucun livrable dans les 30 prochains jours.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {livrables.map(l => (
              <ListItem
                key={l.livrable_id}
                primary={l.livrable_nom}
                secondary={l.projet_nom}
                right={l.date_livraison}
                rightSub={l.type}
                rightColor="var(--df-accent)"
                onClick={() => navigate(`/projets/${l.projet_id}`)}
              />
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Team charge */}
      <div style={{ marginTop: '24px' }}>
        <SectionCard titre={`Charge équipe`} count={`${membres.length} actif(s)`}>
          {membres.length === 0 && <p className="df-empty">Aucun membre avec des tâches en cours.</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
            {membres.map(m => {
              const charge = m.nb_taches_en_cours
              const surcharge = charge >= 5
              const moyenne = charge >= 3 && charge < 5
              const barColor = surcharge ? 'var(--df-danger)' : moyenne ? 'var(--df-warning)' : 'var(--df-success)'
              return (
                <div
                  key={m.membre_id}
                  onClick={() => navigate(`/membres/${m.membre_id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.15s ease' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--df-bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="df-avatar df-avatar-sm">{m.prenom?.[0]}{m.nom?.[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-primary)' }}>{m.prenom} {m.nom}</p>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: barColor }}>{charge} tâche(s)</span>
                    </div>
                    <div className="df-progress-track">
                      <div className="df-progress-fill" style={{ width: `${Math.min((charge / 7) * 100, 100)}%`, background: barColor }} />
                    </div>
                    {m.nb_taches_en_retard > 0 && (
                      <p style={{ fontSize: '11px', color: 'var(--df-danger)', marginTop: '4px' }}>{m.nb_taches_en_retard} en retard</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px', marginTop: '24px' }}>
        <SectionCard titre="Activité récente">
          {activite.length === 0 && <p className="df-empty">Aucune activité récente.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {activite.map((t, index) => {
              const commentaires = Array.isArray(t.commentaires_rattaches) ? t.commentaires_rattaches : (() => { try { return JSON.parse(t.commentaires_rattaches || '[]') } catch { return [] } })()
              const dernier = commentaires[commentaires.length - 1]
              if (!dernier) return null
              return (
                <div
                  key={`${t.tache_id}-${index}`}
                  onClick={() => t.projet_id && navigate(`/projets/${t.projet_id}`)}
                  style={{ padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.15s ease' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--df-bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)' }}>{dernier.membre_prenom} {dernier.membre_nom}</p>
                    <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)' }}>{dernier.date ? new Date(dernier.date).toLocaleDateString('fr-FR') : ''}</p>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--df-text-primary)' }}>{dernier.contenu}</p>
                  <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)', marginTop: '4px' }}>{t.projet_nom} · {t.titre}</p>
                </div>
              )
            })}
          </div>
        </SectionCard>

        <SectionCard titre="Facturation globale">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {facturation.map(f => (
              <ListItem
                key={f.projet_id}
                primary={f.projet_nom}
                secondary={f.client_nom}
                right={`${Number(f.montant_facture_forfait).toLocaleString('fr-FR')} FCFA`}
                rightSub={f.statut_paiement === 'payee' ? 'Payé' : f.statut_paiement === 'en_retard' ? 'En retard' : 'En attente'}
                rightColor={f.statut_paiement === 'payee' ? 'var(--df-success)' : f.statut_paiement === 'en_retard' ? 'var(--df-danger)' : 'var(--df-warning)'}
                onClick={() => navigate(`/projets/${f.projet_id}`)}
              />
            ))}
          </div>
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--df-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '12px', color: 'var(--df-text-tertiary)' }}>Total facturé</p>
            <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--df-text-primary)' }}>{totalFacture.toLocaleString('fr-FR')} FCFA</p>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

export default Dashboard