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
  LogOut,
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { user, hasPermission } = useUser();
  const [expandedItems, setExpandedItems] = useState({});

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
      <div key={item.path || item.name} className={`${level > 0 ? 'ml-4' : ''} mb-1`}>
        <div className="flex items-center">
          {item.path ? (
            <Link
              to={item.path}
              className={`flex-1 flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-gray-700/60 hover:shadow-sm'
              }`}
            >
              <div className={`${isActive ? 'text-white' : 'text-amber-500 dark:text-amber-400'}`}>
                {item.icon}
              </div>
              <span className="flex-1 font-medium">{item.name}</span>
            </Link>
          ) : (
            <div
              className={`flex-1 flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-gray-700/60 hover:shadow-sm'
              }`}
              onClick={() => toggleExpand(item.name)}
            >
              <div className={`${isActive ? 'text-white' : 'text-amber-500 dark:text-amber-400'}`}>
                {item.icon}
              </div>
              <span className="flex-1 font-medium">{item.name}</span>
            </div>
          )}
          {hasSubItems && (
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
        {hasSubItems && isExpanded && (
          <div className="mt-1 space-y-1 pl-2 border-l-2 border-amber-200 dark:border-amber-800/60 ml-4">
            {item.subItems.map((subItem) => renderMenuItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-60 h-screen bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-800/60 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 p-4 overflow-y-auto shadow-md">
      <div className="mb-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">Visa CRM</h1>
          <div className="h-1 w-20 mx-auto mt-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500"></div>
        </div>
      </div>
      
      {user && (
        <div className="mb-6 p-3 bg-white/40 dark:bg-gray-700/40 rounded-lg backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white font-bold">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name || 'User'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.role || 'Role'}</p>
            </div>
          </div>
        </div>
      )}
      
      <nav className="space-y-1">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>
      
      <div className="mt-8 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <a 
          href="/logout" 
          className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-gray-700/60 transition-all duration-300"
        >
          <LogOut className="w-5 h-5 text-red-500" />
          <span className="font-medium">Logout</span>
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
