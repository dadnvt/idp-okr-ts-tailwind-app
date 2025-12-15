import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_ilPTEVT0U',
      userPoolClientId: '1c50sakb0hn0k5grcgr4atbe8n',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
      },
    },
  },
});


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
