import { Card } from '../components/ui/card';
import { UsersIcon, CheckCircleIcon, ClockIcon, CreditCardIcon } from 'lucide-react';

// This component renders a statistic card with icon, title, and value
function StatCard({ title, value, icon, linkText, linkUrl }) {
  // Determine which icon to use
  const getIcon = () => {
    switch (icon) {
      case 'users':
        return <UsersIcon className="h-6 w-6 text-gray-400" />;
      case 'approved':
        return <CheckCircleIcon className="h-6 w-6 text-gray-400" />;
      case 'pending':
        return <ClockIcon className="h-6 w-6 text-gray-400" />;
      case 'revenue':
        return <CreditCardIcon className="h-6 w-6 text-gray-400" />;
      default:
        return <UsersIcon className="h-6 w-6 text-gray-400" />;
    }
  };

  return (
    <Card className="overflow-hidden shadow">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="truncate text-sm font-medium text-gray-500">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <a href={linkUrl} className="font-medium text-primary-600 hover:text-primary-500">
            {linkText}
          </a>
        </div>
      </div>
    </Card>
  );
}

export default StatCard;
