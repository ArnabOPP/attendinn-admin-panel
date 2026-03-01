import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import { ToastProvider } from './hooks/useToast';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <Auth0Provider
    domain="arnabchatterjee.us.auth0.com"
    clientId="CKNfDaQXVzTRoP6g3CewoDOAMjoxDie2"
    authorizationParams={{ redirect_uri: window.location.origin }}
  >
    <ToastProvider>
      <App />
    </ToastProvider>
  </Auth0Provider>
);
