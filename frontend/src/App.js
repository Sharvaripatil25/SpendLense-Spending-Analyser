import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Insights from './pages/Insights';
import './App.css';

export const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export default function App() {
  const [data, setData] = useState(null);
  return (
    <DataContext.Provider value={{ data, setData }}>
      <BrowserRouter>
        <div className="app">
          {data && <Sidebar />}
          <main className={`main ${data ? 'with-sidebar' : ''}`}>
            <Routes>
              <Route path="/"             element={<Upload />} />
              <Route path="/dashboard"    element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/insights"     element={<Insights />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </DataContext.Provider>
  );
}

function Sidebar() {
  const { data, setData } = useData();
  const nav = [
    { to: '/dashboard',     icon: '▦', label: 'Dashboard' },
    { to: '/transactions',  icon: '≡', label: 'Transactions' },
    { to: '/insights',      icon: '◎', label: 'Insights' },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">◈</div>
        <span className="logo-text">SpendLens</span>
      </div>
      <div className="sidebar-file">
        <div className="file-chip">
          <span className="file-dot" />
          <span className="file-name">{data?.fileName || 'data loaded'}</span>
        </div>
        <div className="file-meta">{data?.transactions?.length} transactions · Python</div>
      </div>
      <div className="sidebar-section-label">Navigation</div>
      <nav className="sidebar-nav">
        {nav.map(n => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{n.icon}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
      <button className="reset-btn" onClick={() => { setData(null); window.location.href='/'; }}>
        ↩ Load New File
      </button>
    </aside>
  );
}
