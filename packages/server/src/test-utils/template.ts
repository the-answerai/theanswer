// Ensures the baseline chatflow template exists with predictable data/visibility before seeding.
// Handles both src/dist layouts so tests work in dev and built environments.
import fs from 'fs'
import path from 'path'
import { ChatFlow, ChatflowVisibility } from '../database/entities/ChatFlow'
import { SupportedDataSource } from './types'

export const ensureTemplateChatflow = async (ds: SupportedDataSource, templateId: string): Promise<void> => {
    const chatflowRepo = ds.getRepository(ChatFlow)
    const existingTemplate = await chatflowRepo.findOne({ where: { id: templateId } })

    if (existingTemplate && !existingTemplate.userId && !existingTemplate.organizationId) {
        return
    }

    if (existingTemplate) {
        await chatflowRepo.delete({ id: templateId })
    }

    let templatePath = path.join(__dirname, '..', 'fixtures', 'default-sidekick.json')
    if (!fs.existsSync(templatePath)) {
        templatePath = path.join(__dirname, '..', '..', 'src', 'fixtures', 'default-sidekick.json')
    }
    const templateContent = fs.readFileSync(templatePath, 'utf8')
    const template = JSON.parse(templateContent)

    const visibility = [ChatflowVisibility.PRIVATE, ChatflowVisibility.ANSWERAI]

    const templateEntity = chatflowRepo.create()
    templateEntity.id = templateId
    templateEntity.name = template.name
    templateEntity.description = template.description ?? ''
    templateEntity.flowData = template.flowData
    templateEntity.deployed = false
    templateEntity.isPublic = false
    templateEntity.visibility = visibility
    templateEntity.currentVersion = template.currentVersion ?? 1
    templateEntity.category = template.category ?? ''
    templateEntity.type = template.type ?? 'CHATFLOW'
    templateEntity.userId = null as any
    templateEntity.organizationId = null as any

    if (typeof template.chatbotConfig === 'string') {
        templateEntity.chatbotConfig = template.chatbotConfig
    }

    if (typeof template.answersConfig === 'string') {
        templateEntity.answersConfig = template.answersConfig
    }

    if (typeof template.apiConfig === 'string') {
        templateEntity.apiConfig = template.apiConfig
    }

    if (typeof template.analytic === 'string') {
        templateEntity.analytic = template.analytic
    }

    if (typeof template.speechToText === 'string') {
        templateEntity.speechToText = template.speechToText
    }

    if (typeof template.followUpPrompts === 'string') {
        templateEntity.followUpPrompts = template.followUpPrompts
    }

    if (typeof template.browserExtConfig === 'string') {
        templateEntity.browserExtConfig = template.browserExtConfig
    }

    await chatflowRepo.save(templateEntity)
}
