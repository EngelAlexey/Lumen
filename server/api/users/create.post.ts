import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const supabaseAdmin = serverSupabaseServiceRole(event) as any
    const user = await serverSupabaseUser(event)
    const body = await readBody(event)

    // Fallback: Manually parse cookie if serverSupabaseUser fails
    if (!user || !user.id) {
        const headers = getRequestHeaders(event)
        const cookies = parseCookies(event)

        // Try to find the auth token in cookies
        // Pattern: sb-<reference_id>-auth-token
        const authCookieName = Object.keys(cookies).find(name => name.startsWith('sb-') && name.endsWith('-auth-token'))
        const authCookie = authCookieName ? cookies[authCookieName] : null

        if (authCookie) {
            try {
                // The cookie is often a JSON object string (or base64 encoded JSON)
                // Format: ["access_token","..."] or {"access_token":"..."} or "base64..."
                // Based on user feedback: "base64-eyJ..."

                let accessToken = ''

                if (authCookie.startsWith('base64-')) {
                    const jsonStr = Buffer.from(authCookie.substring(7), 'base64').toString('utf-8')
                    const session = JSON.parse(jsonStr)
                    accessToken = session.access_token
                } else {
                    // Try parsing as JSON directly just in case
                    try {
                        const session = JSON.parse(authCookie)
                        accessToken = session.access_token
                    } catch {
                        // Maybe it's just the token? Unlikely for Supabase default
                        accessToken = authCookie
                    }
                }

                if (accessToken) {
                    // Verify manually using Admin client
                    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken)

                    if (userData && userData.user) {
                        // Found user via fallback!
                        // Reassign user variable (we need to declare it as let above or handle logic here)
                        // Since 'user' is const, let's use a new variable for 'requester' logic
                        // We will shadow 'user' logic below or refactor. 
                        // To be safe, let's just create a 'requesterId' variable.
                    }
                }
            } catch (e) {
                console.error('Debug: Failed to parse fallback cookie', e)
            }
        }
    }

    // REFACTOR: Use a 'requesterUser' variable
    let requesterUser = user

    if (!requesterUser || !requesterUser.id) {
        // Retry extraction for the scope of this variable
        const cookies = parseCookies(event)
        const authCookieName = Object.keys(cookies).find(name => name.startsWith('sb-') && name.endsWith('-auth-token'))
        if (authCookieName) {
            const authCookie = cookies[authCookieName]
            let accessToken = ''
            try {
                if (authCookie.startsWith('base64-')) {
                    const jsonStr = Buffer.from(authCookie.substring(7), 'base64').toString('utf-8')
                    accessToken = JSON.parse(jsonStr).access_token
                } else {
                    accessToken = JSON.parse(authCookie).access_token
                }

                if (accessToken) {
                    const { data, error } = await supabaseAdmin.auth.getUser(accessToken)
                    if (data.user) requesterUser = data.user
                }
            } catch (e) { console.error('Token extraction error', e) }
        }
    }

    if (!requesterUser || !requesterUser.id) {
        console.error('Debug: Still no user after fallback.')
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized: User ID missing (Session Invalid)'
        })
    }

    // Use requesterUser.id instead of user.id below
    const targetId = requesterUser.id


    const { email, password, fullName, phone, role } = body

    if (!email || !password || !fullName || !role) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required fields'
        })
    }

    // 1. Verify requester permissions
    const { data: requesterProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('role, business_id')
        .eq('id', targetId) // Use targetId resolved from fallback
        .single()

    if (profileError || !requesterProfile) {
        // Expose debug info to client (temporary for debugging)
        const debugMsg = `Debug: UserID ${targetId} - Error: ${profileError?.message || 'No Profile'}`
        console.error(debugMsg)

        throw createError({
            statusCode: 403,
            statusMessage: debugMsg
        })
    }

    const isOwner = requesterProfile.role === 'owner'
    const isManager = requesterProfile.role === 'manager'

    if (!isOwner && !isManager) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Insufficient permissions'
        })
    }

    // 2. Validate role assignment
    // Managers can only create cashiers or staff
    if (isManager && (role === 'owner' || role === 'manager')) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Managers can only create staff or cashiers'
        })
    }

    // 3. Create User in Supabase Auth
    // We strictly inject the requester's business_id into the new user's metadata
    // This allows the trigger handle_new_user to pick it up reliably
    const { data: newUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto-confirm since admin created it
        user_metadata: {
            full_name: fullName,
            phone: phone || null,
            role: role,
            business_id: requesterProfile.business_id // FORCE SAME BUSINESS
        }
    })

    if (createAuthError) {
        console.error('Error creating user:', createAuthError)
        throw createError({
            statusCode: 400,
            statusMessage: createAuthError.message
        })
    }

    return {
        success: true,
        user: {
            id: newUser.user.id,
            email: newUser.user.email
        }
    }
})
