import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LocalDb } from '../lib/db';
import { 
  LayoutDashboard, 
  FilePlus2, 
  ClipboardList, 
  LogOut, 
  Download, 
  CloudLightning, 
  RefreshCw, 
  Smartphone,
  Users
} from 'lucide-react';

interface NavigationProps {
  currentTab: 'dashboard' | 'new-record' | 'history' | 'team-management';
  setTab: (tab: 'dashboard' | 'new-record' | 'history' | 'team-management') => void;
  children: React.ReactNode;
}

export default function Navigation({ currentTab, setTab, children }: NavigationProps) {
  const { user, logout } = useAuth();
  const [syncCount, setSyncCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Poll for offline sync cache count
  useEffect(() => {
    const updateSyncStatus = () => {
      setSyncCount(LocalDb.getSyncQueueLength());
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000);
    return () => clearInterval(interval);
  }, [currentTab]);

  // Handle PWA installation banner prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if already dismissed
      const dismissed = sessionStorage.getItem('pwa_banner_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Installation outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismissBanner = () => {
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
    setShowInstallBanner(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    await LocalDb.processSyncQueue();
    setSyncCount(LocalDb.getSyncQueueLength());
    setSyncing(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#181C1E] font-sans">

      {/* Top clean header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E2E8F0] h-14 px-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#EBF5FF] flex items-center justify-center border border-[#3B82F6]">
            <CloudLightning className="w-4.5 h-4.5 text-[#1D4ED8]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#1E293B] leading-tight select-none">LogiCheck</h1>
            <p className="text-[9px] uppercase font-bold text-[#3B82F6] leading-none tracking-wider">SaaS Logística</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Offline Sync Status Pill */}
          {syncCount > 0 && (
            <button
              onClick={handleSync}
              disabled={syncing}
              title="Sincronizar dados pendentes com o Supabase"
              className="flex items-center gap-1.5 bg-[#FFDAD6] text-[#93000a] px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border border-red-200 animate-pulse hover:bg-red-250 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncCount} pendentes</span>
            </button>
          )}

          {/* Active Operator Pill */}
          {user && (
            <div className="flex items-center gap-2 border-l border-[#E2E8F0] pl-3">
              <div className="text-right">
                <p className="text-xs font-semibold text-[#181C1E] max-w-[110px] truncate select-none">{user.name}</p>
                <p className="text-[9px] text-[#1E293B] font-bold leading-none select-none">
                  {user.role === 'gerente' || user.role === 'master' ? 'Gestão / Supervisor' : 'Operador Logístico'}
                </p>
              </div>
              <button
                onClick={logout}
                title="Efetuar Logoff"
                className="w-8 h-8 rounded-full border border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-center text-[#6C797B] hover:text-[#BA1A1A] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* PWA Mobile App Installation Prompt Banner */}
      {showInstallBanner && deferredPrompt && (
        <div className="bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between gap-3 text-xs border-b border-[#1E293B] animate-fade-in relative z-30">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-[#93C5FD] shrink-0" />
            <div>
              <p className="font-bold">Instalar LogiCheck no Celular</p>
              <p className="text-[#94A3B8] text-[10px]">Acesso rápido, offline e melhor uso em campo.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDismissBanner}
              className="px-2.5 py-1 text-white opacity-70 hover:opacity-100 font-semibold"
            >
              Agora Não
            </button>
            <button
              onClick={handleInstallClick}
              className="bg-[#1e3a8a] hover:bg-[#152e72] text-white px-3 py-1.5 rounded font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Scroll Canvas */}
      <main className="flex-grow pb-20 overflow-y-auto">
        {children}
      </main>

      {/* Primary Mobile Touchbar: Fixed to screen bottom, minimal, large tap points of 48px */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E2E8F0] shadow-[0_-2px_8px_rgba(0,0,0,0.03)] flex justify-around items-center z-40">
        {(user?.role === 'gerente' || user?.role === 'master') && (
          <button
            onClick={() => setTab('dashboard')}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${currentTab === 'dashboard'
                ? 'text-[#1E3A8A] font-semibold'
                : 'text-[#6C797B] hover:text-[#1E3A8A]'
              }`}
          >
            <div className={`p-1 rounded-md transition-colors ${currentTab === 'dashboard' ? 'bg-[#EBF5FF]' : ''}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-wide">Dashboard</span>
          </button>
        )}

        <button
          onClick={() => setTab('new-record')}
          className={`flex-1 h-full flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${currentTab === 'new-record'
              ? 'text-[#1E3A8A] font-semibold'
              : 'text-[#6C797B] hover:text-[#1E3A8A]'
            }`}
        >
          <div className={`p-1 rounded-md transition-colors ${currentTab === 'new-record' ? 'bg-[#EBF5FF]' : ''}`}>
            <FilePlus2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-wide">Novo Checklist</span>
        </button>

        <button
          onClick={() => setTab('history')}
          className={`flex-1 h-full flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${currentTab === 'history'
              ? 'text-[#1E3A8A] font-semibold'
              : 'text-[#6C797B] hover:text-[#1E3A8A]'
            }`}
        >
          <div className={`p-1 rounded-md transition-colors ${currentTab === 'history' ? 'bg-[#EBF5FF]' : ''}`}>
            <ClipboardList className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-wide">Histórico</span>
        </button>

        {(user?.role === 'gerente' || user?.role === 'master') && (
          <button
            onClick={() => setTab('team-management')}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${currentTab === 'team-management'
                ? 'text-[#1E3A8A] font-semibold'
                : 'text-[#6C797B] hover:text-[#1E3A8A]'
              }`}
          >
            <div className={`p-1 rounded-md transition-colors ${currentTab === 'team-management' ? 'bg-[#EBF5FF]' : ''}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-wide font-medium">Equipe</span>
          </button>
        )}
      </nav>

    </div>
  );
}
