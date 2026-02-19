'use client'

import React from 'react'
import { useUser } from '@utils/auth/aaiAuth0Client'
import { createPermissionManager, PermissionManager } from 'utils/src/auth/permissions'
import { User } from 'types'

type PermissionContextValue = PermissionManager & {
    user?: Partial<User>
}

const PermissionContext = React.createContext<PermissionContextValue | undefined>(undefined)

const mergeUsers = (initialUser?: Partial<User>, runtimeUser?: Partial<User> | null): Partial<User> => {
    const merged: Record<string, unknown> = {}
    if (initialUser) {
        Object.entries(initialUser).forEach(([key, value]) => {
            if (value !== undefined) merged[key] = value
        })
    }
    if (runtimeUser) {
        Object.entries(runtimeUser).forEach(([key, value]) => {
            if (value === undefined) return
            if (key === 'roles' && Array.isArray(merged[key]) && Array.isArray(value)) {
                merged[key] = Array.from(new Set([...(merged[key] as unknown[]), ...value]))
                return
            }
            merged[key] = value
        })
    }
    return merged as Partial<User>
}

export const PermissionProvider = ({ initialUser, children }: { initialUser?: Partial<User>; children: React.ReactNode }) => {
    const { user: runtimeUser } = useUser()
    const mergedUser = React.useMemo(() => mergeUsers(initialUser, runtimeUser as Partial<User>), [initialUser, runtimeUser])
    const manager = React.useMemo(() => createPermissionManager(mergedUser ?? {}), [mergedUser])

    const value = React.useMemo<PermissionContextValue>(
        () => ({
            ...manager,
            user: mergedUser
        }),
        [manager, mergedUser]
    )

    return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

export const usePermissions = () => {
    const context = React.useContext(PermissionContext)
    if (!context) {
        throw new Error('usePermissions must be used within a PermissionProvider')
    }
    return context
}
