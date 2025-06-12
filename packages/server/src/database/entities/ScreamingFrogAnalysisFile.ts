import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

@Entity()
export class ScreamingFrogAnalysisFile {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Index()
    @Column({ type: 'uuid' })
    projectId: string

    @Column()
    filename: string

    @Column()
    s3RawUrl: string

    @Column({ type: 'text', nullable: true })
    promptUrl: string

    @Column({ type: 'text', nullable: true })
    reportSectionUrl: string

    @Column({ type: 'simple-array', nullable: true })
    s3PromptHistory: string[]

    @Column({ type: 'simple-array', nullable: true })
    s3ReportHistory: string[]

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
