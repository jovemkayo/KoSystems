import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './original/App';
import {BrandHeader} from './original/components/BrandHeader';
import './original/styles.css';
import './original/styles/workflow.css';
import './original/styles/account.css';
import './original/styles/print.css';
import './demo.css';

createRoot(document.getElementById('root')!).render(<><BrandHeader/><App/></>);
