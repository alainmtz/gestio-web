import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SB_URL = Deno.env.get('SB_URL')!
const SB_SERVICE_ROLE_KEY = Deno.env.get('SB_SERVICE_ROLE_KEY')!

const supabaseAdmin = createClient(SB_URL, SB_SERVICE_ROLE_KEY)

const APP_URL = 'https://gestio-web.vercel.app'

interface InviteRequest {
  organization_id: string
  email: string
  role: 'owner' | 'admin' | 'member'
  invited_by: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const body: InviteRequest = await req.json()
    const { organization_id, email, role, invited_by } = body

    if (!organization_id || !email || !role || !invited_by) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Get organization name
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('name')
      .eq('id', organization_id)
      .single()

    if (!org) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Get inviter name
    const { data: inviterProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', invited_by)
      .single()

    const inviterName = inviterProfile?.full_name || email.split('@')[0]

    // Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingProfile) {
      // User exists → create pending member
      const { error: memberError } = await supabaseAdmin
        .from('organization_members')
        .insert({
          user_id: existingProfile.id,
          organization_id,
          role,
          is_active: false,
          invited_by,
        })

      if (memberError) {
        if (memberError.code === '23505') {
          return new Response(
            JSON.stringify({ error: 'Este usuario ya es miembro de la organización' }),
            { status: 409, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }
        throw memberError
      }

      // Send email: you've been invited, login to accept
      await sendEmail({
        to: email,
        subject: `${inviterName} te invita a unirte a ${org.name}`,
        html: `
          <h2>¡Has sido invitado a ${org.name}!</h2>
          <p>${inviterName} te ha invitado a unirte a su organización en Gestio.</p>
          <p>Como ya tienes una cuenta, solo necesitas iniciar sesión y aceptar la invitación.</p>
          <a href="${APP_URL}/auth/login?invite=pending"
             style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
            Iniciar sesión y aceptar
          </a>
          <p style="color:#666;font-size:12px;">Si no esperabas esta invitación, puedes ignorar este correo.</p>
        `,
      })

      return new Response(
        JSON.stringify({ success: true, user_exists: true, message: 'Invitation sent to registered user' }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    } else {
      // User doesn't exist → create invitation with token
      const { data: invitation, error: inviteError } = await supabaseAdmin
        .from('organization_invitations')
        .insert({
          organization_id,
          email: email.toLowerCase(),
          role,
          invited_by,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single()

      if (inviteError) throw inviteError

      const acceptUrl = `${APP_URL}/accept-invitation/${invitation.invitation_token}`

      // Send email: register and join
      await sendEmail({
        to: email,
        subject: `${inviterName} te invita a unirte a ${org.name}`,
        html: `
          <h2>¡Has sido invitado a ${org.name}!</h2>
          <p>${inviterName} te ha invitado a unirte a su organización en Gestio.</p>
          <p>Crea una cuenta para aceptar la invitación y comenzar a trabajar.</p>
          <a href="${acceptUrl}"
             style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
            Aceptar invitación
          </a>
          <p style="color:#666;font-size:12px;">Este enlace expira en 7 días. Si no esperabas esta invitación, puedes ignorar este correo.</p>
        `,
      })

      return new Response(
        JSON.stringify({ success: true, user_exists: false, invitation_id: invitation.id }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping email send')
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Gestio <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend API error: ${res.status} ${body}`)
  }
}
