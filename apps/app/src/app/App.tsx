import React from 'react';

import { FormatterRegistry } from '@novx/core';
import { interpolate } from '@novx/i18n';

export default function App() {
  return (
    <div>
      <h1>Hello Nx + React App (Webpack)</h1>
      <p>Example formatter: {FormatterRegistry.list().join(', ')}</p>
      <p>Example i18n: {interpolate('welcome', { name: 'User' })}</p>
    </div>
  );
}