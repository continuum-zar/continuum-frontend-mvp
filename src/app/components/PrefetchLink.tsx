import React from 'react';
import { NavLink, NavLinkProps } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';

export interface PrefetchLinkProps extends Omit<NavLinkProps, 'to'> {
  to: string;
  onPrefetch?: (queryClient: ReturnType<typeof useQueryClient>) => void;
}

export const PrefetchLink = React.forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  ({ onPrefetch, onMouseEnter, onFocus, ...props }, ref) => {
    const queryClient = useQueryClient();

    const handlePrefetch = () => {
      if (onPrefetch) {
        onPrefetch(queryClient);
      }
    };

    return (
      <NavLink
        {...props}
        ref={ref}
        onMouseEnter={(e) => {
          handlePrefetch();
          onMouseEnter?.(e);
        }}
        onFocus={(e) => {
          handlePrefetch();
          onFocus?.(e);
        }}
      />
    );
  }
);
PrefetchLink.displayName = 'PrefetchLink';
