import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../supabase'

const MembreContext = createContext(null)

export function MembreProvider({ children }) {
  const [membreActif, setMembreActif] = useState(null)
  const [chargementAuth, setChargementAuth] = useState(true)
  const [erreurAuth, setErreurAuth] = useState(null)
  const chargeRef = useRef(false)

  // La machine à café qui prépare notre membre : on va chercher ses infos en base.
  // Elle est "idempotente" (mot compliqué pour dire : pas de panique si on l'appelle 10 fois, elle fait le boulot qu'une seule fois).
  const chargerMembre = useCallback(async (userId) => {
    if (chargeRef.current) return
    chargeRef.current = true
    console.log('[Auth] Chargement membre pour', userId)

    try {
      const { data, error } = await Promise.race([
        supabase.from('membre').select('*').eq('auth_id', userId).single(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Délai dépassé (20s)')), 20000)
        ),
      ])

      if (error || !data) {
        console.warn('[Auth] Profil introuvable:', userId, error?.message)
        chargeRef.current = false
        setErreurAuth('Aucun profil membre associé à ce compte.')
      } else {
        console.log('[Auth] Membre chargé:', data.prenom, data.nom)
        // Le pass VIP ultime : si c'est le boss, on lui donne les clés du royaume
        if (data.email === 'elmas.oulobo@daloamarket.shop' && data.role === 'collaborateur') {
          data.role = 'chef_de_projet'
        }
        setMembreActif(data)
        setErreurAuth(null)
      }
    } catch (e) {
      console.error('[Auth] Erreur:', e.message)
      chargeRef.current = false
      setErreurAuth('Le serveur met trop de temps à répondre.')
    } finally {
      setChargementAuth(false)
    }
  }, [])

  useEffect(() => {
    // Le grand radar à connexions. On surveille si quelqu'un rentre, sort, ou rafraîchit sa session.
    // (Le p'tit setTimeout c'est pour éviter que Supabase s'emmêle les pinceaux en interne, chut).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // On ne crie pas victoire dans la console si on a déjà trouvé la personne.
        if (chargeRef.current && event !== 'SIGNED_OUT') return

        console.log('[Auth] Event:', event)

        if (event === 'SIGNED_OUT') {
          chargeRef.current = false
          setMembreActif(null)
          setErreurAuth(null)
          setChargementAuth(false)
          return
        }

        // Hop, on a attrapé quelqu'un ! On va lui préparer son profil.
        if (session?.user && !chargeRef.current) {
          const uid = session.user.id
          setTimeout(() => chargerMembre(uid), 0)
        }
      }
    )

    // Plan B (la roue de secours) : si la connexion rame plus de 2s, on force la vérification.
    // React StrictMode est un peu taquin parfois, alors on assure le coup.
    const fallback = setTimeout(async () => {
      if (chargeRef.current) return // déjà chargé
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('[Auth] Fallback getSession → chargement')
          chargerMembre(session.user.id)
        } else {
          setChargementAuth(false)
        }
      } catch {
        setChargementAuth(false)
      }
    }, 2000)

    // Plan Z (le bouton d'éjection) : au bout de 12s, si rien ne marche, on débloque l'écran pour pas rester bloqué.
    const timeout = setTimeout(() => {
      if (!chargeRef.current) {
        console.warn('[Auth] Timeout 12s — déblocage forcé')
        setChargementAuth(false)
      }
    }, 12000)

    return () => {
      clearTimeout(fallback)
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [chargerMembre])

  async function deconnexion() {
    chargeRef.current = false
    await supabase.auth.signOut()
    setMembreActif(null)
    setErreurAuth(null)
  }

  return (
    <MembreContext.Provider value={{ membreActif, chargementAuth, erreurAuth, deconnexion }}>
      {children}
    </MembreContext.Provider>
  )
}

export function useMembreActif() {
  return useContext(MembreContext)
}