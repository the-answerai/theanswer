import { useSelector } from 'react-redux'
import { useMemo } from 'react'
import { createPermissionManager } from 'utils/src/auth/permissions'

export const usePermissions = () => {
    const user = useSelector((state) => state.auth.user)
    return useMemo(() => createPermissionManager(user ?? {}), [user])
}

export default usePermissions
