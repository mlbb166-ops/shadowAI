import React, { useState } from 'react';
import { Shield, Sparkles, FileText, Menu, X, LogIn, LayoutDashboard } from 'lucide-react';
import { UserSession } from '../services/authService';

interface NavbarProps {
  currentView: 'public' | 'dashboard';
  onNavigateView: (view: 'public' | 'dashboard') => void;
  currentUser: UserSession | null;
  onOpenLoginModal: () => void;
  onOpenReportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigateView,
  currentUser,
  onOpenLoginModal,
  onOpenReportModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const publicLinks = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'pangan-nusantara', label: 'Pangan Nusantara' },
    { id: 'kamus-medis', label: 'Kamus Kesehatan 1.000 HPK' },
    { id: 'standar-medis', label: 'Standar Medis' },
  ];

  const handleLinkClick = (id: string) => {
    if (currentView !== 'public') {
      onNavigateView('public');
    }
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else if (id === 'beranda') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          {/* Logo & Brand Identity */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => handleLinkClick('beranda')}
          >
            <div className="w-10 h-10 rounded-lg bg-teal-700 flex items-center justify-center text-white">
              <Shield className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 tracking-tight">
                NutriShield
              </div>
              <p className="text-xs text-slate-500">
                Pencegahan Stunting 1.000 HPK &amp; Kedaulatan Pangan
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            {publicLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className="hover:text-teal-700 transition py-1 text-xs font-semibold"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Laporan PDF */}
            <button
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition"
            >
              <FileText className="w-4 h-4 text-teal-700" />
              <span>Laporan PDF Resmi</span>
            </button>

            {/* Portal / Dashboard Trigger */}
            {currentUser ? (
              <button
                onClick={() => onNavigateView('dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Buka Dashboard ({currentUser.role === 'kader' ? 'Kader' : 'Orang Tua'})</span>
              </button>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Dashboard</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 px-4 pt-3 pb-6 space-y-2 bg-white">
          {publicLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id)}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {link.label}
            </button>
          ))}

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenReportModal();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-slate-100 text-slate-800 border border-slate-300"
            >
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Laporan PDF Resmi</span>
            </button>

            {currentUser ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateView('dashboard');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-teal-600 text-white"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Buka Dashboard ({currentUser.role === 'kader' ? 'Kader' : 'Orang Tua'})</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLoginModal();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-teal-600 text-white"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Dashboard</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
