import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  HomeIcon, UsersIcon, FileTextIcon, CalendarIcon, FileIcon,
  ClockIcon, CreditCardIcon, BarChartIcon, SettingsIcon,
  MessageSquareIcon, SquareChartGantt, ClipboardListIcon
} from 'lucide-react';

function Sidebar({ user }) {
  const [location] = useLocation();
  const [showSubSidebar, setShowSubSidebar] = useState(false);
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
    { label: 'Team Management', path: '/settings/team-management' },
    { label: 'Default Setting', path: '/settings/default' },
    { label: 'Admin Settings', path: '/settings/admin' },
    { label: 'Automation', path: '/settings/automation' },
    { label: 'Branch Setting', path: '/settings/branch' },
  ];

  return (
    <>
      {/* Main Sidebar */}
      <aside className={`fixed inset-y-0 md:w-44 shadow-md overflow-y-auto transition-all duration-200`}>
  <div className="flex h-16 items-center px-4">
    <div className="flex items-center space-x-2">
      <div className="h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">V</div>
      <span className="hidden md:inline text-base font-semibold">Visa CRM</span>
    </div>
  </div>

  {/* Navigation */}
  <nav className="mt-4 px-2 space-y-1">
    {navItems.map((item) => (
      <Link
        key={item.path}
        href={item.path}
        className={`flex items-center rounded-md px-2 py-2 text-sm font-medium ${
          location === item.path ? 'sidebar-link active' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <div className="mr-2">{item.icon}</div>
        <span className="hidden md:inline">{item.label}</span>
      </Link>
    ))}
  </nav>

  {/* User Info */}
  {user && (
    <div className="absolute bottom-0 w-full border-t p-4 hidden md:block">
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


      {/* Sub-Sidebar for Settings (Desktop) */}
      {isSettingsPage && (
        <aside className="hidden md:block fixed top-0 left-44 w-56 h-full shadow-inner p-4 z-10" aria-label="Settings Sub-sidebar">
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

      {/* Sub-Sidebar for Settings (Mobile) */}
      {isSettingsPage && showSubSidebar && (
        <div className="fixed top-0 left-56 w-64 h-full bg-black shadow-lg p-4 z-50 md:hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Settings</h2>
            <button onClick={() => setShowSubSidebar(false)} className="text-sm text-gray-500">Close ✖</button>
          </div>
          {settingsSubItems.map((sub) => (
            <Link
              key={sub.path}
              href={sub.path}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                location === sub.path ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setShowSubSidebar(false)}
            >
              {sub.label}
            </Link>
          ))}
        </div>
      )}

      {/* Toggle Button for Sub-sidebar on Mobile */}
      {isSettingsPage && (
        <button
          onClick={() => setShowSubSidebar(true)}
          className="md:hidden fixed bottom-4 left-64 z-50 bg-white border shadow px-4 py-2 text-sm rounded-md"
        >
          Settings Menu
        </button>
      )}
    </>
  );
}

export default Sidebar;
