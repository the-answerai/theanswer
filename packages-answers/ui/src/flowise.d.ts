declare module '@/utils/exportImport' {
    export function stringify(object: any): string
    export function exportData(data: any): any
}

declare module '@/api/exportimport' {
    const exportImportApi: {
        exportData: (body: Record<string, boolean>) => Promise<any>
        importData: (body: any) => Promise<any>
    }
    export default exportImportApi
}

declare module '@/hooks/useApi' {
    interface ApiState<TData = any, TError = any> {
        data?: TData
        error?: TError
        loading: boolean
        request: (body?: any) => Promise<void>
    }
    export default function useApi<TData = any>(fn: (...args: any[]) => Promise<TData>): ApiState<TData>
}

declare module '@/utils/errorHandler' {
    export function getErrorMessage(error: unknown): string
}
