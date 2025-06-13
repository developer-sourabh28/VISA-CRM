import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Search, Filter, Plus, Mail, Phone, Calendar } from 'lucide-react';
import { useToast } from './ui/use-toast.js';

const convertEnquiryMutation = useMutation({
  mutationFn: convertEnquiry,
  onSuccess: () => {
    queryClient.invalidateQueries(["/api/enquiries"]);
    queryClient.invalidateQueries(["/api/clients"]);
    toast({
      title: "Success",
      description: "Enquiry converted to client successfully!",
    });
  },
  onError: (error) => {
    toast({
      title: "Error",
      description: error.message || "Conversion failed",
      variant: "destructive",
    });
  },
});

const Enquiries = () => {
  return (
    <div className="p-6 space-y-6 backdrop-blur-md bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Enquiries</h1>
        <div className="flex items-center gap-4">
          <button className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            New Enquiry
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search enquiries..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/40 dark:bg-gray-900/40 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/40 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 hover:bg-gray-50/40 dark:hover:bg-gray-800/40">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enquiries List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Enquiry Card */}
        <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sarah Wilson</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Student Visa Inquiry</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100/40 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full">
                New
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                sarah.wilson@example.com
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                +1 234 567 893
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                Received 2 hours ago
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200/40 dark:border-gray-700/40">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Interested in studying at University of California. Need information about student visa requirements and application process.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Enquiry Card */}
        <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Robert Brown</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Business Visa Inquiry</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100/40 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full">
                In Progress
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                robert.brown@example.com
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                +1 234 567 894
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                Received 1 day ago
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200/40 dark:border-gray-700/40">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Planning to attend a business conference in New York. Need information about business visa requirements and processing time.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Enquiry Card */}
        <Card className="backdrop-blur-md bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Emily Davis</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tourist Visa Inquiry</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-green-100/40 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">
                Responded
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                emily.davis@example.com
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                +1 234 567 895
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                Received 3 days ago
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200/40 dark:border-gray-700/40">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Planning a family vacation to California. Need information about tourist visa requirements and documentation needed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Enquiries; 