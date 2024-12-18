import React from 'react';
import { useFloating, offset, shift, flip, arrow } from '@floating-ui/react-dom';

interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
}

const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  placement = 'right'
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const arrowRef = React.useRef(null);

  const {
    x,
    y,
    strategy,
    refs,
    middlewareData: { arrow: { x: arrowX, y: arrowY } = {} },
  } = useFloating({
    placement,
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
  });

  const staticSide = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right',
  }[placement];

  return (
    <>
      {React.cloneElement(children, {
        ref: refs.setReference,
        onMouseEnter: () => setIsOpen(true),
        onMouseLeave: () => setIsOpen(false),
      })}
      {isOpen && (
        <div
          ref={refs.setFloating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            width: 'max-content',
            zIndex: 50,
          }}
        >
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200">
            <div
              ref={arrowRef}
              className="absolute w-2 h-2 bg-white border border-gray-200"
              style={{
                left: arrowX != null ? `${arrowX}px` : '',
                top: arrowY != null ? `${arrowY}px` : '',
                [staticSide]: '-4px',
                transform: 'rotate(45deg)',
                borderTop: placement === 'bottom' ? '1px' : undefined,
                borderLeft: placement === 'right' ? '1px' : undefined,
                borderBottom: placement === 'top' ? '1px' : undefined,
                borderRight: placement === 'left' ? '1px' : undefined,
                zIndex: 0,
              }}
            />
            <div className="relative bg-white rounded-lg p-2 z-10">
              {content}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Tooltip;