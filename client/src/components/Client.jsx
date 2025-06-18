import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Search, Filter, Plus } from 'lucide-react';

const Clients = () => {
  const navigate = useNavigate();

  const handleAddNewClient = () => {
    navigate('/clients/new');
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background */}
      {/* <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-amber-400/15 to-yellow-400/15 dark:from-amber-400/8 dark:to-yellow-400/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 dark:from-yellow-400/10 dark:to-orange-400/10 rounded-full blur-3xl animate-pulse [animation-delay:1000ms]"></div>
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-gradient-to-r from-orange-400/20 to-amber-400/20 dark:from-orange-400/10 dark:to-amber-400/10 rounded-full blur-3xl animate-pulse [animation-delay:2000ms]"></div>
      </div> */}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Clients</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleAddNewClient}
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Client
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700">
        <CardContent className="p-4 ">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
        {/* Client Card */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">John Doe</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">john.doe@example.com</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-400 rounded-full">
                Active
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium mr-2">Phone:</span>
                +1 234 567 890
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium mr-2">Visa Type:</span>
                Tourist
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium mr-2">Status:</span>
                Application Submitted
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Card */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Jane Smith</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">jane.smith@example.com</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-400 rounded-full">
                Pending
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium mr-2">Phone:</span>
                +1 234 567 891
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium mr-2">Visa Type:</span>
                Business
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium mr-2">Status:</span>
                Document Collection
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Card */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mike Johnson</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">mike.johnson@example.com</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-400 rounded-full">
                In Progress
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium mr-2">Phone:</span>
                +1 234 567 892
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium mr-2">Visa Type:</span>
                Student
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium mr-2">Status:</span>
                Interview Scheduled
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Clients; 