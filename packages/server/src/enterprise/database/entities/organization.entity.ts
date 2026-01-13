import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { User } from './user.entity'

export enum OrganizationName {
    DEFAULT_ORGANIZATION = 'Default Organization'
}

@Entity()
export class Organization {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar', length: 100, default: OrganizationName.DEFAULT_ORGANIZATION })
    name: string

    @Column({ type: 'varchar', length: 100, nullable: true })
    customerId?: string

    @Column({ type: 'varchar', length: 100, nullable: true })
    subscriptionId?: string

    // AAI Auth0 field
    @Index()
    @Column({ nullable: true })
    auth0Id?: string

    @Column({ type: 'jsonb', nullable: true })
    organizationConfig?: string

    // AAI billing fields
    @Column({ type: 'uuid', nullable: true })
    currentPaidPlanId?: string

    @Column({ type: 'boolean', default: false })
    billingPoolEnabled?: boolean

    @Column({ nullable: true })
    stripeCustomerId?: string

    @Column({ type: 'jsonb', nullable: true })
    enabledIntegrations?: string

    @CreateDateColumn()
    createdDate?: Date

    @UpdateDateColumn()
    updatedDate?: Date

    @Column({ nullable: false })
    createdBy?: string
    @ManyToOne(() => User, (user) => user.createdOrganizations)
    @JoinColumn({ name: 'createdBy' })
    createdByUser?: User

    @Column({ nullable: false })
    updatedBy?: string
    @ManyToOne(() => User, (user) => user.updatedOrganizations)
    @JoinColumn({ name: 'updatedBy' })
    updatedByUser?: User
}
