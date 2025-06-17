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
          path: '/settings/team-management',
          permission: 'settings'
        },
        {
          name: 'Admin Settings',
          path: '/settings/admin',
          permission: 'settings',
          subItems: [
            {
              name: 'Role Settings',
              path: '/admin/role-setting',
              permission: 'settings'
            },
            {
              name: 'Email Templates',
              path: '/admin/email-templates',
              permission: 'settings'
            },
            {
              name: 'Currency',
              path: '/admin/currency',
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
      <div key={item.path || item.name} className={`${level > 0 ? 'ml-4' : ''}`}>
        <div className="flex items-center">
          {item.path ? (
            <Link
              to={item.path}
              className={`flex-1 flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-white dark:bg-primary-600'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.name}</span>
            </Link>
          ) : (
            <div
              className={`flex-1 flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-primary text-white dark:bg-primary-600'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              onClick={() => toggleExpand(item.name)}
            >
              {item.icon}
              <span className="flex-1">{item.name}</span>
            </div>
          )}
          {hasSubItems && (
            <button
              onClick={() => toggleExpand(item.path || item.name)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300"
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
          <div className="mt-1 space-y-1">
            {item.subItems.map((subItem) => renderMenuItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-50 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-3 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Visa CRM</h1>
      </div>
      <nav className="space-y-1">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>
    </div>
  );
};

export default Sidebar;
