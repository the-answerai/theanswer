/**
 * AAI Repository - Workspace-aware repository decorator that upgrades single-workspace filters to multi-workspace.
 */
import { DataSource, Repository, SelectQueryBuilder, ObjectLiteral, FindManyOptions, FindOptionsWhere, In } from 'typeorm'
import { getWorkspaceIdsFromContext, isMultiWorkspaceSharingEnabled, debugLog } from './context'

// Entities with workspaceId field - add new workspace-scoped entities here
const WORKSPACE_ENTITIES = new Set([
    'ChatFlow',
    'Tool',
    'Variable',
    'DocumentStore',
    'Credential',
    'Assistant',
    'Apikey',
    'Dataset',
    'Evaluation',
    'Evaluator',
    'Execution'
])

export function initAAI(dataSource: DataSource) {
    const originalGetRepository = dataSource.getRepository.bind(dataSource)
    dataSource.getRepository = function <T extends ObjectLiteral>(target: any): any {
        const repo = originalGetRepository(target)
        const entityName = typeof target === 'function' ? target.name : String(target)
        return createWorkspaceAwareRepository(repo, entityName)
    }
}

function createWorkspaceAwareRepository<T extends ObjectLiteral>(repository: Repository<T>, entityName: string): Repository<T> {
    if (!WORKSPACE_ENTITIES.has(entityName)) return repository

    return new Proxy(repository, {
        get(target, prop: string | symbol) {
            const original = target[prop as keyof Repository<T>]
            if (typeof original !== 'function') return original
            const propName = String(prop)

            if (['find', 'findBy', 'findOne', 'findOneBy', 'findAndCount', 'findAndCountBy', 'count'].includes(propName)) {
                return async (...args: any[]) => {
                    if (!isMultiWorkspaceSharingEnabled()) return (original as Function).apply(target, args)
                    return (original as Function).call(target, enhanceFindOptions(args[0], entityName))
                }
            }

            if (propName === 'createQueryBuilder') {
                return (alias?: string) => {
                    const qb = (original as Function).call(target, alias)
                    if (!isMultiWorkspaceSharingEnabled()) return qb
                    return wrapQueryBuilder(qb, alias || entityName.toLowerCase())
                }
            }

            return typeof original === 'function' ? (original as Function).bind(target) : original
        }
    })
}

function enhanceFindOptions<T>(options: FindManyOptions<T> | FindOptionsWhere<T> | undefined, entityName: string): any {
    const wsIds = getWorkspaceIdsFromContext()
    if (!wsIds || wsIds.length <= 1) return options || {}
    if (!options) {
        debugLog(`${entityName}.find - adding multi-workspace filter`, { wsIds })
        return { workspaceId: In(wsIds) }
    }

    const where = 'where' in options ? options.where : options
    if (where && typeof where === 'object' && 'workspaceId' in where) {
        const { workspaceId: _, ...rest } = where as any
        debugLog(`${entityName}.find - upgraded workspaceId filter`, { wsIds })
        const upgraded = { ...rest, workspaceId: In(wsIds) }
        return 'where' in options ? { ...options, where: upgraded } : upgraded
    }

    debugLog(`${entityName}.find - adding multi-workspace filter`, { wsIds })
    const filter = { workspaceId: In(wsIds) }
    return 'where' in options && options.where ? { ...options, where: { ...options.where, ...filter } } : { ...options, ...filter }
}

function wrapQueryBuilder<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, alias: string): SelectQueryBuilder<T> {
    const wsIds = getWorkspaceIdsFromContext()
    if (!wsIds || wsIds.length <= 1) return qb

    const origAnd = qb.andWhere.bind(qb),
        origWhere = qb.where.bind(qb)

    const upgrade =
        (orig: Function, method: string) =>
        (cond: any, params?: any): SelectQueryBuilder<T> => {
            if (typeof cond === 'string' && cond.includes('.workspaceId')) {
                if (cond.includes('= :workspaceId') && params?.workspaceId) {
                    const newCond = cond.replace(/(\w+)\.workspaceId\s*=\s*:workspaceId/, '$1.workspaceId IN (:...aaiWsIds)')
                    const newParams = { ...params, aaiWsIds: wsIds }
                    delete newParams.workspaceId
                    debugLog(`QB.${method} - upgraded`, { original: cond, wsIds })
                    return orig(newCond, newParams)
                }
                debugLog(`QB.${method} - workspace filter not upgraded (unexpected format)`, { cond })
            }
            return orig(cond, params)
        }

    qb.andWhere = upgrade(origAnd, 'andWhere') as typeof qb.andWhere
    qb.where = upgrade(origWhere, 'where') as typeof qb.where
    return qb
}
