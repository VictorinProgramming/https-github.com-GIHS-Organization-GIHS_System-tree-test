import React from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { AlertCircle, Bell, X, Volume2, Info } from 'lucide-react';

export const VisualNotificationBanner: React.FC = () => {
  const { activeVisualAlerts, dismissVisualAlert, visualAlerts, highContrast } = useAccessibility();

  if (!visualAlerts || activeVisualAlerts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Alertas visuais acessíveis"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {activeVisualAlerts.map(alert => {
        const isUrgent = alert.type === 'urgent';
        const isWarning = alert.type === 'warning';

        return (
          <div
            key={alert.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl flex items-start gap-3 transition-all duration-300 a11y-sound-alert-indicator ${
              highContrast
                ? 'bg-black border-yellow-400 text-white'
                : isUrgent
                ? 'bg-[#1a0505] border-rose-500/80 text-white'
                : isWarning
                ? 'bg-[#1f1300] border-amber-500/80 text-white'
                : 'bg-[#041838] border-[#0067FC] text-white'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                highContrast
                  ? 'bg-yellow-400 text-black'
                  : isUrgent
                  ? 'bg-rose-500 text-white'
                  : isWarning
                  ? 'bg-amber-500 text-black'
                  : 'bg-[#0067FC] text-white'
              }`}
            >
              {isUrgent ? <AlertCircle className="w-5 h-5" /> : isWarning ? <Bell className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" />
                  Alerta Visual de Notificação
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{alert.timestamp}</span>
              </div>
              <h5 className="text-sm font-bold text-white mt-0.5">{alert.title}</h5>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alert.message}</p>
            </div>

            <button
              type="button"
              onClick={() => dismissVisualAlert(alert.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
              aria-label="Fechar alerta visual"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
