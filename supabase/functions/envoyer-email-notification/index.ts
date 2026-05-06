import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

async function envoyerEmail(to: string, sujet: string, contenuHtml: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "DataFlow <onboarding@resend.dev>",
      to: [to],
      subject: sujet,
      html: contenuHtml
    })
  })
  return res.ok
}

serve(async (req) => {
  try {
    const { membre_id, type, contenu, lien } = await req.json()

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data: membre, error } = await supabase
      .from("membre")
      .select("email, prenom, nom")
      .eq("membre_id", membre_id)
      .single()

    if (error || !membre?.email) {
      return new Response(JSON.stringify({ error: "Membre introuvable" }), { status: 404 })
    }

    const sujets: Record<string, string> = {
      message:     "💬 Nouveau message — DataFlow",
      commentaire: "🗨️ Nouveau commentaire — DataFlow",
      tache:       "✅ Mise à jour de tâche — DataFlow",
      phase:       "📋 Nouvelle phase — DataFlow",
      livrable:    "📦 Nouveau livrable — DataFlow",
    }

    const sujet = sujets[type] || "🔔 Nouvelle notification — DataFlow"

    const contenuHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f1117; color: #ffffff; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6c63ff, #4f46e5); padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">⚡ DataFlow</h1>
          <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">Plateforme de gestion de projets</p>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 15px; line-height: 1.6; color: #e2e8f0;">
            Bonjour <strong>${membre.prenom}</strong>,
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #e2e8f0;">
            ${contenu}
          </p>
          ${lien ? `
            <a href="https://votre-app.vercel.app${lien}"
              style="display: inline-block; background: #6c63ff; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
              Voir sur DataFlow →
            </a>
          ` : ''}
        </div>
        <div style="padding: 20px 32px; border-top: 1px solid #1e2535; text-align: center;">
          <p style="font-size: 12px; color: #64748b; margin: 0;">
            Vous recevez cet email car vous êtes membre de DataFlow.
          </p>
        </div>
      </div>
    `

    await envoyerEmail(membre.email, sujet, contenuHtml)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})