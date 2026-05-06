import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const iconeParType: Record<string, string> = {
  message:     "💬",
  commentaire: "🗨️",
  tache:       "✅",
  phase:       "📋",
  livrable:    "📦",
}

const couleurParType: Record<string, string> = {
  message:     "#6c63ff",
  commentaire: "#f59e0b",
  tache:       "#10b981",
  phase:       "#3b82f6",
  livrable:    "#ef4444",
}

const labelParType: Record<string, string> = {
  message:     "Nouveau message",
  commentaire: "Nouveau commentaire",
  tache:       "Mise à jour de tâche",
  phase:       "Nouvelle phase",
  livrable:    "Nouveau livrable",
}

async function envoyerEmail(to: string, sujet: string, contenuHtml: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "DataFlow <onboarding@resend.dev>",
      reply_to: "noreply@dataflow.app",
      to: [to],
      subject: sujet,
      html: contenuHtml
    })
  })
  const data = await res.json()
  console.log("Resend response:", data)
  return res.ok
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { membre_id, type, contenu, lien } = await req.json()

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data: membre, error } = await supabase
      .from("membre")
      .select("email, prenom, nom")
      .eq("membre_id", membre_id)
      .single()

    if (error || !membre?.email) {
      return new Response(
        JSON.stringify({ error: "Membre introuvable" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const icone = iconeParType[type] || "🔔"
    const couleur = couleurParType[type] || "#6c63ff"
    const label = labelParType[type] || "Notification"
    const sujet = `${icone} ${label} — DataFlow`
    const now = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

    const contenuHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sujet}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0d14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0d14; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6c63ff 0%, #4f46e5 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
              <div style="display: inline-flex; align-items: center; gap: 10px;">
                <div style="width: 36px; height: 36px; background: rgba(255,255,255,0.2); border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px;">⚡</div>
                <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">DataFlow</span>
              </div>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.7); font-size: 13px;">Plateforme de gestion de projets</p>
            </td>
          </tr>

          <!-- Badge type -->
          <tr>
            <td style="background: #0f1117; padding: 24px 32px 0; text-align: center;">
              <span style="display: inline-block; background: ${couleur}22; color: ${couleur}; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 20px; border: 1px solid ${couleur}44; letter-spacing: 0.05em; text-transform: uppercase;">
                ${icone} ${label}
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background: #0f1117; padding: 24px 32px 32px;">
              <p style="font-size: 16px; color: #94a3b8; margin: 0 0 8px;">Bonjour <strong style="color: #e2e8f0;">${membre.prenom} ${membre.nom}</strong>,</p>
              <div style="background: #1e2535; border-left: 3px solid ${couleur}; border-radius: 0 10px 10px 0; padding: 16px 20px; margin: 20px 0;">
                <p style="font-size: 15px; color: #e2e8f0; margin: 0; line-height: 1.6;">${contenu}</p>
              </div>
              <p style="font-size: 13px; color: #64748b; margin: 0 0 24px;">
                Reçu le ${now}
              </p>
              ${lien ? `
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="https://gestion-projet-black.vercel.app${lien}"
                      style="display: inline-block; background: linear-gradient(135deg, #6c63ff, #4f46e5); color: #ffffff; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 10px; text-decoration: none; letter-spacing: 0.02em;">
                      Voir sur DataFlow →
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="background: #0f1117; padding: 0 32px;">
              <div style="border-top: 1px solid #1e2535;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #0f1117; border-radius: 0 0 16px 16px; padding: 20px 32px; text-align: center;">
              <p style="font-size: 12px; color: #475569; margin: 0 0 6px;">
                Cet email a été envoyé automatiquement par DataFlow.
              </p>
              <p style="font-size: 12px; color: #475569; margin: 0;">
                ⚠️ Merci de ne pas répondre à cet email — il ne sera pas lu.
                Pour toute communication, utilisez la <a href="https://gestion-projet-black.vercel.app/messagerie" style="color: #6c63ff; text-decoration: none;">messagerie DataFlow</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    await envoyerEmail(membre.email, sujet, contenuHtml)

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (e) {
    console.log("Erreur:", e.message)
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})