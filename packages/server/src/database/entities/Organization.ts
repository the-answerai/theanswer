// Re-export enterprise Organization entity with AAI fields
// This ensures all imports use the same Organization class registered with TypeORM
export { Organization, OrganizationName } from '../../enterprise/database/entities/organization.entity'
