import React from 'react'
import dynamic from 'next/dynamic'
import PurchaseSparks from '@ui/billing/PurchaseSparks'

const BillingDashboard = dynamic(() => import('@ui/billing/BillingDashboard'), { ssr: true })
const PricingOverview = dynamic(() => import('@ui/billing/PricingOverview'), { ssr: true })
const UsageStats = dynamic(() => import('@ui/billing/UsageStats'), { ssr: true })
const CostCalculator = dynamic(() => import('@ui/billing/CostCalculator'), { ssr: true })
const PurchaseSubscription = dynamic(() => import('@ui/billing/PurchaseSubscription'), { ssr: true })

const Page = () => {
    return (
        <>
            <BillingDashboard />
            <PricingOverview />
            <CostCalculator />
            <PurchaseSubscription />
            <PurchaseSparks />
            {/* <UsageStats /> */}
        </>
    )
}

export default Page
