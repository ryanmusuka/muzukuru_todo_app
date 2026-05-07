// src/App.tsx
import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm border-4 border-blue-500">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
          Tailwind is Live
        </h1>
        <p className="text-gray-600 font-medium">
          If you see a dark background, a centered white card with a blue border, and gradient text, your styling is ready.
        </p>
        <div className="mt-6">
          <span className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold uppercase tracking-wider">
            Requirement 1.2 Met
          </span>
        </div>
      </div>
    </div>
  );
};

export default App;