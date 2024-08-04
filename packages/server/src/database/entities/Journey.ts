import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Journey {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    title: string

    @Column({ type: 'text' })
    goal: string

    @Column('simple-json', { nullable: true })
    documents: string | null

    @Column('simple-json', { nullable: true })
    tools: string | null

    @Column('simple-json', { nullable: true })
    chatflows: string | null

    @Column({ type: 'uuid' })
    userId: string

    @Column({ type: 'uuid' })
    organizationId: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @Column({ type: 'timestamp', nullable: true })
    completedAt?: Date
}
