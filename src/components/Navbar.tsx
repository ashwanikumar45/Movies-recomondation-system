import React from 'react';
import { Film, User, SlidersHorizontal, Sparkles, Bookmark, Menu, X, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import { UserProfile } from '../types/movie';

interface NavbarProps {
  currentTab: 'discover' | 'recommendations' | 'watchlist' | 'profile';
  onSelectTab: (tab: 'discover' | 'recommendations' | 'watchlist' | 'profile') => void;
  activeProfile: UserProfile | null;
  onOpenProfileModal: () => void;
  watchlistCount: number;
  authUser: FirebaseUser | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  activeProfile,
  onOpenProfileModal,
  watchlistCount,
  authUser,
  onOpenAuthModal,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5 font-bold no-underline text-justify">
        {/* Zone 1: Wordmark Logo */}
        <button
          onClick={() => {
            onSelectTab('discover');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 text-left group whitespace-nowrap shrink-0 transition-opacity hover:opacity-90 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Film className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white flex items-center">
            CineMatch <span className="text-[11px] font-semibold tracking-wider uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md ml-2">Cinema</span>
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <button
            onClick={() => onSelectTab('discover')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'discover'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Discover</span>
          </button>

          <button
            onClick={() => onSelectTab('recommendations')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors pb-0.5 cursor-pointer ${
              currentTab === 'recommendations'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Picks For You</span>
          </button>

          <button
            onClick={() => onSelectTab('watchlist')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors pb-0.5 cursor-pointer ${
              currentTab === 'watchlist'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Watchlist</span>
            {watchlistCount > 0 && (
              <span className="font-mono text-xs px-1.5 py-0.2 bg-slate-800 text-indigo-300 rounded tabular-nums">
                {watchlistCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('profile')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors pb-0.5 cursor-pointer ${
              currentTab === 'profile'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Taste Profile</span>
          </button>
        </nav>

        {/* Zone 3: Authentication & User Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {authUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenProfileModal}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                title="View Account & Taste Settings"
              >
                {authUser.photoURL ? (
                  <img
                    src={authUser.photoURL}
                    alt={authUser.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover border border-indigo-400"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {(authUser.displayName || authUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline font-medium max-w-[110px] truncate">
                  {authUser.displayName || authUser.email?.split('@')[0] || 'My Account'}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono hidden lg:inline border-l border-slate-700 pl-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </button>

              <button
                onClick={onSignOut}
                className="p-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg border border-slate-800 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                onClick={onOpenProfileModal}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors cursor-pointer"
                title="Switch Demo Persona"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="max-w-[90px] truncate">{activeProfile?.name || 'Personas'}</span>
              </button>
            </div>
          )}

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 border-t border-slate-800 bg-[#090d16] space-y-2">
          <button
            onClick={() => {
              onSelectTab('discover');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
              currentTab === 'discover' ? 'bg-indigo-600/20 text-indigo-300 font-medium' : 'text-slate-300'
            }`}
          >
            Discover Movies
          </button>
          <button
            onClick={() => {
              onSelectTab('recommendations');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between ${
              currentTab === 'recommendations' ? 'bg-indigo-600/20 text-indigo-300 font-medium' : 'text-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Picks For You
            </span>
          </button>
          <button
            onClick={() => {
              onSelectTab('watchlist');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between ${
              currentTab === 'watchlist' ? 'bg-indigo-600/20 text-indigo-300 font-medium' : 'text-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              My Watchlist
            </span>
            {watchlistCount > 0 && (
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-800 text-indigo-300 rounded">
                {watchlistCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              onSelectTab('profile');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
              currentTab === 'profile' ? 'bg-indigo-600/20 text-indigo-300 font-medium' : 'text-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            Taste Profile & Personas
          </button>

          {/* Auth Button in Drawer */}
          <div className="pt-2 border-t border-slate-800">
            {authUser ? (
              <button
                onClick={() => {
                  onSignOut();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({authUser.displayName || authUser.email || 'User'})</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onOpenAuthModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm bg-indigo-600 text-white rounded-md transition-colors flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Create Account</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
