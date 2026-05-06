import { supabase } from '../supabase'

export async function envoyerNotifEmail(membre_id, type, contenu, lien) {
  try {
    await supabase.functions.invoke('envoyer-email-notification', {
      body: { membre_id, type, contenu, lien }
    })
  } catch (e) {
    console.log('Erreur email notification:', e)
  }
}