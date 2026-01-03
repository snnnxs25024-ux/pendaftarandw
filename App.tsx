// This file is intentionally left simple to resolve a build cache issue on Vercel.
// The main application logic has been moved to MainApp.tsx.
import React from 'react';

const App: React.FC = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Application component deprecated.</h1>
      <p>The application is now rendered from <strong>MainApp.tsx</strong>.</p>
    </div>
  );
};

export default App;