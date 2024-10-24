import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, Index } from 'typeorm'
import { IUser } from '../../Interface'

@Entity()
export class User implements IUser {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    auth0Id: string

    @Column()
    email: string

    @Column({ nullable: true })
    name: string

    @Column({ type: 'timestamp' })
    @CreateDateColumn()
    createdDate: Date

    @Column({ type: 'timestamp' })
    @UpdateDateColumn()
    updatedDate: Date

    @Index()
    @Column({ type: 'uuid', nullable: true, array: true })
    organizationId: string

    @Column({ type: 'uuid', nullable: true })
    trialPlanId?: string
}
