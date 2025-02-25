import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, Index } from 'typeorm'
import { IUserCredits } from '../../Interface'

@Entity()
export class UserCredits implements IUserCredits {
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

    @Column({ type: 'integer', default: 10000 })
    freeCreditsBalance: number

    @Column({ type: 'integer', default: 0 })
    purchasedCreditsBalance: number

    @Column({ default: false })
    isBlocked: boolean

    @Column({ nullable: true })
    blockReason: string

    @Column({ type: 'timestamp', nullable: true })
    lastInvoiceAt: Date

    @Column({ type: 'timestamp' })
    @CreateDateColumn()
    createdAt: Date

    @Column({ type: 'timestamp' })
    @UpdateDateColumn()
    updatedAt: Date
}
