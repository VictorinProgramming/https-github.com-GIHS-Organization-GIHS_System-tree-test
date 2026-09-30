import React from 'react';
import {
  LayoutDashboard,
  LifeBuoy,
  Clock,
  Users,
  Menu,
  Sparkles
} from 'lucide-react';
import { ViewScreen } from '../types';

interface MobileBottomNavProps {
  currentScreen: ViewScreen;
  onSelectScreen: (screen: ViewScreen) => void;
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentScreen,
  onSelectScreen,
  onOpenMenu
}) => {
  const navItems: Array<{
    id: ViewScreen;
    label: string;
    icon: React.ElementType;
    isPonto?: boolean;
  }> = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'chamados', label: 'Chamados', icon: LifeBuoy },
    { id: 'registro_ponto', label: 'Ponto Facial', icon: Clock, isPonto: true },
    { id: 'colaboradores', label: 'Equipe', icon: Users }
  ];

  return (
    <nav
      id="mobile-bottom-navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/90 pb-[env(safe-area-inset-bottom,0px)] select-none shadow-[0_-8px_20px_rgba(0,0,0,0.4)]"
    >
      <div className="flex items-center justify-around h-16 px-1 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;

          if (item.isPonto) {
            return (
              <button
                key={item.id}
                onClick={() => onSelectScreen(item.id)}
                className="relative -top-3 flex flex-col items-center group cursor-pointer"
                title="Bater Ponto Facial"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/30 font-bold'
                    : 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-cyan-900/50'
                }`}>
                  <Icon className="w-5 h-5 animate-pulse" />
                </div>
                <span className={`text-[10px] mt-0.5 font-bold tracking-tight ${
                  isActive ? 'text-cyan-400' : 'text-slate-300'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectScreen(item.id)}
              className={`flex-1 flex flex-col items-center justify-center h-full py-1 transition-colors cursor-pointer ${
                isActive
                  ? 'text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400"></span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Menu (Open Drawer / 22 Telas) */}
        <button
          onClick={onOpenMenu}
          id="btn-mobile-nav-all-screens"
          className="flex-1 flex flex-col items-center justify-center h-full py-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="Abrir todas as 22 telas"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">
            Menu (22)
          </span>
        </button>
      </div>
    </nav>
  );
};
