import { UsersIcon, CheckCircleIcon, ClockIcon, CreditCardIcon } from "lucide-react";
import { Link } from "wouter";

function StatCard({ title, value, icon, linkText, linkUrl, subtitle, className }) {
  const getIcon = () => {
    switch (icon) {
      case "users":
        return <UsersIcon className="h-6 w-6 text-primary dark:text-primary-400" />;
      case "approved":
        return <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />;
      case "pending":
        return <ClockIcon className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />;
      case "revenue":
        return <CreditCardIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />;
      default:
        return <UsersIcon className="h-6 w-6 text-primary dark:text-primary-400" />;
    }
  };

  return (
    <div className={`rounded-2xl backdrop-blur-md bg-white/40 dark:bg-gray-800/40 shadow-lg border border-white/30 dark:border-gray-700/30 hover:shadow-xl transition-all duration-300 ${className}`}>
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-4 w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{value}</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-3 rounded-b-2xl text-sm border-t border-gray-200 dark:border-gray-700">
        {linkUrl && (
          <Link href={linkUrl} className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition">
            {linkText}
          </Link>
        )}
      </div>
    </div>
  );
}

export default StatCard;
