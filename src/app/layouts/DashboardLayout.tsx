import { Outlet, NavLink, useNavigate } from 'react-router';
import { PrefetchLink } from '../components/PrefetchLink';
import {
  projectKeys,
  fetchProjects,
  fetchProjectDashboard,
  fetchProjectVelocityReport,
  invoiceKeys,
  fetchInvoices,
  userHoursKeys,
  fetchUserHours,
  getCurrentWeekRange,
} from '../../api';
import {
  LayoutDashboard,
  FolderKanban,
  Clock,
  FileText,
  Settings,
  Bell,
  Search,
  LogOut
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { GlobalActiveSession } from '../components/ui/GlobalActiveSession';
import { useAuthStore } from '../../store/authStore';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Time Tracking', href: '/time', icon: Clock },
  { name: 'Invoices', href: '/invoices', icon: FileText },
];
import { useRole } from '../context/RoleContext';
import { ErrorBoundary } from '../ErrorBoundary';

export function DashboardLayout() {
  const navigate = useNavigate();
  const { role: userRole } = useRole();

  // Filter navigation based on role
  const filteredNavigation = navigation.filter((item) => {
    if (userRole === 'Client') {
      return item.name === 'Dashboard';
    }
    return true; // PM and Developer see all
  });

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isLoading = useAuthStore((state) => state.isLoading);

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email
    : '—';
  const initials = user
    ? (user.first_name && user.last_name
        ? `${user.first_name[0]}${user.last_name[0]}`
        : user.email
          ? user.email.slice(0, 2)
          : '?')
    : '?';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Role-based Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center p-1">
              <span className="text-primary-foreground font-semibold text-xs tracking-wider">
                {userRole.split(' ').map((w: string) => w[0]).join('').toUpperCase()}
              </span>
            </div>
            <span className="font-semibold text-base tracking-tight">{userRole}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => (
            <PrefetchLink
              key={item.name}
              to={item.href}
              end={item.href === '/dashboard'}
              onPrefetch={(queryClient) => {
                const uid = user?.id;
                if (item.href === '/projects') {
                  if (uid == null || uid === '') return;
                  void queryClient.prefetchQuery({
                    queryKey: projectKeys.listForUser(uid),
                    queryFn: fetchProjects,
                  });
                } else if (item.href === '/dashboard') {
                  if (uid == null || uid === '') return;
                  void queryClient
                    .prefetchQuery({
                      queryKey: projectKeys.listForUser(uid),
                      queryFn: fetchProjects,
                    })
                    .then(() => {
                      const projects = queryClient.getQueryData<Awaited<ReturnType<typeof fetchProjects>>>(
                        projectKeys.listForUser(uid)
                      );
                      const first = projects?.[0];
                      if (first == null) return;
                      const pid = String(first.id);
                      void queryClient.prefetchQuery({
                        queryKey: ['project-dashboard', pid],
                        queryFn: () => fetchProjectDashboard(pid),
                        staleTime: 2 * 60_000,
                      });
                      void queryClient.prefetchQuery({
                        queryKey: ['velocity-report', pid],
                        queryFn: () => fetchProjectVelocityReport(pid),
                        staleTime: 2 * 60_000,
                      });
                    });
                } else if (item.href === '/invoices') {
                  void queryClient.prefetchQuery({ queryKey: invoiceKeys.all, queryFn: () => fetchInvoices() });
                } else if (item.href === '/time') {
                  const { start, end } = getCurrentWeekRange();
                  void queryClient.prefetchQuery({
                    queryKey: userHoursKeys.range(start, end),
                    queryFn: () => fetchUserHours(start, end),
                  });
                }
              }}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md transition-colors ${isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`
              }
            >
              <item.icon className="h-5 w-5 mr-3" />
              <span>{item.name}</span>
            </PrefetchLink>
          ))}
        </nav>

        {/* Admin Section */}
        <div className="border-t border-border p-3 space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md transition-colors ${isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`
            }
          >
            <Settings className="h-5 w-5 mr-3" />
            <span>Settings</span>
          </NavLink>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={handleLogout}
            disabled={isLoading}
          >
            <LogOut className="h-5 w-5 mr-3" />
            {isLoading ? 'Logging out...' : 'Log out'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects, tasks, clients..."
                className="pl-9 bg-input-background border-input"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <GlobalActiveSession />

            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 px-2 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="uppercase">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{userRole}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Preferences</DropdownMenuItem>
                <DropdownMenuItem>Team</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={isLoading}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoading ? 'Logging out...' : 'Log out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
