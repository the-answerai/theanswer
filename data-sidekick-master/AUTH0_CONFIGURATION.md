# Auth0 Configuration Guide

This document provides guidance on configuring Auth0 for different environments in the Data Sidekick application.

## Environment Variables

The following environment variables control Auth0 configuration:

### Server-Side Variables

| Variable                | Description                          | Example                                                      |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------ |
| `AUTH0_BASE_URL`        | The base URL of your application     | `https://rds-answer-agent-ai.onrender.com`                   |
| `AUTH0_CALLBACK_URL`    | The callback URL for Auth0 redirects | `https://rds-answer-agent-ai.onrender.com/api/auth/callback` |
| `AUTH0_CLIENT_ID`       | Your Auth0 client ID                 | `kMlWwgBvKJw61Z63Hc3KZFiCCPFUVeTq`                           |
| `AUTH0_CLIENT_SECRET`   | Your Auth0 client secret             | (sensitive)                                                  |
| `AUTH0_ISSUER_BASE_URL` | The Auth0 domain URL                 | `https://answer-ai.us.auth0.com`                             |
| `AUTH0_SECRET`          | Secret for cookie signing            | (sensitive)                                                  |
| `AUTH0_LOGOUT_URL`      | URL to redirect after logout         | `https://rds-answer-agent-ai.onrender.com`                   |

### Client-Side Variables

| Variable                  | Description              | Example                                             |
| ------------------------- | ------------------------ | --------------------------------------------------- |
| `VITE_AUTH0_DOMAIN`       | Your Auth0 domain        | `answer-ai.us.auth0.com`                            |
| `VITE_AUTH0_CLIENT_ID`    | Your Auth0 client ID     | `kMlWwgBvKJw61Z63Hc3KZFiCCPFUVeTq`                  |
| `VITE_AUTH0_CALLBACK_URL` | Client-side callback URL | `https://rds-answer-agent-ai.onrender.com/callback` |

## Environment-Specific Configuration

### Local Development

```
AUTH0_BASE_URL=http://localhost:5173
AUTH0_CALLBACK_URL=http://localhost:5173/api/auth/callback
AUTH0_LOGOUT_URL=http://localhost:5173
VITE_AUTH0_CALLBACK_URL=http://localhost:5173/callback
```

### Production (Render)

```
AUTH0_BASE_URL=https://rds-answer-agent-ai.onrender.com
AUTH0_CALLBACK_URL=https://rds-answer-agent-ai.onrender.com/api/auth/callback
AUTH0_LOGOUT_URL=https://rds-answer-agent-ai.onrender.com
VITE_AUTH0_CALLBACK_URL=https://rds-answer-agent-ai.onrender.com/callback
NODE_ENV=production
```

## Auth0 Dashboard Configuration

You also need to configure the following in your Auth0 dashboard:

1. **Allowed Callback URLs**: Add all environment URLs

    - `http://localhost:5173/api/auth/callback`
    - `http://localhost:5173/callback`
    - `https://rds-answer-agent-ai.onrender.com/api/auth/callback`
    - `https://rds-answer-agent-ai.onrender.com/callback`

2. **Allowed Logout URLs**: Add all environment URLs

    - `http://localhost:5173`
    - `https://rds-answer-agent-ai.onrender.com`

3. **Allowed Web Origins**: Add all environment base URLs
    - `http://localhost:5173`
    - `https://rds-answer-agent-ai.onrender.com`

## Troubleshooting

### Common Issues

1. **Localhost URLs in production**: Check `AUTH0_BASE_URL` is set correctly
2. **Redirect errors**: Ensure callback URLs are configured in Auth0 dashboard
3. **CORS errors**: Verify Web Origins are set correctly in Auth0 dashboard
4. **Cookie issues**: For HTTPS sites, ensure `secure` is set to `true` in cookie config

### Debugging

The application logs Auth0 configuration details on startup:

```
Auth0 Config Details: {
  baseURL: '...',
  issuerBaseURL: '...',
  clientID: '...',
  fullCallbackURL: '...',
  routes: { ... },
  ...
}
```

Check these logs to verify your configuration is being applied correctly.
