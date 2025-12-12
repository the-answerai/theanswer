import { Init1693891895163 } from './1693891895163-Init'
import { ModifyChatFlow1693995626941 } from './1693995626941-ModifyChatFlow'
import { ModifyChatMessage1693996694528 } from './1693996694528-ModifyChatMessage'
import { ModifyCredential1693997070000 } from './1693997070000-ModifyCredential'
import { ModifyTool1693997339912 } from './1693997339912-ModifyTool'
import { AddApiConfig1694099183389 } from './1694099183389-AddApiConfig'
import { AddAnalytic1694432361423 } from './1694432361423-AddAnalytic'
import { AddChatHistory1694658756136 } from './1694658756136-AddChatHistory'
import { AddAssistantEntity1699325775451 } from './1699325775451-AddAssistantEntity'
import { AddUsedToolsToChatMessage1699481607341 } from './1699481607341-AddUsedToolsToChatMessage'
import { AddCategoryToChatFlow1699900910291 } from './1699900910291-AddCategoryToChatFlow'
import { AddFileAnnotationsToChatMessage1700271021237 } from './1700271021237-AddFileAnnotationsToChatMessage'
import { AddFileUploadsToChatMessage1701788586491 } from './1701788586491-AddFileUploadsToChatMessage'
import { AddVariableEntity1699325775451 } from './1702200925471-AddVariableEntity'
import { AddSpeechToText1706364937060 } from './1706364937060-AddSpeechToText'
import { AddFeedback1707213601923 } from './1707213601923-AddFeedback'
import { AddUpsertHistoryEntity1709814301358 } from './1709814301358-AddUpsertHistoryEntity'
import { FieldTypes1710497452584 } from './1710497452584-FieldTypes'
import { AddLead1710832137905 } from './1710832137905-AddLead'
import { AddLeadToChatMessage1711538016098 } from './1711538016098-AddLeadToChatMessage'
import { AddDocumentStore1711637331047 } from './1711637331047-AddDocumentStore'
import { AddEvaluation1714548873039 } from './1714548873039-AddEvaluation'
import { AddDatasets1714548903384 } from './1714548903384-AddDataset'
import { AddAgentReasoningToChatMessage1714679514451 } from './1714679514451-AddAgentReasoningToChatMessage'
import { AddEvaluator1714808591644 } from './1714808591644-AddEvaluator'
import { AddVectorStoreConfigToDocStore1715861032479 } from './1715861032479-AddVectorStoreConfigToDocStore'
import { AddTypeToChatFlow1716300000000 } from './1716300000000-AddTypeToChatFlow'
import { AddApiKey1720230151480 } from './1720230151480-AddApiKey'
import { AddActionToChatMessage1721078251523 } from './1721078251523-AddActionToChatMessage'
import { AddCustomTemplate1725629836652 } from './1725629836652-AddCustomTemplate'
import { AddArtifactsToChatMessage1726156258465 } from './1726156258465-AddArtifactsToChatMessage'
import { AddFollowUpPrompts1726666309552 } from './1726666309552-AddFollowUpPrompts'
import { AddTypeToAssistant1733011290987 } from './1733011290987-AddTypeToAssistant'
import { AddSeqNoToDatasetRow1733752119696 } from './1733752119696-AddSeqNoToDatasetRow'
import { AddExecutionEntity1738090872625 } from './1738090872625-AddExecutionEntity'
import { FixOpenSourceAssistantTable1743758056188 } from './1743758056188-FixOpenSourceAssistantTable'
import { AddErrorToEvaluationRun1744964560174 } from './1744964560174-AddErrorToEvaluationRun'
import { ModifyExecutionSessionIdFieldType1748450230238 } from './1748450230238-ModifyExecutionSessionIdFieldType'
import { AddTextToSpeechToChatFlow1754986480347 } from './1754986480347-AddTextToSpeechToChatFlow'
import { ModifyChatflowType1755066758601 } from './1755066758601-ModifyChatflowType'
import { AddTextToSpeechToChatFlow1759419194331 } from './1759419194331-AddTextToSpeechToChatFlow'
import { AddChatFlowNameIndex1759424903973 } from './1759424903973-AddChatFlowNameIndex'
import { AddAuthTables1720230151482 } from '../../../enterprise/database/migrations/postgres/1720230151482-AddAuthTables'
import { AddWorkspace1720230151484 } from '../../../enterprise/database/migrations/postgres/1720230151484-AddWorkspace'
import { AddWorkspaceShared1726654922034 } from '../../../enterprise/database/migrations/postgres/1726654922034-AddWorkspaceShared'
import { AddWorkspaceIdToCustomTemplate1726655750383 } from '../../../enterprise/database/migrations/postgres/1726655750383-AddWorkspaceIdToCustomTemplate'
import { AddOrganization1727798417345 } from '../../../enterprise/database/migrations/postgres/1727798417345-AddOrganization'
import { LinkWorkspaceId1729130948686 } from '../../../enterprise/database/migrations/postgres/1729130948686-LinkWorkspaceId'
import { LinkOrganizationId1729133111652 } from '../../../enterprise/database/migrations/postgres/1729133111652-LinkOrganizationId'
import { AddSSOColumns1730519457880 } from '../../../enterprise/database/migrations/postgres/1730519457880-AddSSOColumns'
import { AddPersonalWorkspace1734074497540 } from '../../../enterprise/database/migrations/postgres/1734074497540-AddPersonalWorkspace'
import { RefactorEnterpriseDatabase1737076223692 } from '../../../enterprise/database/migrations/postgres/1737076223692-RefactorEnterpriseDatabase'
import { ExecutionLinkWorkspaceId1746862866554 } from '../../../enterprise/database/migrations/postgres/1746862866554-ExecutionLinkWorkspaceId'

// AAI - TheAnswer custom migrations
import { AddAnswersConfig1714692854264 } from './aai/1714692854264-AddAnswersConfig'
import { AddUser1716422641414 } from './aai/1716422641414-AddUser'
import { AddOrganizationId1717629010538 } from './aai/1717629010538-AddOrganizationId'
import { AddOrganization1717632419096 } from './aai/1717632419096-AddOrganization'
import { UpdateDefaultVisibility1717684633931 } from './aai/1717684633931-UpdateDefaultVisibility'
import { AddUserId1717773329048 } from './aai/1717773329048-AddUserId'
import { UpdateChatflowToHaveParentId1717796909629 } from './aai/1717796909629-UpdateChatflowToHaveParentId'
import { UpdateVisibilityType1719248473069 } from './aai/1719248473069-UpdateVisibilityType'
import { CredentialsVisibility1721247848452 } from './aai/1721247848452-CredentialsVisibility'
import { AddDescriptionToChatFlow1722099922876 } from './aai/1722101786123-AddDescriptionToChatflow'
import { AddSoftDeleteChatflows1724275570313 } from './aai/1724275570313-AddSoftDeleteChatflows'
import { VariablesVisibility1725494523908 } from './aai/1725494523908-VariablesVisibility'
import { AddPlans1722954481004 } from './aai/1722954481003-AddPlans'
import { ApiKeysUserAndOrg1727817692110 } from './aai/1727817692110-ApiKeysUserAndOrg'
import { ToolVisibility1730491825527 } from './aai/1730491825527-ToolVisibility'
import { AddChat1732145631409 } from './aai/1732145631409-AddChat'
import { ApiKeyEnhancement1720230151481 } from './aai/1720230151481-ApiKeyEnhancement'
import { AddStripeCustomerId1734126321905 } from './aai/1734126321905-AddStripeCustomerId'
import { BillingSchemaEnhancement1740447708857 } from './aai/1740447708857-BillingSchemaEnhancement'
import { BilingOrganization1740859194641 } from './aai/1740859194641-BilingOrganization'
import { UpdateUserUniqueAuth0Id1741898609435 } from './aai/1741898609435-UpdateUserUniqueAuth0Id'
import { AppCsvRuns1744553414309 } from './aai/1744553414309-AddAppCsvRuns'
import { AddBrowserExtConfig1746508019300 } from './aai/1746508019300-AddBrowserExtConfig'
import { AddDefaultChatflowIdToUser1746508019301 } from './aai/1746508019301-AddDefaultChatflowIdToUser'
import { AddUserScopingToExecution1738091000000 } from './aai/1738091000000-AddUserScopingToExecution'
import { AddOrganizationToCustomTemplate1752612517000 } from './aai/1752612517000-AddOrganizationToCustomTemplate'
import { AddParentIdToCustomTemplate1752780174000 } from './aai/1752780174000-AddParentIdToCustomTemplate'
import { AddTemplateIdToChatFlow1752780175000 } from './aai/1752780175000-AddTemplateIdToChatFlow'
import { AddSettingsToCustomTemplate1752780175001 } from './aai/1752780175001-AddSettingsToCustomTemplate'
import { AddPgvectorExtension1752614575000 } from './aai/1752614575000-AddPgvectorExtension'
import { AddEnabledIntegrationsToOrganization1752614576000 } from './aai/1752614576000-AddEnabledIntegrationsToOrganization'
import { AddVersioningToChatFlow1753000000000 } from './aai/1753000000000-AddVersioningToChatFlow'
import { AddUniqueConstraintDefaultChatflows1753000000001 } from './aai/1753000000001-AddUniqueConstraintDefaultChatflows'
import { AddTrackingMetadataToChatMessage1753200000000 } from './aai/1753200000000-AddTrackingMetadataToChatMessage'
import { BackfillDocumentStoreFileChunkUserScoping1731429600000 } from './aai/1731429600000-BackfillDocumentStoreFileChunkUserScoping'

// AAI Migration Sandwich - preserves AAI data through enterprise migrations
import { BackupAAIData1737076223690 } from './aai/1737076223690-BackupAAIData'
import { AAIRestoreDataAndCreateWorkspaces1737076223693 } from './aai/1737076223693-AAIRestoreDataAndCreateWorkspaces'
import { AAIBackfillWorkspaceId1760000000002 } from './aai/1760000000002-AAIBackfillWorkspaceId'

export const postgresMigrations = [
    Init1693891895163,
    ModifyChatFlow1693995626941,
    ModifyChatMessage1693996694528,
    ModifyCredential1693997070000,
    ModifyTool1693997339912,
    AddApiConfig1694099183389,
    AddAnalytic1694432361423,
    AddChatHistory1694658756136,
    AddAssistantEntity1699325775451,
    AddUsedToolsToChatMessage1699481607341,
    AddCategoryToChatFlow1699900910291,
    AddFileAnnotationsToChatMessage1700271021237,
    AddVariableEntity1699325775451,
    AddFileUploadsToChatMessage1701788586491,
    AddSpeechToText1706364937060,
    AddUpsertHistoryEntity1709814301358,
    AddFeedback1707213601923,
    FieldTypes1710497452584,
    AddAnswersConfig1714692854264,
    AddUser1716422641414,
    AddEvaluation1714548873039,
    AddDatasets1714548903384,
    AddEvaluator1714808591644,
    AddDocumentStore1711637331047,
    AddLead1710832137905,
    AddLeadToChatMessage1711538016098,
    AddAgentReasoningToChatMessage1714679514451,
    AddVectorStoreConfigToDocStore1715861032479,
    AddTypeToChatFlow1716300000000,
    AddApiKey1720230151480,
    ApiKeyEnhancement1720230151481,
    AddActionToChatMessage1721078251523,
    AddOrganizationId1717629010538,
    AddOrganization1717632419096,
    UpdateDefaultVisibility1717684633931,
    AddUserId1717773329048,
    UpdateChatflowToHaveParentId1717796909629,
    UpdateVisibilityType1719248473069,
    CredentialsVisibility1721247848452,
    AddDescriptionToChatFlow1722099922876,
    AddSoftDeleteChatflows1724275570313,
    VariablesVisibility1725494523908,
    AddPlans1722954481004,
    ApiKeysUserAndOrg1727817692110,
    ToolVisibility1730491825527,
    AddChat1732145631409,
    AddStripeCustomerId1734126321905,
    BillingSchemaEnhancement1740447708857,
    BilingOrganization1740859194641,
    AddCustomTemplate1725629836652,
    AddArtifactsToChatMessage1726156258465,
    AddFollowUpPrompts1726666309552,
    AddTypeToAssistant1733011290987,
    UpdateUserUniqueAuth0Id1741898609435,
    AppCsvRuns1744553414309,
    AddBrowserExtConfig1746508019300,
    AddUserScopingToExecution1738091000000,
    AddDefaultChatflowIdToUser1746508019301,
    AddOrganizationToCustomTemplate1752612517000,
    AddParentIdToCustomTemplate1752780174000,
    AddTemplateIdToChatFlow1752780175000,
    AddSettingsToCustomTemplate1752780175001,
    AddPgvectorExtension1752614575000,
    AddEnabledIntegrationsToOrganization1752614576000,
    AddVersioningToChatFlow1753000000000,
    AddUniqueConstraintDefaultChatflows1753000000001,
    AddTrackingMetadataToChatMessage1753200000000,
    BackfillDocumentStoreFileChunkUserScoping1731429600000,
    AddAuthTables1720230151482,
    AddWorkspace1720230151484,
    AddWorkspaceShared1726654922034,
    AddWorkspaceIdToCustomTemplate1726655750383,
    AddOrganization1727798417345,
    LinkWorkspaceId1729130948686,
    LinkOrganizationId1729133111652,
    AddSSOColumns1730519457880,
    AddSeqNoToDatasetRow1733752119696,
    AddPersonalWorkspace1734074497540,
    BackupAAIData1737076223690, // AAI: Backup BEFORE enterprise migration
    RefactorEnterpriseDatabase1737076223692,
    AAIRestoreDataAndCreateWorkspaces1737076223693, // AAI: Restore data + create workspaces
    AddExecutionEntity1738090872625,
    FixOpenSourceAssistantTable1743758056188,
    AddErrorToEvaluationRun1744964560174,
    ExecutionLinkWorkspaceId1746862866554,
    ModifyExecutionSessionIdFieldType1748450230238,
    AddTextToSpeechToChatFlow1754986480347,
    ModifyChatflowType1755066758601,
    AddTextToSpeechToChatFlow1759419194331,
    AddChatFlowNameIndex1759424903973,
    // AAI: Backfill workspaceId - runs LAST after all feature migrations
    AAIBackfillWorkspaceId1760000000002
]
