import { useAuth0 } from '@auth0/auth0-react'
import { useMemo } from 'react'
import { createPermissionManager } from 'utils/src/auth/permissions'

export const usePermissions = () => {
    const { user } = useAuth0()
    return useMemo(() => createPermissionManager(user ?? {}), [user])
}

export default usePermissions
