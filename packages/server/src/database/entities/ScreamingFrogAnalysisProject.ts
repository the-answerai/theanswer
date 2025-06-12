import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

@Entity()
export class ScreamingFrogAnalysisProject {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    name: string

    @Index()
    @Column({ type: 'uuid' })
    userId: string

    @Index()
    @Column({ type: 'uuid' })
    organizationId: string

    @Column({ default: false })
    isSharedWithOrg: boolean

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @Column({ nullable: true, type: 'uuid' })
    updatedBy?: string

    /**
     * Optional project description (max 256 chars)
     */
    @Column({ type: 'varchar', length: 256, nullable: true })
    description?: string
}
