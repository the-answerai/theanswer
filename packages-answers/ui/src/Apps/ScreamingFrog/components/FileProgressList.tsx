import React from 'react'
import ItemProgressList, { ItemProgress } from '../../components/ItemProgressList'

export interface FileProgress extends ItemProgress {
    // Optionally extend for file-specific fields
}

export interface FileProgressListProps {
    progress: FileProgress[]
    title?: string
}

const getFileProgress = (step: number) => {
    switch (step) {
        case -1:
            return { value: 0, label: 'Waiting' }
        case 0:
            return { value: 16, label: 'Uploading' }
        case 1:
            return { value: 32, label: 'Generating Prompt' }
        case 2:
            return { value: 48, label: 'Saving Prompt' }
        case 3:
            return { value: 64, label: 'Generating Report' }
        case 4:
            return { value: 80, label: 'Saving Report' }
        case 5:
            return { value: 100, label: 'Report Saved' }
        case 6:
            return { value: 100, label: 'Error' }
        default:
            return { value: 0, label: '' }
    }
}

const getFileColor = (step: number) => {
    if (step === 6) return 'error'
    if (step === 5) return 'success'
    return 'primary'
}

const FileProgressList: React.FC<FileProgressListProps> = ({ progress, title }) => (
    <ItemProgressList progress={progress} title={title} getProgress={getFileProgress} getColor={getFileColor} />
)

export default FileProgressList
