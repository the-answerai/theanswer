import React from 'react'
import ItemProgressList, { ItemProgress } from '../../components/ItemProgressList'

export interface DeleteFileProgress extends ItemProgress {}

export interface DeleteFileProgressListProps {
    progress: DeleteFileProgress[]
    title?: string
}

const getDeleteProgress = (step: number) => {
    switch (step) {
        case -1:
            return { value: 0, label: 'Waiting' }
        case 0:
            return { value: 50, label: 'Removing from storage' }
        case 1:
            return { value: 100, label: 'Removing from database' }
        case 2:
            return { value: 100, label: 'Deleted' }
        case 3:
            return { value: 100, label: 'Error' }
        default:
            return { value: 0, label: '' }
    }
}

const getDeleteColor = (step: number) => {
    if (step === 3) return 'error'
    if (step === 2) return 'success'
    return 'primary'
}

const DeleteFileProgressList: React.FC<DeleteFileProgressListProps> = ({ progress, title }) => (
    <ItemProgressList progress={progress} title={title} getProgress={getDeleteProgress} getColor={getDeleteColor} />
)

export default DeleteFileProgressList
