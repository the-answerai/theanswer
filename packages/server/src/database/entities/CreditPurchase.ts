import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn, Index } from 'typeorm'
import { ICreditPurchase } from '../../Interface'

@Entity()
export class CreditPurchase implements ICreditPurchase {
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

    @Column({ nullable: true })
    subscriptionId: string

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amountUsd: number

    @Column({ type: 'integer' })
    creditsGranted: number

    @Column()
    status: string

    @Column({ type: 'timestamp' })
    @CreateDateColumn()
    createdAt: Date
}
