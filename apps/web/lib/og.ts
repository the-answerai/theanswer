/**
 * Utility functions for generating OpenGraph image URLs
 */

export type OGImageType = 'default' | 'chat' | 'chatflow' | 'document' | 'agent'

interface OGImageParams {
    title: string
    description?: string
    type?: OGImageType
}

/**
 * Generates an OG image URL with the given parameters
 * @param params - The parameters for the OG image
 * @returns The URL string for the OG image
 */
export function generateOGImageUrl(params: OGImageParams): string {
    const searchParams = new URLSearchParams()

    searchParams.set('title', params.title)

    if (params.description) {
        searchParams.set('description', params.description)
    }

    if (params.type && params.type !== 'default') {
        searchParams.set('type', params.type)
    }

    return `/api/og?${searchParams.toString()}`
}

/**
 * Generates OpenGraph metadata for a page
 * @param params - The parameters for generating metadata
 * @returns OpenGraph metadata object compatible with Next.js Metadata type
 */
export function generateOGMetadata(params: OGImageParams) {
    return {
        title: params.title,
        description: params.description,
        images: [
            {
                url: generateOGImageUrl(params),
                width: 1200,
                height: 630,
                alt: params.title
            }
        ]
    }
}
