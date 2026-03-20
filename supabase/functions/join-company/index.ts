import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { company_id, email, password, full_name } = await req.json()

    if (!company_id || !email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: company_id, email, password, full_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the company exists
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', company_id)
      .single()

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: 'Invalid invite link — company not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Try to create auth user
    let userId: string

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) {
      // If the email is already registered, check if it's an orphaned auth user
      // (profile was deleted but auth user was not — e.g. deleted before the
      // delete-user Edge Function existed).
      if (createError.message?.includes('already been registered')) {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = !listError
          ? users?.find((u: { email?: string }) => u.email === email)
          : null

        if (existingUser) {
          // Check if they have a profile — if they do, they're a real existing user
          const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('id', existingUser.id)
            .single()

          if (existingProfile) {
            return new Response(
              JSON.stringify({ error: 'An account with this email already exists. Try signing in instead.' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Orphaned auth user — update their password and reuse
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password,
            email_confirm: true,
          })
          userId = existingUser.id
        } else {
          return new Response(
            JSON.stringify({ error: 'An account with this email already exists. Try signing in instead.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else {
        return new Response(
          JSON.stringify({ error: createError.message ?? 'Failed to create account' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      userId = newUser.user!.id
    }

    // Create profile with member role, no department (admin assigns later)
    const { error: insertError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      company_id: company.id,
      department_id: null,
      full_name: full_name.trim(),
      email: email.trim(),
      role: 'member',
    })

    if (insertError) {
      // Cleanup: delete the auth user if profile creation fails (only if we just created it)
      if (newUser?.user) {
        await supabaseAdmin.auth.admin.deleteUser(userId)
      }
      return new Response(
        JSON.stringify({ error: `Account setup failed: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        company_name: company.name,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
