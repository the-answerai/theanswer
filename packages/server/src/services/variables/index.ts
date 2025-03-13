import { StatusCodes } from 'http-status-codes'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { Variable, VariableVisibility } from '../../database/entities/Variable'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { IUser } from '../../Interface'
import { QueryRunner, FindOptionsWhere, IsNull, Like } from 'typeorm'

const createVariable = async (newVariable: Variable, user: IUser) => {
    try {
        const appServer = getRunningExpressApp()
        newVariable.userId = user.id
        newVariable.organizationId = user.organizationId
        const variable = await appServer.AppDataSource.getRepository(Variable).create(newVariable)
        const dbResponse = await appServer.AppDataSource.getRepository(Variable).save(variable)
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: variablesServices.createVariable - ${getErrorMessage(error)}`
        )
    }
}

const deleteVariable = async (variableId: string): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        const dbResponse = await appServer.AppDataSource.getRepository(Variable).delete({ id: variableId })
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: variablesServices.deleteVariable - ${getErrorMessage(error)}`
        )
    }
}

const getAllVariables = async (user: IUser) => {
    try {
        const appServer = getRunningExpressApp()
        const variableRepo = appServer.AppDataSource.getRepository(Variable)

        const isAdmin = user?.roles?.includes('Admin')

        let conditions: FindOptionsWhere<Variable> | FindOptionsWhere<Variable>[]

        if (isAdmin) {
            conditions = [{ organizationId: user.organizationId }, { userId: IsNull() }]
        } else {
            conditions = [
                { userId: user.id },
                { userId: IsNull() },
                {
                    organizationId: user.organizationId,
                    // @ts-ignore
                    visibility: Like(`%${VariableVisibility.ORGANIZATION}%`)
                }
            ]
        }

        const variables = await variableRepo.find({ where: conditions })

        // Deduplicate variables based on id
        const uniqueVariables = Array.from(new Map(variables.map((item) => [item.id, item])).values())

        // Add isOwner property
        return uniqueVariables.map((variable) => ({
            ...variable,
            isOwner: variable.userId === user.id
        }))
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: variablesServices.getAllVariables - ${getErrorMessage(error)}`
        )
    }
}

const getVariableById = async (variableId: string) => {
    try {
        const appServer = getRunningExpressApp()
        const dbResponse = await appServer.AppDataSource.getRepository(Variable).findOneBy({
            id: variableId
        })
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: variablesServices.getVariableById - ${getErrorMessage(error)}`
        )
    }
}

const updateVariable = async (variable: Variable, updatedVariable: Variable) => {
    try {
        const appServer = getRunningExpressApp()
        const tmpUpdatedVariable = await appServer.AppDataSource.getRepository(Variable).merge(variable, updatedVariable)
        const dbResponse = await appServer.AppDataSource.getRepository(Variable).save(tmpUpdatedVariable)
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: variablesServices.updateVariable - ${getErrorMessage(error)}`
        )
    }
}

const importVariables = async (newVariables: Partial<Variable>[], queryRunner?: QueryRunner): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        const repository = queryRunner ? queryRunner.manager.getRepository(Variable) : appServer.AppDataSource.getRepository(Variable)

        // step 1 - check whether array is zero
        if (newVariables.length == 0) return

        // step 2 - check whether ids are duplicate in database
        let ids = '('
        let count: number = 0
        const lastCount = newVariables.length - 1
        newVariables.forEach((newVariable) => {
            ids += `'${newVariable.id}'`
            if (lastCount != count) ids += ','
            if (lastCount == count) ids += ')'
            count += 1
        })

        const selectResponse = await repository.createQueryBuilder('v').select('v.id').where(`v.id IN ${ids}`).getMany()
        const foundIds = selectResponse.map((response) => {
            return response.id
        })

        // step 3 - remove ids that are only duplicate
        const prepVariables: Partial<Variable>[] = newVariables.map((newVariable) => {
            let id: string = ''
            if (newVariable.id) id = newVariable.id
            if (foundIds.includes(id)) {
                newVariable.id = undefined
                newVariable.name += ' (1)'
            }
            return newVariable
        })

        // step 4 - transactional insert array of entities
        const insertResponse = await repository.insert(prepVariables)

        return insertResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: variableService.importVariables - ${getErrorMessage(error)}`
        )
    }
}

export default {
    createVariable,
    deleteVariable,
    getAllVariables,
    getVariableById,
    updateVariable,
    importVariables
}
