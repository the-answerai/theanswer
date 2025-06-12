import client from '../client'

// Usage related endpoints
const getProject = (projectId) => client.get(`/screaming-frog-analysis/projects/${projectId}`)
const getProjectFiles = (projectId) => client.get(`/screaming-frog-analysis/projects/${projectId}/files`)
const getFileCsv = (fileId) => client.get(`/screaming-frog-analysis/files/${fileId}/csv`)
const getFileReport = (fileId) => client.get(`/screaming-frog-analysis/files/${fileId}/report`)
const generateFilePrompt = (fileId) => client.post(`/screaming-frog-analysis/files/${fileId}/generate-prompt`)
const saveFilePrompt = (fileId, prompt) => client.post(`/screaming-frog-analysis/files/${fileId}/prompt`, { prompt })
const generateFileReport = (fileId, prompt) => client.post(`/screaming-frog-analysis/files/${fileId}/generate-report`, { prompt })
const saveFileReport = (fileId, reportSection) => client.post(`/screaming-frog-analysis/files/${fileId}/report`, { reportSection })
const getProjects = () => client.get('/screaming-frog-analysis/projects')
const createProject = (name, description) => client.post('/screaming-frog-analysis/projects', { name, description })
const updateProject = (projectId, name, description) => client.put(`/screaming-frog-analysis/projects/${projectId}`, { name, description })
const uploadProjectFile = (projectId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return client.post(`/screaming-frog-analysis/projects/${projectId}/files`, formData, {
        headers: {
            'Content-Type': undefined
        }
    })
}
const deleteProject = (projectId) => client.delete(`/screaming-frog-analysis/projects/${projectId}`)
const deleteFile = (fileId) => client.delete(`/screaming-frog-analysis/files/${fileId}`)

export default {
    getProject,
    getProjectFiles,
    getFileCsv,
    getFileReport,
    generateFilePrompt,
    saveFilePrompt,
    generateFileReport,
    saveFileReport,
    getProjects,
    createProject,
    updateProject,
    uploadProjectFile,
    deleteProject,
    deleteFile
}
