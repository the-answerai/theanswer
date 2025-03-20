import { Stripe } from 'stripe'

let stripeClient: Stripe | null = null

export const getStripeClient = () => {
    if (!stripeClient) {
        stripeClient = new Stripe(process.env.BILLING_STRIPE_SECRET_KEY as string, {
            apiVersion: '2024-08-20'
        })
    }

    return stripeClient
}
