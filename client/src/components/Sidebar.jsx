import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  File,
  HelpCircle,
  Settings,
  DollarSign,
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
      icon: <Users className="w-5 h-5" />,
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
      name: 'Payments',
      path: '/payments',
      icon: <DollarSign className="w-5 h-5" />,
      permission: 'payments'
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
              name: 'Mail Settings',
              path: '/admin/mail-setting',
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
    const isActive = location.pathname === item.path || 
                    (hasSubItems && item.subItems.some(subItem => 
                      location.pathname === subItem.path || 
                      (subItem.subItems && subItem.subItems.some(nestedItem => 
                        location.pathname === nestedItem.path
                      ))
                    ));

    return (
      <div key={item.path || item.name} className={`${level > 0 ? 'ml-4' : ''}`}>
        <div className="flex items-center">
          {item.path ? (
            <Link
              to={item.path}
              className={`flex-1 flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.name}</span>
            </Link>
          ) : (
            <div
              className={`flex-1 flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
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
              className="p-1 hover:bg-gray-100 rounded"
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
    <div className="w-50 h-screen bg-white border-r border-gray-200 p-3 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Visa CRM</h1>
      </div>
      <nav className="space-y-1">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>
    </div>
  );
};

export default Sidebar;
