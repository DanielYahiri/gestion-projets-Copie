import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

function IconCloche() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconMessage() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconTache() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function IconCommentaire() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

function IconPhase() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function iconeParType(type) {
  const config = {
    message:     { icone: <IconMessage />,     bg: 'var(--df-accent-soft)',   color: 'var(--df-accent)'   },
    commentaire: { icone: <IconCommentaire />, bg: 'var(--df-warning-soft)',  color: 'var(--df-warning)'  },
    tache:       { icone: <IconTache />,       bg: 'var(--df-success-soft)',  color: 'var(--df-success)'  },
    phase:       { icone: <IconPhase />,       bg: 'var(--df-bg-tertiary)',   color: 'var(--df-text-secondary)' },
    livrable:    { icone: <IconPhase />,       bg: 'var(--df-danger-soft)',   color: 'var(--df-danger)'   },
  }
  return config[type] || config.tache
}

function tempsRelatif(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const j = Math.floor(diff / 86400000)
  if (min < 1) return "À l'instant"
  if (min < 60) return `Il y a ${min} min`
  if (h < 24) return `Il y a ${h}h`
  return `Il y a ${j}j`
}

function Notifications({ membreActif }) {
  const [ouvert, setOuvert] = useState(false)
  const [notifications, setNotifications] = useState([])
  const panneauRef = useRef(null)
  const navigate = useNavigate()

  const nonLus = notifications.filter(n => !n.lu).length

  useEffect(() => {
    if (!membreActif) return
    chargerNotifications()

    // Abonnement temps réel
    const sub = supabase
      .channel(`notifs-${membreActif.membre_id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notification',
        filter: `membre_id=eq.${membreActif.membre_id}`
      }, payload => {
        setNotifications(prev => [payload.new, ...prev])
        // Notification navigateur
        if (Notification.permission === 'granted') {
          new Notification('DataFlow', {
            body: payload.new.contenu,
            icon: '/favicon.ico'
          })
        }
      })
      .subscribe()

    return () => supabase.removeChannel(sub)
  }, [membreActif])

  // Fermer en cliquant dehors
  useEffect(() => {
    function handleClickOutside(e) {
      if (panneauRef.current && !panneauRef.current.contains(e.target)) {
        setOuvert(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Demander permission notifications navigateur
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  async function chargerNotifications() {
    const { data } = await supabase
      .from('notification')
      .select('*')
      .eq('membre_id', membreActif.membre_id)
      .order('created_at', { ascending: false })
      .limit(30)
    setNotifications(data || [])
  }

  async function marquerToutLu() {
    await supabase
      .from('notification')
      .update({ lu: true })
      .eq('membre_id', membreActif.membre_id)
      .eq('lu', false)
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
  }

  async function marquerLu(notifId) {
    await supabase
      .from('notification')
      .update({ lu: true })
      .eq('notification_id', notifId)
    setNotifications(prev => prev.map(n => n.notification_id === notifId ? { ...n, lu: true } : n))
  }

  async function cliquerNotif(notif) {
    await marquerLu(notif.notification_id)
    setOuvert(false)
    if (notif.lien) navigate(notif.lien)
  }

  return (
    <div ref={panneauRef} style={{ position: 'relative' }}>

      {/* Bouton cloche */}
      <button
        onClick={() => setOuvert(!ouvert)}
        style={{
          position: 'relative', width: '38px', height: '38px',
          borderRadius: '10px', border: '1px solid var(--df-border)',
          background: ouvert ? 'var(--df-accent-soft)' : 'var(--df-bg-tertiary)',
          color: ouvert ? 'var(--df-accent)' : 'var(--df-text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s ease'
        }}
      >
        <IconCloche />
        {nonLus > 0 && (
          <span style={{
            position: 'absolute', top: '-5px', right: '-5px',
            background: 'var(--df-danger)', color: '#fff',
            fontSize: '10px', fontWeight: 700,
            minWidth: '18px', height: '18px', borderRadius: '9px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px'
          }}>
            {nonLus > 9 ? '9+' : nonLus}
          </span>
        )}
      </button>

      {/* Panneau notifications */}
      {ouvert && (
        <div style={{
          position: 'absolute', top: '48px', right: '0',
          width: '360px', maxHeight: '480px',
          background: 'var(--df-bg-card)', borderRadius: '16px',
          border: '1px solid var(--df-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          zIndex: 1000, overflow: 'hidden',
          display: 'flex', flexDirection: 'column'
        }}>

          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--df-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-primary)' }}>Notifications</h3>
              {nonLus > 0 && <p style={{ fontSize: '11px', color: 'var(--df-accent)' }}>{nonLus} non lue{nonLus > 1 ? 's' : ''}</p>}
            </div>
            {nonLus > 0 && (
              <button
                onClick={marquerToutLu}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '12px', color: 'var(--df-accent)',
                  background: 'var(--df-accent-soft)', border: 'none',
                  borderRadius: '8px', padding: '6px 10px', cursor: 'pointer'
                }}
              >
                <IconCheck /> Tout lire
              </button>
            )}
          </div>

          {/* Liste */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--df-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'var(--df-text-tertiary)' }}>
                  <IconCloche />
                </div>
                <p style={{ fontSize: '13px', color: 'var(--df-text-tertiary)' }}>Aucune notification</p>
              </div>
            )}
            {notifications.map(notif => {
              const { icone, bg, color } = iconeParType(notif.type)
              return (
                <div
                  key={notif.notification_id}
                  onClick={() => cliquerNotif(notif)}
                  style={{
                    padding: '14px 20px', cursor: 'pointer',
                    borderBottom: '1px solid var(--df-border)',
                    background: notif.lu ? 'transparent' : 'var(--df-accent-soft)',
                    transition: 'background 0.15s',
                    display: 'flex', gap: '12px', alignItems: 'flex-start'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--df-bg-tertiary)'}
                  onMouseLeave={e => e.currentTarget.style.background = notif.lu ? 'transparent' : 'var(--df-accent-soft)'}
                >
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {icone}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', color: 'var(--df-text-primary)', lineHeight: 1.4, marginBottom: '4px' }}>
                      {notif.contenu}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--df-text-tertiary)' }}>
                      {tempsRelatif(notif.created_at)}
                    </p>
                  </div>
                  {!notif.lu && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--df-accent)', flexShrink: 0, marginTop: '6px' }} />
                  )}
                </div>
              )
            })}
          </div>

        </div>
      )}
    </div>
  )
}

export default Notifications