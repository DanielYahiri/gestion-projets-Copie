import { useState, useEffect } from 'react'

/* ──────────── Le grand livre des énigmes (pour embêter les gens) ──────────── */
const ENIGMES = [
  { q: "Plus j'ai de gardiens, moins je suis en sécurité. Qui suis-je ?", r: "Un secret", f: ["Un coffre-fort", "Un mot de passe"] },
  { q: "Plus tu m'enlèves, plus je grandis.", r: "Un trou", f: ["Un arbre", "Une rivière"] },
  { q: "Je peux faire le tour du monde en restant dans un coin.", r: "Un timbre", f: ["Une fourmi", "Un satellite"] },
  { q: "Qu'est-ce qui est à toi mais que les autres utilisent plus que toi ?", r: "Ton nom", f: ["Ton téléphone", "Ta voiture"] },
  { q: "Plus je sèche, plus je mouille.", r: "Une serviette", f: ["Une éponge", "Un nuage"] },
  { q: "Je suis toujours devant toi mais tu ne peux jamais m'atteindre.", r: "Le futur", f: ["L'horizon", "Le soleil"] },
  { q: "Si tu dis mon nom, je disparais.", r: "Le silence", f: ["Un fantôme", "Un rêve"] },
  { q: "Qu'est-ce qui monte et descend sans bouger ?", r: "Un escalier", f: ["Un ascenseur", "La température"] },
  { q: "J'ai des clés mais aucune serrure.", r: "Un clavier", f: ["Un piano", "Un trousseau"] },
  { q: "On me casse avant de m'utiliser.", r: "Un œuf", f: ["Une promesse", "Un sceau"] },
  { q: "Je parle sans bouche et j'entends sans oreilles.", r: "Un écho", f: ["Un robot", "Un livre"] },
  { q: "Qu'est-ce qui peut remplir une pièce sans prendre d'espace ?", r: "La lumière", f: ["L'air", "Le son"] },
  { q: "Les pauvres en ont. Les riches en ont besoin. Si tu en manges, tu meurs.", r: "Rien", f: ["La faim", "L'eau"] },
  { q: "Je te suis partout mais disparais la nuit.", r: "Ton ombre", f: ["Le soleil", "Un chat"] },
  { q: "Qu'est-ce qui court sans jambes ?", r: "L'eau", f: ["Le vent", "Le temps"] },
  { q: "Un homme pousse sa voiture devant un hôtel et perd sa fortune. Pourquoi ?", r: "Il joue au Monopoly", f: ["Il a fait un pari", "L'hôtel est un casino"] },
  { q: "Plus il y en a, moins on en voit.", r: "L'obscurité", f: ["Les étoiles", "La fumée"] },
  { q: "Je commence la nuit et je termine le matin. Qui suis-je ?", r: "La lettre N", f: ["La lune", "Le sommeil"] },
  { q: "Quel mois contient 28 jours ?", r: "Tous les mois", f: ["Février", "Aucun"] },
  { q: "Qu'est-ce qui a un cou mais pas de tête ?", r: "Une bouteille", f: ["Un pull", "Un vase"] },
  { q: "Je suis pris avant même d'être obtenu.", r: "Une photo", f: ["Un otage", "Un billet"] },
  { q: "Tu me jettes quand tu veux m'utiliser, puis tu me ramènes quand tu as fini.", r: "Une ancre", f: ["Un filet", "Un boomerang"] },
  { q: "Qu'est-ce qui possède des dents mais ne mord jamais ?", r: "Un peigne", f: ["Une fourchette", "Une scie"] },
  { q: "Plus je travaille, plus je deviens maigre.", r: "Une bougie", f: ["Un crayon", "Une gomme"] },
  { q: "Je suis léger comme une plume, mais impossible à retenir longtemps.", r: "Le souffle", f: ["Un ballon", "Une bulle"] },
  { q: "Plus tu prends de moi, plus tu laisses derrière toi.", r: "Des pas", f: ["Du temps", "Des souvenirs"] },
  { q: "J'ai un œil mais je ne vois rien.", r: "Une aiguille", f: ["Un cyclone", "Une caméra"] },
  { q: "Je monte sans jamais descendre.", r: "L'âge", f: ["La fumée", "Un avion"] },
  { q: "Qu'est-ce qui a des villes sans maisons, des rivières sans eau ?", r: "Une carte", f: ["Un jeu vidéo", "Un rêve"] },
  { q: "Plus on est nombreux, moins on voit.", r: "Le brouillard", f: ["La foule", "La nuit"] },
]

/* Mélange façon Fisher-Yates (parce qu'on aime le chaos organisé) */
function melanger(arr) {
  const copie = [...arr]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return copie
}

function piocherEnigme(precedente) {
  let enigme
  do {
    enigme = ENIGMES[Math.floor(Math.random() * ENIGMES.length)]
  } while (enigme === precedente && ENIGMES.length > 1)
  return enigme
}

/* ──────────── Le mur infranchissable (sauf si t'es malin) ──────────── */
export default function Enigme({ onResolue }) {
  const [enigme, setEnigme] = useState(() => piocherEnigme(null))
  const [choix, setChoix] = useState([])
  const [shake, setShake] = useState(false)
  const [succes, setSucces] = useState(false)
  const [mauvais, setMauvais] = useState(null)

  useEffect(() => {
    setChoix(melanger([enigme.r, ...enigme.f]))
    setMauvais(null)
  }, [enigme])

  function repondre(reponse) {
    if (reponse === enigme.r) {
      setSucces(true)
      setTimeout(() => onResolue(), 800)
    } else {
      setMauvais(reponse)
      setShake(true)
      setTimeout(() => {
        setShake(false)
        setEnigme(piocherEnigme(enigme))
      }, 700)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      background: 'rgba(10, 14, 26, 0.75)',
      animation: 'overlayIn 0.3s ease-out',
    }}>
      <div style={{
        width: '100%', maxWidth: '480px', margin: '0 20px',
        background: 'var(--df-bg-modal)',
        border: '1px solid var(--df-border)',
        borderRadius: '24px',
        padding: '40px 32px',
        boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
        textAlign: 'center',
        animation: shake ? 'enigmeShake 0.5s ease' : succes ? 'enigmeSuccess 0.6s ease' : 'scaleIn 0.35s ease-out',
      }}>
        {/* Icône cadenas */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '20px',
          background: succes ? 'linear-gradient(135deg, #10b981, #34d399)' : 'var(--df-accent-gradient)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: '28px',
          boxShadow: succes ? '0 8px 24px rgba(16,185,129,0.3)' : '0 8px 24px rgba(99,102,241,0.3)',
          transition: 'all 0.3s ease',
        }}>
          {succes ? '🎉' : '🔒'}
        </div>

        <h2 style={{
          fontSize: '18px', fontWeight: 700,
          color: 'var(--df-text-primary)',
          marginBottom: '6px',
        }}>
          {succes ? 'Bien joué !' : 'Pause énigme'}
        </h2>

        <p style={{
          fontSize: '13px', color: 'var(--df-text-tertiary)',
          marginBottom: '28px',
        }}>
          {succes ? 'Tu as mérité de continuer...' : 'Résous cette énigme pour reprendre ton travail'}
        </p>

        {!succes && (
          <>
            <p style={{
              fontSize: '16px', fontWeight: 600, lineHeight: 1.6,
              color: 'var(--df-text-primary)',
              background: 'var(--df-bg-tertiary)',
              borderRadius: '16px', padding: '20px',
              border: '1px solid var(--df-border)',
              marginBottom: '24px',
            }}>
              « {enigme.q} »
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {choix.map((c, i) => (
                <button
                  key={c + i}
                  onClick={() => repondre(c)}
                  style={{
                    padding: '14px 20px',
                    borderRadius: '14px',
                    border: mauvais === c ? '2px solid var(--df-danger)' : '1px solid var(--df-border)',
                    background: mauvais === c ? 'var(--df-danger-soft)' : 'var(--df-bg-card)',
                    color: mauvais === c ? 'var(--df-danger)' : 'var(--df-text-primary)',
                    fontSize: '14px', fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => {
                    if (mauvais !== c) {
                      e.currentTarget.style.borderColor = 'var(--df-accent)'
                      e.currentTarget.style.background = 'var(--df-accent-soft)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (mauvais !== c) {
                      e.currentTarget.style.borderColor = 'var(--df-border)'
                      e.currentTarget.style.background = 'var(--df-bg-card)'
                    }
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* CSS pour les animations du composant (shake + success) */}
      <style>{`
        @keyframes enigmeShake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-12px) rotate(-1deg); }
          30% { transform: translateX(10px) rotate(1deg); }
          45% { transform: translateX(-8px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
        }
        @keyframes enigmeSuccess {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}
