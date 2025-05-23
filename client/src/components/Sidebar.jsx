import { Link, useLocation } from 'wouter';
import {
  HomeIcon, UsersIcon, FileTextIcon, CalendarIcon, FileIcon,
  ClockIcon, CreditCardIcon, BarChartIcon, SettingsIcon,
  MessageSquareIcon, SquareChartGantt, ClipboardListIcon
} from 'lucide-react';

function Sidebar({ user }) {
  const [location] = useLocation();
  // Match all /settings and its subroutes
  const isSettingsPage = location.startsWith('/settings');

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <HomeIcon className="h-5 w-5" /> },
    { path: '/enquiries', label: 'Enquiries', icon: <MessageSquareIcon className="h-5 w-5" /> },
    { path: '/clients', label: 'Clients', icon: <UsersIcon className="h-5 w-5" /> },
    { path: '/visaApplicationTracker', label: 'Visa Tracker', icon: <ClipboardListIcon className="h-5 w-5" /> },
    { path: '/agreements', label: 'Agreements', icon: <FileTextIcon className="h-5 w-5" /> },
    { path: '/appointments', label: 'Appointments', icon: <CalendarIcon className="h-5 w-5" /> },
    { path: '/deadlines', label: 'Deadlines', icon: <SquareChartGantt className="h-5 w-5" /> },
    { path: '/documents', label: 'Documents', icon: <FileIcon className="h-5 w-5" /> },
    { path: '/tasks', label: 'Tasks', icon: <ClockIcon className="h-5 w-5" /> },
    { path: '/payments', label: 'Payments', icon: <CreditCardIcon className="h-5 w-5" /> },
    { path: '/financialDashboard', label: 'Reports', icon: <BarChartIcon className="h-5 w-5" /> },
    { path: '/settings', label: 'Settings', icon: <SettingsIcon className="h-5 w-5" /> },
  ];

  const settingsSubItems = [
    { label: 'Team Management', path: '/settings/team' },
    { label: 'Default Setting', path: '/settings/default' },
    { label: 'Admin Settings', path: '/settings/admin' },
    { label: 'Automation', path: '/settings/automation' },
    { label: 'Branch Setting', path: '/settings/branch' },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-10 ${isSettingsPage ? "w-80" : "w-64"} bg-sidebar-background shadow-md overflow-y-auto md:block transition-all duration-200`}>
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">V</div>
          {/* Hide text when in settings */}
          {!isSettingsPage && <span className="text-lg font-semibold">Visa CRM</span>}
        </div>
      </div>

      {/* Main navigation */}
      {!isSettingsPage && (
        <nav className="mt-4 px-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                location === item.path ? 'sidebar-link active' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="mr-3">{item.icon}</div>
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      {/* Icon-only sidebar for settings and its subroutes */}
      {isSettingsPage && (
        <nav className="mt-4 flex flex-col items-center space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex justify-center items-center w-12 h-12 rounded-md ${
                location.startsWith(item.path) ? 'bg-gray-200' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={item.label}
            >
              {item.icon}
            </Link>
          ))}
        </nav>
      )}

      {/* Settings sub-sidebar for settings and its subroutes */}
      {isSettingsPage && (
        <aside className="absolute left-16 top-0 bottom-0 w-64 bg-gray-50 shadow-inner p-4">
          <h2 className="text-lg font-semibold mb-4">Settings</h2>
          {settingsSubItems.map((sub) => (
            <Link
              key={sub.path}
              href={sub.path}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                location === sub.path ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {sub.label}
            </Link>
          ))}
        </aside>
      )}

      {/* User Info */}
      {user && !isSettingsPage && (
        <div className="absolute bottom-0 w-full border-t p-4">
          <div className="flex items-center">
            <img
              className="h-8 w-8 rounded-full"
              src={user.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e"}
              alt={`${user.firstName} ${user.lastName}`}
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user.firstName} {user.lastName}</p>
              <p className="text-xs font-medium text-gray-500">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
