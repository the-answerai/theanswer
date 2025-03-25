import { UploadTypesAndSize } from '@ui/types'

export const getAllowedUploadTypes = (fileSizeAndTypes: UploadTypesAndSize[]): string => {
    if (fileSizeAndTypes.length > 0) {
        return fileSizeAndTypes.map((allowed) => allowed.fileTypes).join(',')
    }
    return '*'
}
