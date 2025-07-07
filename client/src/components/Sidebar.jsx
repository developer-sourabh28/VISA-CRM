import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useUser } from '../context/UserContext';
import {
  LayoutDashboard,
  Users as UsersIcon,
  FileText,
  Calendar,
  File,
  HelpCircle,
  Settings,
  NotepadText,
  Clock,
  Mail,
  Building2,
  Plane,
  Globe,
  Bell,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Menu,
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { user, hasPermission } = useUser();
  const [expandedItems, setExpandedItems] = useState({});
  const [collapsed, setCollapsed] = useState(true); // Start collapsed for demo

  const toggleExpand = (path) => {
    setExpandedItems(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      permission: 'dashboard'
    },
    {
      name: 'Enquiries',
      path: '/enquiries',
      icon: <HelpCircle className="w-5 h-5" />,
      permission: 'enquiries'
    },
    {
      name: 'Clients',
      path: '/clients',
      icon: <UsersIcon className="w-5 h-5" />,
      permission: 'clients'
    },
    {
      name: 'Appointments',
      path: '/appointments',
      icon: <Calendar className="w-5 h-5" />,
      permission: 'appointments'
    },
    {
      name: 'Deadlines',
      path: '/deadlines',
      icon: <Clock className="w-5 h-5" />,
      permission: 'deadlines'
    },
    {
      name: 'Quick Invoice',
      path: '/payments',
      icon: <NotepadText className="w-5 h-5" />,
      permission: 'payments',
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: <FileText className="w-5 h-5" />,
      permission: 'reports'
    },
    {
      name: 'Reminders',
      path: '/reminders',
      icon: <Bell className="w-5 h-5" />,
      permission: 'reminder'
    },
    {
      name: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      permission: 'settings',
      subItems: [
        {
          name: 'Team Management',
          path: '/team-management',
          permission: 'settings'
        },
        {
          name: 'Admin Settings',
          path: '/settings',
          permission: 'settings',
          subItems: [
            {
              name: 'Role Settings',
              path: '/role-management',
              permission: 'settings'
            },
            {
              name: 'Email Templates',
              path: '/email-templates',
              permission: 'settings'
            },
            {
              name: 'Currency',
              path: '/currency',
              permission: 'settings'
            },
            {
              name: 'WhatsApp Templates',
              path: '/whatsapp-templates',
              permission: 'settings'
            }
          ]
        }
      ]
    }
  ];

  const renderMenuItem = (item, level = 0) => {
    if (!hasPermission(item.permission)) return null;

    const isExpanded = expandedItems[item.path || item.name];
    const hasSubItems = item.subItems && item.subItems.length > 0;

    const checkSubItems = (subItems) => {
      if (!subItems) return false;
      return subItems.some(subItem => {
        if (location.pathname === subItem.path) return true;
        if (subItem.subItems) return checkSubItems(subItem.subItems);
        return false;
      });
    };

    const isActive = Boolean(
      (item.path && location.pathname === item.path) ||
      (hasSubItems && checkSubItems(item.subItems))
    );

    return (
      <div key={item.path || item.name} className={`${level > 0 ? (collapsed ? 'ml-2' : 'ml-4') : ''} mb-1`}>
        <div className="flex items-center">
          {item.path ? (
            <Link
              to={item.path}
              className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-gray-700/60 hover:shadow-sm'
              }`}
            >
              <div className={`${isActive ? 'text-white' : 'text-amber-500 dark:text-amber-400'}`}>
                {item.icon}
              </div>
              {!collapsed && <span className="flex-1 font-medium">{item.name}</span>}
            </Link>
          ) : (
            <div
              className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-gray-700/60 hover:shadow-sm'
              }`}
              onClick={() => toggleExpand(item.name)}
            >
              <div className={`${isActive ? 'text-white' : 'text-amber-500 dark:text-amber-400'}`}>
                {item.icon}
              </div>
              {!collapsed && <span className="flex-1 font-medium">{item.name}</span>}
            </div>
          )}
          {hasSubItems && !collapsed && (
            <button
              onClick={() => toggleExpand(item.path || item.name)}
              className={`p-1 ml-1 rounded-full transition-all duration-300 ${
                isActive
                  ? 'text-white hover:bg-white/20'
                  : 'text-gray-500 hover:bg-gray-100/60 dark:text-gray-400 dark:hover:bg-gray-700/60'
              }`}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        {hasSubItems && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1 pl-2 border-l-2 border-amber-200 dark:border-amber-800/60 ml-4">
            {item.subItems.map((subItem) => renderMenuItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // ...existing code...
return (
  <div
    className={`h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-3 overflow-y-auto shadow-md transition-all duration-300
    ${collapsed ? 'w-16 min-w-0' : 'w-60'}`}
  >
    <div className="mb-8 flex items-center justify-between">
      <div className="text-center flex-1">
        <h1 className={`text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent transition-all duration-300 ${collapsed ? 'scale-0 opacity-0 w-0 h-0' : ''}`}>
          Visa CRM
        </h1>
        {!collapsed && <div className="h-1 w-20 mx-auto mt-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500"></div>}
      </div>
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="ml-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </div>

    <nav className="space-y-1">
      {menuItems.map(item => renderMenuItem(item))}
    </nav>

    <div className={`mt-8 pt-4 border-t border-gray-200 dark:border-gray-800 ${collapsed ? 'flex justify-center' : ''}`}>
      <a
        href="/logout"
        className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-all duration-300`}
      >
        <LogOut className="w-5 h-5 text-red-500" />
        {!collapsed && <span className="font-medium">Logout</span>}
      </a>
    </div>
  </div>
);
// ...existing code...
};

export default Sidebar;