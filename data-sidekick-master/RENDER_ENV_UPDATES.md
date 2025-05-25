# Render Environment Variable Updates

To fix the Auth0 configuration issue, you need to update the following environment variables in your Render dashboard:

## Update These Variables

| Variable                  | Current Value           | New Value                                           |
| ------------------------- | ----------------------- | --------------------------------------------------- |
| `AUTH0_BASE_URL`          | `http://localhost:5173` | `https://rds-answer-agent-ai.onrender.com`          |
| `VITE_AUTH0_CALLBACK_URL` | (not set)               | `https://rds-answer-agent-ai.onrender.com/callback` |
| `NODE_ENV`                | `development`           | `production`                                        |

## Steps to Update

1. Go to your Render dashboard
2. Select your service "rds-answer-agent-ai"
3. Click on the "Environment" tab
4. Update the variables as shown in the table above
5. Click "Save Changes"
6. Redeploy your application by clicking "Manual Deploy" > "Deploy latest commit"

## Explanation

-   `AUTH0_BASE_URL`: This should be your Render application URL, not localhost
-   `VITE_AUTH0_CALLBACK_URL`: This sets the client-side callback URL
-   `NODE_ENV`: Setting this to production enables proper production behavior

After making these changes, your Auth0 configuration should correctly use your Render URL instead of localhost.
