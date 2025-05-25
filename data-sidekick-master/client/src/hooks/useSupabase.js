import { createClient } from '@supabase/supabase-js'
import { useMemo } from 'react'

export function useSupabase() {
    return useMemo(() => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('Missing Supabase environment variables:', {
                hasUrl: !!supabaseUrl,
                hasKey: !!supabaseAnonKey,
                env: import.meta.env.MODE
            })
            return null
        }

        try {
            const client = createClient(supabaseUrl, supabaseAnonKey)
            console.log('Supabase client initialized successfully')
            return client
        } catch (error) {
            console.error('Error initializing Supabase client:', error)
            return null
        }
    }, [])
}
