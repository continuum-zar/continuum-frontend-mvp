/**
 * Paths where the legacy time page or dashboard-placeholder time logs
 * should own the full time UI (context activation, hide global session chip).
 */
export function isTimeTrackingRoutePath(pathname: string): boolean {
  return (
    pathname === '/time' ||
    pathname.startsWith('/dashboard-placeholder/get-started/time-logs')
  );
}
