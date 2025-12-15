import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: 'ap-southeast-1', // region của bạn
    userPoolId: 'us-east-1_ilPTEVT0U', // ID User Pool
    userPoolWebClientId: '1c50sakb0hn0k5grcgr4atbe8n', // App client ID
    mandatorySignIn: true,
    loginWith: {
      email: true,
    },
  },
});
