/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ScanRecord {
  id: string;
  original_filename: string;
  saved_filename: string;
  extension: string;
  file_size: number;
  file_hash: string;
  status: 'SAFE' | 'WARNING' | 'BLOCKED';
  reason: string;
  scan_date: string;
}

interface Stats {
  total: number;
  safe: number;
  warning: number;
  blocked: number;
  mostCommon: string;
}

export default function App() {
  const [view, setView] = useState<'home' | 'upload' | 'dashboard' | 'result' | 'history' | 'login' | 'about'>('home');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminChecking, setIsAdminChecking] = useState(true);
  const [lastScan, setLastScan] = useState<ScanRecord | null>(null);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, safe: 0, warning: 0, blocked: 0, mostCommon: 'N/A' });
  const [isScanning, setIsScanning] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      setIsAuthenticated(data.isAuthenticated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdminChecking(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) { console.error(e); }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (!isAdminChecking && !isAuthenticated) {
      if (view === 'dashboard' || view === 'history') {
        setView('login');
      }
    }
  }, [view, isAuthenticated, isAdminChecking]);

  useEffect(() => {
    if (view === 'dashboard' || view === 'history') {
      fetchStats();
      fetchHistory();
    }
  }, [view, fetchStats, fetchHistory]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        setView('dashboard');
        setLoginError('');
      } else {
        setLoginError('Invalid credentials. Access Denied.');
      }
    } catch (e) {
      setLoginError('Authentication service unreachable.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setView('home');
  };

  const deleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
      fetchHistory();
      fetchStats();
    } catch (e) { console.error(e); }
  };

  const clearHistory = async () => {
    if (!confirm('CRITICAL: Delete ALL scan history?')) return;
    try {
      await fetch('/api/history', { method: 'DELETE' });
      fetchHistory();
      fetchStats();
    } catch (e) { console.error(e); }
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setLastScan(data);
      setView('result');
      fetchStats();
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const navItemClass = (active: boolean) => 
    `text-xs font-medium uppercase tracking-widest cursor-pointer transition-all ${active ? 'text-cyan-400 font-bold' : 'opacity-40 hover:opacity-100'}`;

  return (
    <div className="min-h-screen bg-app-bg text-app-text font-sans flex flex-col transition-colors duration-300">
      {/* Header */}
      <nav className="h-16 border-b border-app-border/60 bg-app-surface px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <span className="material-symbols-outlined text-black text-xl font-bold">shield_with_heart</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-app-text uppercase">SecureScan <span className="text-cyan-400 underline decoration-cyan-500/30">v2.4</span></span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-4">
            <span className={navItemClass(view === 'home')} onClick={() => setView('home')}>Home</span>
            <span className={navItemClass(view === 'upload' || view === 'result')} onClick={() => setView('upload')}>Scanner</span>
            {isAuthenticated && (
              <>
                <span className={navItemClass(view === 'dashboard')} onClick={() => setView('dashboard')}>Dashboard</span>
                <span className={navItemClass(view === 'history')} onClick={() => setView('history')}>Archive</span>
              </>
            )}
            <span className={navItemClass(view === 'about')} onClick={() => setView('about')}>About</span>
          </div>
          <div className="h-8 w-px bg-app-border hidden sm:block"></div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 rounded-full border border-app-border flex items-center justify-center text-app-text hover:bg-app-border/50 transition-all"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <span className="material-symbols-outlined text-sm">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {isAuthenticated ? (
              <button onClick={handleLogout} className="text-[10px] font-black text-status-blocked hover:text-red-600 dark:hover:text-red-400 uppercase tracking-widest flex items-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-sm">logout</span> Log Out
              </button>
            ) : (
              <button onClick={() => setView('login')} className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 uppercase tracking-widest flex items-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-sm">login</span> Admin Login
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-auto relative">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 lg:p-12 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[80vh] text-center"
            >
              <div className="mb-8 p-4 bg-cyan-500/10 rounded-full inline-block border border-cyan-500/20">
                <span className="material-symbols-outlined text-6xl text-cyan-400">security_update_good</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-app-text mb-6 uppercase tracking-tighter">Secure File<br/><span className="text-cyan-500">Integrity Scanner</span></h1>
              <p className="text-app-text-muted text-lg max-w-2xl mb-12">
                Advanced malware sandbox engine designed for forensic file verification. 
                Utilizes SHA-256 integrity checksums and multi-layer extension filtering to ensure 
                safety in your digital asset repository.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <button 
                  onClick={() => setView('upload')}
                  className="bg-cyan-600 text-white px-10 py-4 rounded-xl font-black hover:bg-cyan-500 transition-all uppercase tracking-[0.2em] shadow-2xl shadow-cyan-900/30 flex items-center gap-3"
                >
                  <span className="material-symbols-outlined">upload_file</span>
                  Initialize Scanner
                </button>
                <button 
                  onClick={() => isAuthenticated ? setView('dashboard') : setView('login')}
                  className="border-2 border-app-border hover:border-cyan-500/30 px-10 py-4 rounded-xl font-black text-app-text transition-all flex items-center gap-3 active:scale-95 bg-app-surface/50"
                >
                  <span className="material-symbols-outlined">admin_panel_settings</span>
                  {isAuthenticated ? 'Admin Console' : 'Admin Login'}
                </button>
              </div>
            </motion.div>
          )}

          {view === 'login' && (
            <motion.div 
              key="login"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center justify-center min-h-full p-6"
            >
              <div className="bg-app-surface p-10 rounded-2xl border border-app-border w-full max-w-md shadow-2xl">
                <div className="flex justify-center mb-8">
                  <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-black text-2xl font-bold bg-cyan-500 p-2 rounded-lg">lock</span>
                  </div>
                </div>
                <h2 className="text-2xl font-black text-app-text text-center mb-2 uppercase tracking-tight">Admin Authentication</h2>
                <p className="text-[10px] text-app-text-muted font-mono text-center mb-8 uppercase tracking-widest">Enterprise Access Protocol Required</p>
                
                {loginError && (
                  <div className="bg-status-blocked-bg border border-status-blocked/30 p-3 rounded-lg mb-6 text-center">
                    <p className="text-status-blocked text-[10px] font-bold uppercase tracking-widest">{loginError}</p>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-app-text-muted uppercase tracking-tighter mb-2">Registry User</label>
                    <input name="username" type="text" required className="w-full bg-app-bg border border-app-border rounded-lg text-app-text p-4 focus:ring-1 focus:ring-cyan-500 outline-none font-mono text-xs" placeholder="e.g. admin" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-app-text-muted uppercase tracking-tighter mb-2">Access Key</label>
                    <input name="password" type="password" required className="w-full bg-app-bg border border-app-border rounded-lg text-app-text p-4 focus:ring-1 focus:ring-cyan-500 outline-none font-mono text-xs" />
                  </div>
                  <button type="submit" className="w-full bg-cyan-600 text-white py-4 rounded-xl font-black hover:bg-cyan-500 transition-all uppercase tracking-widest text-[11px] shadow-xl shadow-cyan-900/30">
                    Authorize Session
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'about' && (
            <motion.div 
              key="about"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 md:p-16 max-w-4xl mx-auto space-y-12"
            >
              <section className="text-center">
                <h1 className="text-4xl font-black text-app-text mb-6 uppercase tracking-tight">Deep Malware <span className="text-cyan-500">Sandbox</span></h1>
                <p className="text-app-text-muted text-lg leading-relaxed">
                  SecureScan v2.4 represents the pinnacle of distributed file verification. 
                  Built for security professionals, it ensures that every digital asset entering your environment 
                  is strictly validated against modern heuristics and immutable checksums.
                </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-app-surface border border-app-border p-8 rounded-2xl">
                  <h4 className="text-cyan-400 font-black uppercase text-xs mb-4 tracking-widest">Protocol Rules</h4>
                  <ul className="space-y-3 text-sm text-app-text-muted">
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span> SHA-256 Integrity Checksumming</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span> Double Extension Detection</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span> Sanitized Filename Persistance</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span> Blocked Binary Execution Prevention</li>
                  </ul>
                </div>
                <div className="bg-app-surface border border-app-border p-8 rounded-2xl">
                  <h4 className="text-cyan-400 font-black uppercase text-xs mb-4 tracking-widest">Compliance</h4>
                  <ul className="space-y-3 text-sm text-app-text-muted">
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span> GDPR Compliant Data Persistence</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span> AES-256 Encrypted Auth Channels</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span> SOC Type 2 Monitoring Ready</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span> Forensic Export Capabilities</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
          {view === 'upload' && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 lg:p-12 max-w-5xl mx-auto h-full flex flex-col"
            >
              <header className="mb-10 text-center">
                <h2 className="text-3xl font-black text-app-text mb-2 uppercase tracking-tight">Malware Sandbox Ingress</h2>
                <p className="text-app-text-muted text-sm">Secure, private, and precise file integrity validation engine.</p>
              </header>

              <div className="bg-app-surface/50 border-2 border-dashed border-app-border p-12 rounded-2xl flex flex-col items-center justify-center min-h-[400px] group hover:border-cyan-500/30 transition-all relative">
                {isScanning && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-10 flex flex-col items-center justify-center rounded-2xl">
                    <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin mb-6"></div>
                    <div className="text-center">
                      <p className="text-cyan-400 font-mono text-sm animate-pulse tracking-widest mb-2">EXTRACTING SHA-256 SIGNATURE...</p>
                      <p className="text-app-text-muted font-mono text-[10px] uppercase">Heuristic pattern matching in progress</p>
                    </div>
                  </div>
                )}
                
                <div className="w-24 h-24 bg-app-surface border border-app-border rounded-2xl rotate-45 flex items-center justify-center mb-10 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] group-hover:border-cyan-500/30 transition-all transform hover:rotate-0 duration-500">
                  <span className="material-symbols-outlined text-5xl text-cyan-500 transform -rotate-45 group-hover:rotate-0 transition-transform duration-500">cloud_upload</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-app-text">Select Forensic Subject</h3>
                <p className="text-app-text-muted text-center mb-10 text-sm max-w-md">Drop restricted assets here or browse local registry. <br/><span className="text-[10px] uppercase tracking-widest opacity-60 font-bold mt-2 block bg-app-bg px-3 py-1 rounded-full border border-app-border">MAX_NODE_LOAD: 10MB</span></p>
                
                <input type="file" id="fileInput" className="hidden" onChange={handleFileUpload} />
                <button 
                  onClick={() => document.getElementById('fileInput')?.click()}
                  className="bg-cyan-600 text-white px-10 py-4 rounded-lg font-bold hover:bg-cyan-500 active:scale-95 transition-all flex items-center gap-3 uppercase text-xs tracking-widest shadow-xl shadow-cyan-900/40"
                >
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  Initialize Session
                </button>
              </div>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-app-surface border border-app-border p-5 rounded-xl">
                    <span className="material-symbols-outlined text-cyan-500 mb-3 block">verified_user</span>
                    <h5 className="text-app-text font-bold text-xs uppercase mb-2">Integrity Lock</h5>
                    <p className="text-app-text-muted text-[10px] leading-relaxed">Full SHA-256 checksum validation for every ingress subject.</p>
                </div>
                <div className="bg-app-surface border border-app-border p-5 rounded-xl">
                    <span className="material-symbols-outlined text-cyan-500 mb-3 block">security</span>
                    <h5 className="text-app-text font-bold text-xs uppercase mb-2">Extension Shield</h5>
                    <p className="text-app-text-muted text-[10px] leading-relaxed">Multi-layer extension filtering prevents execution of restricted binaries.</p>
                </div>
                <div className="bg-app-surface border border-app-border p-5 rounded-xl">
                    <span className="material-symbols-outlined text-cyan-500 mb-3 block">monitoring</span>
                    <h5 className="text-app-text font-bold text-xs uppercase mb-2">Real-time SOC</h5>
                    <p className="text-app-text-muted text-[10px] leading-relaxed">Instant telemetry data synchronized with centralized security dashboard.</p>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'result' && lastScan && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 lg:p-12 max-w-5xl mx-auto"
            >
              <div className="bg-app-surface border border-app-border rounded-2xl relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className={`absolute top-0 left-0 w-2 h-full opacity-50 ${
                  lastScan.status === 'BLOCKED' ? 'bg-status-blocked shadow-[0_0_20px_rgba(220,38,38,0.5)]' : 
                  lastScan.status === 'WARNING' ? 'bg-status-warning shadow-[0_0_20px_rgba(217,119,6,0.5)]' : 
                  'bg-status-safe shadow-[0_0_20px_rgba(5,150,105,0.5)]'
                }`}></div>
                
                <div className="p-8 md:p-12">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                                    lastScan.status === 'BLOCKED' ? 'text-status-blocked border border-status-blocked/30 bg-status-blocked-bg' : 
                                    lastScan.status === 'WARNING' ? 'text-status-warning border border-status-warning/30 bg-status-warning-bg' : 
                                    'text-status-safe border border-status-safe/30 bg-status-safe-bg'
                                }`}>
                                    VERDICT: {lastScan.status}
                                </span>
                                <span className="text-slate-600 font-mono text-[9px] uppercase tracking-widest">ID: {lastScan.id.split('-')[0]}</span>
                            </div>
                            <h1 className="text-4xl font-black text-app-text mb-4 tracking-tight break-all uppercase">{lastScan.original_filename}</h1>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-app-text-muted uppercase">SHA-256:</span>
                                    <span className="text-[10px] font-mono text-cyan-400/80 break-all">{lastScan.file_hash}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-3">
                            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center border-2 ${
                                lastScan.status === 'BLOCKED' ? 'border-status-blocked/20 bg-status-blocked-bg' : 
                                lastScan.status === 'WARNING' ? 'border-status-warning/20 bg-status-warning-bg' : 
                                'border-status-safe/20 bg-status-safe-bg'
                            }`}>
                                <span className={`material-symbols-outlined text-5xl ${
                                    lastScan.status === 'BLOCKED' ? 'text-status-blocked' : 
                                    lastScan.status === 'WARNING' ? 'text-status-warning' : 
                                    'text-status-safe'
                                }`}>
                                    {lastScan.status === 'BLOCKED' ? 'dangerous' : lastScan.status === 'WARNING' ? 'report_problem' : 'verified'}
                                </span>
                            </div>
                            <p className="text-[10px] text-app-text-muted uppercase font-bold tracking-widest">Security Posture</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        <div className="space-y-6">
                            <div className="p-6 bg-app-bg/40 rounded-xl border border-app-border shadow-inner">
                                <h3 className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest mb-4 border-b border-app-border pb-3">Forensic Insight</h3>
                                <p className="text-sm font-mono text-cyan-500 leading-relaxed italic">
                                    "{lastScan.reason}"
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-app-surface/30 rounded-lg border border-app-border">
                                    <p className="text-[9px] text-app-text-muted uppercase font-bold mb-1">Resource Mass</p>
                                    <p className="text-app-text font-mono text-xs">{lastScan.file_size.toLocaleString()} BYTES</p>
                                </div>
                                <div className="p-4 bg-app-surface/30 rounded-lg border border-app-border">
                                    <p className="text-[9px] text-app-text-muted uppercase font-bold mb-1">MIME Detection</p>
                                    <p className="text-app-text font-mono text-xs">.{lastScan.extension.toUpperCase()}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-app-surface/10 p-8 rounded-2xl border border-app-border flex flex-col justify-center gap-6 relative overflow-hidden">
                            <div className="absolute -right-10 -bottom-10 opacity-5">
                                <span className="material-symbols-outlined text-[150px] text-app-text">gavel</span>
                            </div>
                            <div>
                                <h4 className="text-app-text-muted font-bold text-[10px] uppercase mb-4 tracking-widest">Risk Assessment</h4>
                                <div className="h-2 w-full bg-app-border rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-1000 ${
                                        lastScan.status === 'BLOCKED' ? 'w-full bg-status-blocked' : 
                                        lastScan.status === 'WARNING' ? 'w-[60%] bg-status-warning' : 'w-[5%] bg-status-safe'
                                    }`}></div>
                                </div>
                                <div className="flex justify-between mt-2 text-[9px] font-bold uppercase tracking-widest">
                                    <span className="text-status-safe">Nominal</span>
                                    <span className="text-status-blocked">Critical</span>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-app-border">
                                <p className="text-xs text-app-text-muted italic">"The engine has categorized this asset as <span className={`font-bold ${lastScan.status === 'BLOCKED' ? 'text-status-blocked' : lastScan.status === 'WARNING' ? 'text-status-warning' : 'text-status-safe'}`}>{lastScan.status}</span>. Implementation of safety measures is highly recommended before further handling."</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <button onClick={() => setView('upload')} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-center py-5 rounded-xl font-black transition-all uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-cyan-900/20 active:scale-[0.98]">Purge & New Session</button>
                        <button onClick={() => setView('history')} className="flex-1 border-2 border-app-border bg-app-surface/60 hover:bg-app-surface text-app-text text-center py-5 rounded-xl font-black transition-all uppercase text-[11px] tracking-[0.2em] active:scale-[0.98]">Access Archive Vault</button>
                    </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 max-w-6xl mx-auto h-full overflow-y-auto"
            >
              <div className="space-y-8">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-4xl font-black text-app-text mb-2 uppercase tracking-tight">Security Fleet Status</h1>
                    <p className="text-app-text-muted text-sm">Aggregated forensic metrics from all scanning nodes in this session.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 rounded-full text-[9px] font-bold uppercase tracking-widest">Global Relay: ON</span>
                    <span className="px-3 py-1 bg-status-safe-bg text-status-safe border border-status-safe/20 rounded-full text-[9px] font-bold uppercase tracking-widest">SOC: ACTIVE</span>
                  </div>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  <div className="p-6 bg-app-surface border border-app-border rounded-2xl relative group overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-app-text">inventory</span>
                    </div>
                    <p className="text-[10px] text-app-text-muted uppercase font-black tracking-widest mb-2">Total Assets</p>
                    <h2 className="text-4xl font-black text-app-text">{stats.total}</h2>
                  </div>
                  <div className="p-6 bg-status-safe-bg border border-status-safe/20 rounded-2xl relative group overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-status-safe">
                        <span className="material-symbols-outlined text-6xl">verified</span>
                    </div>
                    <p className="text-[10px] text-status-safe uppercase font-black tracking-widest mb-2">Safe Verified</p>
                    <h2 className="text-4xl font-black text-status-safe">{stats.safe}</h2>
                  </div>
                  <div className="p-6 bg-status-warning-bg border border-status-warning/20 rounded-2xl relative group overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-status-warning">
                        <span className="material-symbols-outlined text-6xl">report</span>
                    </div>
                    <p className="text-[10px] text-status-warning uppercase font-black tracking-widest mb-2">Anomalies</p>
                    <h2 className="text-4xl font-black text-status-warning">{stats.warning}</h2>
                  </div>
                  <div className="p-6 bg-status-blocked-bg border border-status-blocked/20 rounded-2xl relative group overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-status-blocked">
                        <span className="material-symbols-outlined text-6xl">block</span>
                    </div>
                    <p className="text-[10px] text-status-blocked uppercase font-black tracking-widest mb-2">Neutralized</p>
                    <h2 className="text-4xl font-black text-status-blocked">{stats.blocked}</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden backdrop-blur-md">
                            <div className="p-5 bg-app-surface border-b border-app-border flex justify-between items-center">
                                <h4 className="text-xs font-bold text-app-text uppercase tracking-[0.2em]">Live Forensic Feed</h4>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                                    <span className="text-[9px] text-app-text-muted font-bold uppercase tracking-widest">Syncing...</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto min-h-[300px]">
                                <table className="w-full text-left">
                                <thead className="text-[10px] uppercase text-app-text-muted border-b border-app-border bg-app-bg font-bold tracking-widest">
                                    <tr>
                                    <th className="px-6 py-4">Relay Time</th>
                                    <th className="px-6 py-4">Registry Asset</th>
                                    <th className="px-6 py-4">Threat Level</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px] font-mono">
                                    {history.slice(0, 8).map(record => (
                                    <tr key={record.id} className="border-b border-app-border hover:bg-app-text/5 transition-colors group">
                                        <td className="px-6 py-4 text-app-text-muted group-hover:text-app-text transition-colors">{new Date(record.scan_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                                        <td className="px-6 py-4 font-bold text-app-text uppercase tracking-tighter truncate max-w-[150px]">{record.original_filename}</td>
                                        <td className="px-6 py-4 flex items-center justify-between">
                                          <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-tighter ${
                                              record.status === 'SAFE' ? 'text-status-safe border-status-safe/20 bg-status-safe-bg' :
                                              record.status === 'BLOCKED' ? 'text-status-blocked border-status-blocked/20 bg-status-blocked-bg' :
                                              'text-status-warning border-status-warning/20 bg-status-warning-bg'
                                          }`}>
                                              {record.status}
                                          </span>
                                          <button onClick={(e) => {e.stopPropagation(); deleteRecord(record.id)}} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500/50 hover:text-red-500 p-1">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                          </button>
                                        </td>
                                    </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-24 text-center text-app-text-muted uppercase font-black text-[10px] tracking-[0.3em] bg-app-bg/50 opacity-50">Zero Assets in Local Cache</td>
                                        </tr>
                                    )}
                                </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-app-surface border border-app-border p-8 rounded-2xl flex flex-col items-center justify-center text-center relative group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none"></div>
                            <p className="text-[10px] text-app-text-muted uppercase tracking-[0.2em] mb-4 font-black">Security Posture</p>
                            <div className="w-32 h-32 rounded-full border-2 border-status-safe/20 flex items-center justify-center mb-6 relative">
                                <div className="absolute inset-0 rounded-full border-2 border-t-status-safe animate-spin opacity-40"></div>
                                <span className="text-3xl font-black text-status-safe uppercase tracking-tighter">100%</span>
                            </div>
                            <span className="text-status-safe text-[10px] font-black border-2 border-status-safe/20 px-6 py-2 rounded-full bg-status-safe-bg animate-pulse tracking-[0.2em]">OPTIMIZED</span>
                        </div>

                        <div className="bg-app-surface border border-app-border p-6 rounded-2xl space-y-4">
                            <h5 className="text-[10px] text-app-text-muted uppercase font-black tracking-widest mb-2">Technical Telemetry</h5>
                            <div className="flex justify-between items-center text-[11px] font-mono">
                                <span className="text-app-text-muted">Dominant Segment:</span>
                                <span className="text-app-text uppercase font-bold text-xs">{stats.mostCommon}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-mono">
                                <span className="text-app-text-muted">Connectivity:</span>
                                <span className="text-status-safe font-bold uppercase">SECURED</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-mono">
                                <span className="text-app-text-muted">Encryption:</span>
                                <span className="text-cyan-400 font-bold">AES-256</span>
                            </div>
                            <button onClick={() => setView('history')} className="w-full mt-4 bg-app-surface/50 hover:bg-app-bg text-app-text py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-app-border">Export Forensic Log</button>
                        </div>
                    </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 max-w-6xl mx-auto h-full overflow-y-auto"
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
                  <div>
                    <h1 className="text-4xl font-black text-app-text mb-2 uppercase tracking-tight">Forensic Archive</h1>
                    <p className="text-app-text-muted text-sm">Review, filter, and export persistent scan records from the local node.</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={clearHistory} className="bg-status-blocked-bg text-status-blocked border border-status-blocked/30 px-6 py-3 rounded-lg text-[11px] font-black hover:bg-status-blocked/20 transition-all uppercase tracking-widest active:scale-95">
                      Clear Vault
                    </button>
                    <a href="/api/export" download className="bg-cyan-600 text-white px-6 py-3 rounded-lg text-[11px] font-black hover:bg-cyan-500 transition-all uppercase tracking-widest shadow-xl shadow-cyan-900/20 active:scale-95">
                      Export CSV Log
                    </a>
                  </div>
                </div>

              <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase text-app-text-muted border-b border-app-border bg-app-surface/40 font-black tracking-widest">
                      <th className="px-8 py-5 font-medium">Timestamp</th>
                      <th className="px-8 py-5 font-medium text-left">Registry Asset</th>
                      <th className="px-8 py-5 font-medium">Validation</th>
                      <th className="px-8 py-5 font-medium">SHA-256 Segment</th>
                      <th className="px-8 py-5 font-medium text-right">Operational Unit</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px]">
                    {history.map(record => (
                      <tr key={record.id} className="border-b border-app-border hover:bg-app-text/5 transition-all group">
                        <td className="px-8 py-5 text-app-text-muted font-mono group-hover:text-app-text transition-colors">{new Date(record.scan_date).toLocaleTimeString([], { hour12: false })}</td>
                        <td className="px-8 py-5 font-black text-app-text tracking-tighter truncate max-w-[250px] uppercase group-hover:text-cyan-400 transition-colors">{record.original_filename}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                            record.status === 'SAFE' ? 'text-status-safe bg-status-safe-bg border-status-safe/20' : 
                            record.status === 'BLOCKED' ? 'text-status-blocked bg-status-blocked-bg border-status-blocked/20' : 
                            'text-status-warning bg-status-warning-bg border-status-warning/20'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-app-text-muted font-mono text-[10px] group-hover:text-cyan-500/50 transition-colors">{record.file_hash.slice(0, 16)}...</td>
                        <td className="px-8 py-5 text-right flex items-center justify-end gap-3">
                          <button onClick={() => {setLastScan(record); setView('result');}} className="text-cyan-400 hover:text-cyan-300 transition-colors text-[10px] font-black tracking-widest uppercase border border-cyan-400/20 px-4 py-1.5 rounded bg-cyan-400/5 hover:bg-cyan-400/10 active:scale-95">Inspect</button>
                          <button onClick={() => deleteRecord(record.id)} className="text-red-500/50 hover:text-red-500 transition-colors p-1" title="Purge Record">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-32 text-center text-app-text-muted font-black text-[10px] bg-app-bg/20 uppercase tracking-[0.4em] opacity-40">Zero Encrypted Records Stored in Vault</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="h-12 bg-app-bg border-t border-app-border px-8 flex items-center justify-between text-[10px] font-mono tracking-widest">
        <div className="flex gap-8">
          <span className="text-app-text-muted group cursor-default"><span className="text-cyan-600 font-bold uppercase transition-colors group-hover:text-cyan-400">NODE:</span> local.security.v2.4</span>
          <span className="text-app-text-muted group cursor-default hidden sm:inline"><span className="text-cyan-600 font-bold uppercase transition-colors group-hover:text-cyan-400">LATENCY:</span> 1.2ms</span>
          <span className="text-app-text-muted group cursor-default hidden md:inline"><span className="text-cyan-600 font-bold uppercase transition-colors group-hover:text-cyan-400">DB:</span> ephemeral.persistent.layer</span>
        </div>
        <div className="text-app-text-muted italic opacity-80">SecureScan v2.4 &copy; 2024 Vigilant Expert Systems Division</div>
      </footer>
    </div>
  );
}
