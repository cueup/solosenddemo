import { serve } from "https://deno.land/std@0.168.0/http/server.ts"     
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'    

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, 
content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invitation, type = 'team' } = await req.json()

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!       
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generate invitation link
    const baseUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000'  
    const invitationUrl =
`${baseUrl}/accept-invitation?token=${invitation.token}&type=${type}`    

    // Email content
    const subject = type === 'service'
      ? `Invitation to join service`
      : `Invitation to join team`

    const htmlContent = `
      <h2>You've been invited!</h2>
      <p>Hello ${invitation.full_name},</p>
      <p>You've been invited to join as a
<strong>${invitation.role}</strong>.</p>
      <p><a href="${invitationUrl}" style="background: #2563eb; color:   
white; padding: 12px 24px; text-decoration: none; border-radius:
6px;">Accept Invitation</a></p>
      <p>This invitation expires on ${new
Date(invitation.expires_at).toLocaleDateString()}.</p>
      <p>If the button doesn't work, copy and paste this link:
${invitationUrl}</p>
    `                                                                    

    // Send email using your preferred service (e.g., Resend, SendGrid,  
etc.)
    // For now, we'll use a mock response
    console.log('Would send email to:', invitation.email)
    console.log('Subject:', subject)
    console.log('Content:', htmlContent)

    return new Response(
      JSON.stringify({ success: true, message: 'Invitation sent' }),     
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400
      }
    )
  }
}) 