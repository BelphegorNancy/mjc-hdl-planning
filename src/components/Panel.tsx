import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

interface PanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

const Panel: React.FC<PanelProps> = ({ isOpen, onClose, title, children, buttonRef }) => {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setMounted(true);
      if (buttonRef.current && panelRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const panelRect = panelRef.current.getBoundingClientRect();
        
        // Position par défaut : en dessous du bouton
        let top = buttonRect.bottom + window.scrollY + 8;
        let left = buttonRect.left + window.scrollX;

        // Ajustement si le panel dépasse à droite
        if (left + panelRect.width > window.innerWidth) {
          left = window.innerWidth - panelRect.width - 16;
        }

        // Ajustement si le panel dépasse en bas
        if (top + panelRect.height > window.innerHeight) {
          top = buttonRect.top + window.scrollY - panelRect.height - 8;
        }

        setPosition({ top, left });
      }
    } else {
      // Délai avant de démonter le composant pour permettre l'animation de sortie
      const timer = setTimeout(() => {
        setMounted(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/20 transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        ref={panelRef}
        className={cn(
          "fixed z-50 w-64 bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-200",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        )}
        style={{ 
          top: position.top,
          left: position.left,
          maxHeight: '350px'
        }}
      >
        <div className="p-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-base font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default Panel;
