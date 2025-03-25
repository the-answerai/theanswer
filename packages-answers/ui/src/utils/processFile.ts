import { FileUpload } from 'types'

export const prepareFilesForAPI = (files: FileUpload[]): string[] => {
    return files.map((file) => file.data)
}
