import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../../lib/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
}

const Tooltip = ({ children, content, placement = 'top', delayDuration = 0 }: TooltipProps) => {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={placement}
            sideOffset={5}
            className={cn(
              'z-50 overflow-hidden rounded-md bg-gray-900 dark:bg-gray-700 px-3 py-1.5 text-xs text-white dark:text-gray-50 animate-in fade-in-0 zoom-in-95',
              placement === 'top' && 'slide-in-from-bottom-2',
              placement === 'bottom' && 'slide-in-from-top-2',
              placement === 'left' && 'slide-in-from-right-2',
              placement === 'right' && 'slide-in-from-left-2'
            )}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};

export default Tooltip; 