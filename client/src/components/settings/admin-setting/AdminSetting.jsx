import React from 'react';
import { useLocation } from 'wouter';
import { 
  Mail, 
  Settings, 
  Users, 
  DollarSign, 
  MessageCircle, 
  ShieldCheck, 
  BarChart2,
  CreditCard
} from 'lucide-react';
import BackButton from '../../BackButton';

export default function AdminSettings() {
  const [, setLocation] = useLocation();

  const settings = [
    {
      name: 'Role Setting',
      path: '/admin/role-setting',
      icon: ShieldCheck,
      description: 'Manage user roles and permissions'
    },
    {
      name: 'Email Templates',
      path: '/admin/email-templates',
      icon: Mail,
      description: 'Configure and manage email templates'
    },
    {
      name: 'Currency',
      path: '/admin/currency',
      icon: DollarSign,
      description: 'Set up currency settings and exchange rates'
    },
    {
      name: 'Whatsapp Template',
      path: '/admin/whatsapp-template',
      icon: MessageCircle,
      description: 'Customize WhatsApp notification templates'
    },

    // {
    //   name: 'Invoice Template',
    //   path : '/admin/invoice-template',
    //   icon : MessageCircle,
    //   description : 'Customize WhatsApp notification templates'
    // }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Main content */}
      <div className="relative z-20 p-6 space-y-8">
        <BackButton />
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-yellow-600 rounded-full"></div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Admin Settings
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 ml-5">
              Configure system-wide settings and templates
            </p>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {settings.map((setting) => {
            const IconComponent = setting.icon;
            
            return (
              <div
                key={setting.name}
                onClick={() => setLocation(setting.path)}
                className="group relative overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
                <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                
                <div className="relative p-6 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/10 to-yellow-500/10 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="w-10 h-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-full h-full rounded-full bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {setting.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {setting.description}
                  </p>
                  
                  <div className="mt-auto">
                    <span className="text-amber-600 dark:text-amber-400 text-sm font-medium group-hover:underline">
                      Configure →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
