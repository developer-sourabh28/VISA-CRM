import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  HomeIcon, UsersIcon, FileTextIcon, CalendarIcon, ClockIcon,
  CreditCardIcon, BarChartIcon, SettingsIcon, MessageSquareIcon,
  SquareChartGantt, BellIcon, ZapIcon, Building2Icon, SlidersHorizontalIcon, ShieldCheckIcon
} from 'lucide-react';

function Sidebar({ user }) {
  const [location] = useLocation();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [openTooltip, setOpenTooltip] = useState(null);

  useEffect(() => {
    if (location.startsWith('/settings')) {
      setShowSettingsDropdown(true);
    }
  }, [location]);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <HomeIcon className="h-5 w-5" /> },
    { path: '/enquiries', label: 'Enquiries', icon: <MessageSquareIcon className="h-5 w-5" /> },
    { path: '/clients', label: 'Clients', icon: <UsersIcon className="h-5 w-5" /> },
    { path: '/agreements', label: 'Agreements', icon: <FileTextIcon className="h-5 w-5" /> },
    { path: '/appointments', label: 'Appointments', icon: <CalendarIcon className="h-5 w-5" /> },
    { path: '/deadlines', label: 'Deadlines', icon: <SquareChartGantt className="h-5 w-5" /> },
    { path: '/reminders', label: 'Reminders', icon: <BellIcon className="h-5 w-5" /> },
    { path: '/tasks', label: 'Tasks', icon: <ClockIcon className="h-5 w-5" /> },
    { path: '/payments', label: 'Payments', icon: <CreditCardIcon className="h-5 w-5" /> },
    { path: '/financialDashboard', label: 'Reports', icon: <BarChartIcon className="h-5 w-5" /> }
  ];

  const settingsSubItems = [
    { label: 'Team Management', path: '/settings/team-management', icon: <UsersIcon className="h-5 w-5" /> },
    { label: 'Default Setting', path: '/settings/default', icon: <SlidersHorizontalIcon className="h-5 w-5" /> },
    { label: 'Admin Settings', path: '/settings/admin', icon: <ShieldCheckIcon className="h-5 w-5" /> },
    { label: 'Automation', path: '/settings/automation', icon: <ZapIcon className="h-5 w-5" /> },
    { label: 'Branch Setting', path: '/settings/branch', icon: <Building2Icon className="h-5 w-5" /> },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 w-16 md:w-48 bg-white dark:bg-gray-900 shadow-md overflow-visible z-30 flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center md:justify-start px-2 md:px-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">V</div>
          <span className="hidden md:inline text-base font-semibold">Visa CRM</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex-1 px-1 md:px-2 space-y-1">
        {navItems.map(item => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center justify-center md:justify-start rounded-md px-2 py-2 text-sm font-medium transition ${
              location === item.path
                ? 'bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-white'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            <div className="mr-0 md:mr-2">{item.icon}</div>
            <span className="hidden md:inline">{item.label}</span>
          </Link>
        ))}

        {/* Settings with Dropdown */}
        <div className="space-y-1">
          <button
            onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
            className={`w-full flex items-center justify-center md:justify-start rounded-md px-2 py-2 text-sm font-medium transition ${
              location.startsWith('/settings')
                ? 'bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-white'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            <SettingsIcon className="h-5 w-5 mr-0 md:mr-2" />
            <span className="hidden md:inline">Settings</span>
            <svg
              className={`ml-auto hidden md:block h-4 w-4 transform transition-transform ${
                showSettingsDropdown ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showSettingsDropdown && (
            <div className="pl-2 md:pl-6">
              {settingsSubItems.map((sub, idx) => (
                <Link
                  key={sub.path}
                  href={sub.path}
                  className={`group relative flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium transition ${
                    location === sub.path
                      ? 'bg-blue-200 text-blue-900 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                  onTouchStart={() => setOpenTooltip(idx)}
                  onMouseEnter={() => setOpenTooltip(idx)}
                  onMouseLeave={() => setOpenTooltip(null)}
                  onBlur={() => setOpenTooltip(null)}
                  tabIndex={0}
                >
                  <span className="inline">{sub.icon}</span>
                  <span className="hidden md:inline">{sub.label}</span>
                  {/* Tooltip: now visible and working */}
                  <span
                    className={`absolute left-full ml-2 z-20 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-gray-900 text-white px-2 py-1 text-xs shadow-lg
                      ${openTooltip === idx ? 'opacity-100' : 'opacity-0'}
                      group-hover:opacity-100 transition-opacity md:hidden`}
                  >
                    {sub.label}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* User Info */}
      {user && (
        <div className="hidden md:block absolute bottom-0 w-full border-t p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center">
            <img
              className="h-8 w-8 rounded-full"
              src={user.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e"}
              alt={`${user.firstName} ${user.lastName}`}
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.firstName} {user.lastName}</p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
