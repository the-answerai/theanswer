// Re-export enterprise User entity with AAI fields
// This ensures all imports use the same User class registered with TypeORM
export { User, UserStatus } from '../../enterprise/database/entities/user.entity'
