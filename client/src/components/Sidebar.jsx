import { Link, useLocation } from 'wouter';
import { 
  HomeIcon, 
  UsersIcon, 
  FileTextIcon, 
  CalendarIcon, 
  FileIcon, 
  ClockIcon, 
  CreditCardIcon, 
  BarChartIcon, 
  SettingsIcon,
  MessageSquareIcon
} from 'lucide-react';

function Sidebar({ user }) {
  const [location] = useLocation();

  // Array of sidebar navigation items with their properties
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <HomeIcon className="h-5 w-5 mr-3" /> },
    { path: '/clients', label: 'Clients', icon: <UsersIcon className="h-5 w-5 mr-3" /> },
    { path: '/enquiries', label: 'Enquiries', icon: <MessageSquareIcon className="h-5 w-5 mr-3" /> },
    { path: '/agreements', label: 'Agreements', icon: <FileTextIcon className="h-5 w-5 mr-3" /> },
    { path: '/appointments', label: 'Appointments', icon: <CalendarIcon className="h-5 w-5 mr-3" /> },
    { path: '/documents', label: 'Documents', icon: <FileIcon className="h-5 w-5 mr-3" /> },
    { path: '/tasks', label: 'Tasks', icon: <ClockIcon className="h-5 w-5 mr-3" /> },
    { path: '/payments', label: 'Payments', icon: <CreditCardIcon className="h-5 w-5 mr-3" /> },
    { path: '/reports', label: 'Reports', icon: <BarChartIcon className="h-5 w-5 mr-3" /> },
    { path: '/settings', label: 'Settings', icon: <SettingsIcon className="h-5 w-5 mr-3" /> },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 overflow-y-auto bg-white shadow-md md:block">
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
            V
          </div>
          <span className="text-lg font-semibold">Visa CRM</span>
        </div>
      </div>
      
      <nav className="mt-4 px-2">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                location === item.path
                  ? 'sidebar-link active'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      
      {user && (
        <div className="absolute bottom-0 w-full border-t p-4">
          <div className="flex items-center">
            <img
              className="h-8 w-8 rounded-full"
              src={user.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
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
