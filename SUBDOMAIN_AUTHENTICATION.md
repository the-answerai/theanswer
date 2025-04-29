# Subdomain Authentication Isolation

This document explains how authentication works across different subdomains of theanswer.ai.

## Default Behavior

By default, authentication is now configured to work independently across different subdomains. This means:

-   Each subdomain (e.g., staging.theanswer.ai, studio.theanswer.ai) maintains its own authentication state
-   You can be logged in to different organizations on different subdomains simultaneously
-   Switching organizations on one subdomain will not affect your session on other subdomains

This is achieved by setting authentication cookies with the specific hostname as the domain (e.g., `staging.theanswer.ai` instead of `.theanswer.ai`).

## Legacy Sharing Behavior

If you need to revert to the previous behavior where authentication is shared across all subdomains, you can set the following environment variable:

```
SHARE_COOKIES_ACROSS_SUBDOMAINS=true
```

When this setting is enabled:

-   Authentication cookies will be shared across all subdomains
-   Logging in to one organization on any subdomain will apply to all other subdomains
-   You'll need to use the "Switch Organization" feature to change organizations

## How It Works

The authentication system:

1. By default, sets cookies specific to each subdomain hostname
2. Does not share cookies across subdomains unless explicitly configured
3. Allows each subdomain to maintain its own independent session and organization selection

## Deployment Notes

If you're upgrading from a previous version:

1. Clear your browser cookies for all theanswer.ai domains after deploying
2. You'll need to log in separately to each subdomain
3. If you want to restore the previous shared behavior, set `SHARE_COOKIES_ACROSS_SUBDOMAINS=true`

## Troubleshooting

If you experience any issues:

1. Clear your browser cookies for all theanswer.ai domains
2. Log out and log back in to each subdomain
3. Check that all services are running the updated code

## API Integration Considerations

-   API calls between subdomains may require additional authentication handling
-   Authentication tokens are now specific to each subdomain
-   Services that communicate across subdomains may need to handle multiple authentication states
