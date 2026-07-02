import * as React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'danger';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, children, ...props }, ref) => {
    const variants = {
      default: 'bg-black text-white hover:bg-black hover:text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] hover:shadow-[6px_6px_0px_0px_rgba(220,38,38,1)] hover:-translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(220,38,38,1)] active:translate-y-1',
      outline: 'border-2 border-black bg-white hover:bg-black hover:text-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(220,38,38,1)] hover:-translate-y-0.5 hover:border-red-600 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-y-1',
      ghost: 'hover:bg-zinc-100 text-black border-2 border-transparent hover:border-black',
      link: 'text-black underline-offset-4 hover:underline decoration-red-600 decoration-2 font-bold',
      danger: 'bg-red-600 text-white hover:bg-red-700 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    };

    const sizes = {
      default: 'h-11 px-6 py-2 uppercase tracking-widest font-black',
      sm: 'h-9 px-4 text-xs uppercase tracking-widest font-black',
      lg: 'h-14 px-10 text-lg uppercase tracking-widest font-black',
      icon: 'h-11 w-11 flex items-center justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:translate-y-0',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
