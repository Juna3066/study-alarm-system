import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// 关键：必须引入 CSS，否则 Tailwind 不生效
import './index.css'; 

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);