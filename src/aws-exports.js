// Centralized Amplify config.
// Keep defaults identical to the previous hard-coded values in `main.tsx`,
// but allow overriding via Vite env vars.
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId:
        (import.meta.env.VITE_COGNITO_USER_POOL_ID || '').trim() ||
        'us-east-1_ilPTEVT0U',
      userPoolClientId:
        (import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID || '').trim() ||
        '1c50sakb0hn0k5grcgr4atbe8n',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
      },
    },
  },
};

export default amplifyConfig;
