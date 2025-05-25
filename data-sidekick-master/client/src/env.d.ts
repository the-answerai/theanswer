/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ANSWERAI_HOST: string
    readonly VITE_API_URL: string
    readonly VITE_STUDIO_URL: string
    readonly VITE_DOCS_URL: string
    readonly VITE_AUTH0_DOMAIN: string
    readonly VITE_AUTH0_CLIENT_ID: string
    readonly VITE_AUTH0_CALLBACK_URL: string
    readonly VITE_ANSWERAI_ANALYSIS_CHATFLOW: string
    readonly VITE_AAI_FAQ_CHATBOT: string
    readonly VITE_AAI_SUPPORT_CHATBOT: string
    // Add other environment variables as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
