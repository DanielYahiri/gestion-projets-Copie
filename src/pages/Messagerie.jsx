import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { envoyerNotifEmail } from '../utils/notifEmail'
import { useMembreActif } from '../context/MembreContext'

function IconGroupe() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconPrive() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconEnvoyer() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function Messagerie() {
  const { membreActif } = useMembreActif()
  const [conversations, setConversations] = useState([])
  const [convActive, setConvActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [nouveauMessage, setNouveauMessage] = useState('')
  const [membres, setMembres] = useState([])
  const [recherche, setRecherche] = useState('')
  const [afficherNouvelleConv, setAfficherNouvelleConv] = useState(false)
  const [nomGroupe, setNomGroupe] = useState('')
  const [membresSelectionnes, setMembresSelectionnes] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => { chargerConversations() }, [membreActif])

  useEffect(() => {
    if (!convActive) return
    chargerMessages(convActive.conversation_id)

    const sub = supabase
      .channel(`messages-${convActive.conversation_id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'message',
        filter: `conversation_id=eq.${convActive.conversation_id}`
      }, async payload => {
        // Charger les infos du membre avec le nouveau message
        const { data: membreData } = await supabase
          .from('membre')
          .select('prenom, nom')
          .eq('membre_id', payload.new.membre_id)
          .single()
        setMessages(prev => [...prev, { ...payload.new, membre: membreData }])
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      })
      .subscribe()

    return () => supabase.removeChannel(sub)
  }, [convActive])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function chargerConversations() {
    if (!membreActif) return
    const { data } = await supabase
      .from('conversation_membre')
      .select('conversation_id, conversation(conversation_id, type, nom, created_at)')
      .eq('membre_id', membreActif.membre_id)

    const convs = data?.map(d => d.conversation).filter(Boolean) || []

    // Pour les conversations privées, récupérer le nom de l'autre participant
    const convsAvecNoms = await Promise.all(convs.map(async conv => {
      if (conv.type !== 'prive') return conv

      const { data: participants } = await supabase
        .from('conversation_membre')
        .select('membre_id, membre:membre_id(prenom, nom)')
        .eq('conversation_id', conv.conversation_id)
        .neq('membre_id', membreActif.membre_id)
        .single()

      return {
        ...conv,
        nom: participants?.membre
          ? `${participants.membre.prenom} ${participants.membre.nom}`
          : 'Conversation privée'
      }
    }))

    setConversations(convsAvecNoms)
  }

  async function chargerMessages(convId) {
    const { data } = await supabase
      .from('message')
      .select('*, membre:membre_id(prenom, nom)')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    setMessages(data || [])

    // Marquer tous les messages non lus comme lus
    const nonLus = (data || []).filter(m => {
      const luPar = Array.isArray(m.lu_par) ? m.lu_par : []
      return !luPar.includes(membreActif.membre_id)
    })
    for (const msg of nonLus) {
      const luPar = Array.isArray(msg.lu_par) ? msg.lu_par : []
      await supabase.from('message').update({
        lu_par: [...luPar, membreActif.membre_id]
      }).eq('message_id', msg.message_id)
    }
  }

  async function chargerMembres() {
    const { data } = await supabase
      .from('membre')
      .select('membre_id, prenom, nom, role')
      .neq('membre_id', membreActif.membre_id)
      .order('nom')
    setMembres(data || [])
  }

  async function envoyerMessage() {
    if (!nouveauMessage.trim() || !convActive) return
    const contenu = nouveauMessage.trim()
    setNouveauMessage('')

    await supabase.from('message').insert({
      conversation_id: convActive.conversation_id,
      membre_id: membreActif.membre_id,
      contenu,
      lu_par: [membreActif.membre_id]
    })

    // Notifications pour les autres participants
    const { data: participants } = await supabase
      .from('conversation_membre')
      .select('membre_id')
      .eq('conversation_id', convActive.conversation_id)
      .neq('membre_id', membreActif.membre_id)

    if (participants?.length) {
      await supabase.from('notification').insert(
        participants.map(p => ({
          membre_id: p.membre_id,
          type: 'message',
          contenu: `${membreActif.prenom} ${membreActif.nom} : ${contenu.slice(0, 60)}${contenu.length > 60 ? '...' : ''}`,
          lien: '/messagerie'
        }))
      )
      // Email pour chaque participant
      for (const p of participants) {
        await envoyerNotifEmail(
          p.membre_id,
          'message',
          `${membreActif.prenom} ${membreActif.nom} vous a envoyé un message : ${contenu.slice(0, 60)}${contenu.length > 60 ? '...' : ''}`,
          '/messagerie'
        )
      }
    }
  }
  async function creerConversation() {
    if (membresSelectionnes.length === 0) return
    const type = membresSelectionnes.length > 1 ? 'groupe' : 'prive'
    const nom = type === 'groupe' ? (nomGroupe.trim() || 'Nouveau groupe') : null

    const { data: conv, error } = await supabase
      .from('conversation')
      .insert({ type, nom })
      .select('conversation_id, type, nom')
      .single()

    if (error) { console.error('Erreur création conversation:', error); return }

    const participants = [...new Set([...membresSelectionnes, membreActif.membre_id])]
    await supabase.from('conversation_membre').insert(
      participants.map(mid => ({ conversation_id: conv.conversation_id, membre_id: mid }))
    )

    setAfficherNouvelleConv(false)
    setMembresSelectionnes([])
    setNomGroupe('')
    await chargerConversations()
    setConvActive(conv)
  }

  function toggleMembre(id) {
    setMembresSelectionnes(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  function nomConversation(conv) {
    return conv.nom || (conv.type === 'groupe' ? 'Groupe sans nom' : 'Conversation privée')
  }

  const convFiltrees = conversations.filter(c =>
    nomConversation(c).toLowerCase().includes(recherche.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--df-border)' }}>

      {/* ── Panneau gauche ── */}
      <div style={{ width: '280px', borderRight: '1px solid var(--df-border)', background: 'var(--df-bg-card)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

        {/* Header */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--df-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-text-primary)' }}>Messages</h2>
            <button
              onClick={() => { setAfficherNouvelleConv(true); chargerMembres() }}
              className="df-btn-primary"
              style={{ fontSize: '12px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <IconPlus /> Nouveau
            </button>
          </div>
          <input
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher une conversation..."
            className="df-input"
            style={{ fontSize: '12px', padding: '8px 12px' }}
          />
        </div>

        {/* Liste conversations */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {convFiltrees.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--df-text-tertiary)', textAlign: 'center', padding: '32px 16px' }}>
              Aucune conversation.<br />Créez-en une !
            </p>
          )}
          {convFiltrees.map(conv => (
            <div
              key={conv.conversation_id}
              onClick={() => setConvActive(conv)}
              style={{
                padding: '12px 16px', cursor: 'pointer',
                borderBottom: '1px solid var(--df-border)',
                background: convActive?.conversation_id === conv.conversation_id
                  ? 'var(--df-accent-soft)' : 'transparent',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => { if (convActive?.conversation_id !== conv.conversation_id) e.currentTarget.style.background = 'var(--df-bg-tertiary)' }}
              onMouseLeave={e => { if (convActive?.conversation_id !== conv.conversation_id) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: conv.type === 'groupe' ? 'var(--df-warning-soft)' : 'var(--df-accent-soft)',
                  color: conv.type === 'groupe' ? 'var(--df-warning)' : 'var(--df-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {conv.type === 'groupe' ? <IconGroupe /> : <IconPrive />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {nomConversation(conv)}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)' }}>
                    {conv.type === 'groupe' ? 'Discussion de groupe' : 'Message privé'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panneau droit ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--df-bg-primary)', minWidth: 0 }}>
        {!convActive ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--df-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--df-accent)' }}>
              <IconPrive />
            </div>
            <p style={{ fontSize: '14px', color: 'var(--df-text-tertiary)' }}>Sélectionnez une conversation</p>
          </div>
        ) : (
          <>
            {/* Header conversation */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--df-border)', background: 'var(--df-bg-card)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: convActive.type === 'groupe' ? 'var(--df-warning-soft)' : 'var(--df-accent-soft)',
                color: convActive.type === 'groupe' ? 'var(--df-warning)' : 'var(--df-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {convActive.type === 'groupe' ? <IconGroupe /> : <IconPrive />}
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-primary)' }}>{nomConversation(convActive)}</h3>
                <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)' }}>{convActive.type === 'groupe' ? 'Discussion de groupe' : 'Message privé'}</p>
              </div>
            </div>

            {/* Zone messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.length === 0 && (
                <p style={{ fontSize: '13px', color: 'var(--df-text-tertiary)', textAlign: 'center', marginTop: '40px' }}>
                  Aucun message. Commencez la conversation !
                </p>
              )}
              {messages.map(msg => {
                const estMoi = msg.membre_id === membreActif.membre_id
                return (
                  <div key={msg.message_id} style={{ display: 'flex', justifyContent: estMoi ? 'flex-end' : 'flex-start', gap: '8px', alignItems: 'flex-end' }}>
                    {!estMoi && (
                      <div className="df-avatar" style={{ width: '30px', height: '30px', fontSize: '10px', flexShrink: 0, borderRadius: '8px' }}>
                        {msg.membre?.prenom?.[0]}{msg.membre?.nom?.[0]}
                      </div>
                    )}
                    <div style={{ maxWidth: '60%' }}>
                      {!estMoi && (
                        <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)', marginBottom: '4px', paddingLeft: '4px' }}>
                          {msg.membre?.prenom} {msg.membre?.nom}
                        </p>
                      )}
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: estMoi ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: estMoi ? 'var(--df-accent)' : 'var(--df-bg-card)',
                        color: estMoi ? '#fff' : 'var(--df-text-primary)',
                        fontSize: '13px', lineHeight: 1.6,
                        border: estMoi ? 'none' : '1px solid var(--df-border)',
                        wordBreak: 'break-word'
                      }}>
                        {msg.contenu}
                      </div>
                      <p style={{ fontSize: '10px', color: 'var(--df-text-tertiary)', marginTop: '4px', textAlign: estMoi ? 'right' : 'left', paddingLeft: '4px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: estMoi ? 'flex-end' : 'flex-start' }}>
                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {estMoi && (() => {
                          const luPar = Array.isArray(msg.lu_par) ? msg.lu_par : []
                          const luParAutres = luPar.filter(id => id !== membreActif.membre_id)
                          return luParAutres.length > 0 ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--df-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                              <polyline points="16 6 9 17 4 12" style={{ transform: 'translateX(-4px)' }} />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--df-text-tertiary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )
                        })()}
                      </p>
                    </div>
                    {estMoi && (
                      <div className="df-avatar" style={{ width: '30px', height: '30px', fontSize: '10px', flexShrink: 0, borderRadius: '8px' }}>
                        {membreActif.prenom?.[0]}{membreActif.nom?.[0]}
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input message */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--df-border)', background: 'var(--df-bg-card)', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                value={nouveauMessage}
                onChange={e => setNouveauMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyerMessage() } }}
                placeholder="Écrire un message... (Entrée pour envoyer)"
                className="df-input"
                style={{ flex: 1, fontSize: '13px' }}
              />
              <button
                onClick={envoyerMessage}
                className="df-btn-primary"
                style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                disabled={!nouveauMessage.trim()}
              >
                <IconEnvoyer />
                Envoyer
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Modal nouvelle conversation ── */}
      {afficherNouvelleConv && (
        <div
          className="df-overlay"
          onClick={() => { setAfficherNouvelleConv(false); setMembresSelectionnes([]); setNomGroupe('') }}
        >
          <div className="df-modal" onClick={e => e.stopPropagation()} style={{ width: '420px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: 'var(--df-text-primary)' }}>
              Nouvelle conversation
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--df-text-tertiary)', marginBottom: '20px' }}>
              Sélectionnez un membre pour une conversation privée, ou plusieurs pour un groupe.
            </p>

            {membresSelectionnes.length > 1 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Nom du groupe
                </label>
                <input
                  value={nomGroupe}
                  onChange={e => setNomGroupe(e.target.value)}
                  placeholder="Ex: Équipe projet VAR"
                  className="df-input"
                />
              </div>
            )}

            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', display: 'block', marginBottom: '8px' }}>
              Membres ({membresSelectionnes.length} sélectionné{membresSelectionnes.length > 1 ? 's' : ''})
            </label>
            <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--df-border)', borderRadius: '10px', marginBottom: '20px' }}>
              {membres.map(m => {
                const sel = membresSelectionnes.includes(m.membre_id)
                return (
                  <div
                    key={m.membre_id}
                    onClick={() => toggleMembre(m.membre_id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', cursor: 'pointer',
                      background: sel ? 'var(--df-accent-soft)' : 'transparent',
                      borderBottom: '1px solid var(--df-border)',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div className="df-avatar" style={{ width: '32px', height: '32px', fontSize: '10px', borderRadius: '8px', flexShrink: 0 }}>
                      {m.prenom?.[0]}{m.nom?.[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-primary)' }}>{m.prenom} {m.nom}</p>
                      <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)', textTransform: 'capitalize' }}>{m.role?.replace(/_/g, ' ')}</p>
                    </div>
                    {sel && (
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--df-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                        <IconCheck />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setAfficherNouvelleConv(false); setMembresSelectionnes([]); setNomGroupe('') }}
                className="df-btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={creerConversation}
                className="df-btn-primary"
                disabled={membresSelectionnes.length === 0}
              >
                {membresSelectionnes.length > 1 ? 'Créer le groupe' : 'Démarrer la conversation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Messagerie