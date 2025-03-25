import { AllowedUploads } from '@ui/types'

export const isFileAllowedForUpload = (file: File, constraints: AllowedUploads, fullFileUpload: boolean): boolean => {
    let acceptFile = false
    if (constraints.isImageUploadAllowed) {
        const fileType = file.type
        const sizeInMB = file.size / 1024 / 1024
        constraints.imgUploadSizeAndTypes.map((allowed) => {
            if (allowed.fileTypes.includes(fileType) && sizeInMB <= allowed.maxUploadSize) {
                acceptFile = true
            }
        })
    }

    if (fullFileUpload) {
        return true
    } else if (constraints.isRAGFileUploadAllowed) {
        const fileExt = file.name.split('.').pop()
        if (fileExt) {
            constraints.fileUploadSizeAndTypes.map((allowed) => {
                if (allowed.fileTypes.length === 1 && allowed.fileTypes[0] === '*') {
                    acceptFile = true
                } else if (allowed.fileTypes.includes(`.${fileExt}`)) {
                    acceptFile = true
                }
            })
        }
    }
    if (!acceptFile) {
        alert(`Cannot upload file. Kindly check the allowed file types and maximum allowed size.`)
    }
    return acceptFile
}
