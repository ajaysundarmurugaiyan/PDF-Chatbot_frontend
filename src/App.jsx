import React from 'react';
import PDFChat from './components/PDFChat';
import './App.css';

function App() {
  return (
    <div className="app-container">
      {/* <header className="app-header">
        <h1 className="text-3xl font-bold text-gray-800">PDF AI Assistant</h1>
      </header> */}
      <main className="app-main">
        <PDFChat />
      </main>
    </div>
  );
}

export default App;
