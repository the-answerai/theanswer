import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn, Index } from 'typeorm'
import { ICreditAlert } from '../../Interface'

@Entity()
export class CreditAlert implements ICreditAlert {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Index()
    @Column({ type: 'uuid' })
    userId: string

    @Index()
    @Column({ type: 'uuid', nullable: true })
    organizationId: string

    @Column()
    stripeCustomerId: string

    @Column()
    type: string

    @Column({ type: 'integer' })
    threshold: number

    @Column({ type: 'timestamp' })
    @CreateDateColumn()
    triggeredAt: Date

    @Column({ type: 'timestamp', nullable: true })
    acknowledgedAt: Date
}
