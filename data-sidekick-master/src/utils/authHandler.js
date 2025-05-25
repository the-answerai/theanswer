import { supabase } from '../config/db.js'

/**
 * Handles user management after successful Auth0 authentication
 * @param {Object} user - The user object from Auth0
 * @returns {Object} The user record from Supabase
 */
export const handleUserAuth = async (user) => {
    console.log('\n=== Auth Handler triggered ===')
    console.log('Auth0 user:', user)

    if (!user || !user.sub) {
        console.log('No valid user provided')
        return null
    }

    try {
        // Check if user exists
        console.log('Checking if user exists in Supabase...')
        const { data: existingUser, error: fetchError } = await supabase.from('users').select().eq('auth0_id', user.sub).single()

        console.log('Fetch result:', {
            existingUser,
            fetchError: fetchError
                ? {
                      message: fetchError.message,
                      code: fetchError.code,
                      details: fetchError.details
                  }
                : null
        })

        if (!existingUser) {
            console.log('Creating new user in Supabase...')
            const newUser = {
                auth0_id: user.sub,
                email: user.email,
                name: user.name,
                picture: user.picture,
                last_login: new Date().toISOString()
            }
            console.log('New user data:', newUser)

            const { data: createdUser, error: createError } = await supabase.from('users').insert([newUser]).select().single()

            if (createError) {
                console.error('Error creating user:', {
                    message: createError.message,
                    code: createError.code,
                    details: createError.details
                })
                return null
            }

            console.log('Successfully created new user in Supabase:', createdUser)
            return createdUser
        }

        // Update existing user
        console.log('Updating existing user...')
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('auth0_id', user.sub)
            .select()
            .single()

        if (updateError) {
            console.error('Error updating user:', {
                message: updateError.message,
                code: updateError.code,
                details: updateError.details
            })
            return existingUser // Return existing user even if update fails
        }

        console.log('Successfully updated user in Supabase:', updatedUser)
        return updatedUser
    } catch (error) {
        console.error('Error in auth handler:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        })
        return null
    }
}
