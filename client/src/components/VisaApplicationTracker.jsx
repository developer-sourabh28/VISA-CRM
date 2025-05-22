import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function VisaApplicationTracker() {
  const [expandedItem, setExpandedItem] = useState(0);

  const steps = [
    { 
      id: 1, 
      title: "Send Agreement", 
      status: "IN PROGRESS" 
    },
    { 
      id: 2, 
      title: "Schedule Meeting", 
      status: "NOT STARTED" 
    },
    { 
      id: 3, 
      title: "Upload Documents", 
      status: "NOT STARTED" 
    },
    { 
      id: 4, 
      title: "Payment Collection", 
      status: "NOT STARTED" 
    },
    { 
      id: 5, 
      title: "Appointment Booking", 
      status: "NOT STARTED" 
    },
    { 
      id: 6, 
      title: "Final Submission", 
      status: "NOT STARTED" 
    }
  ];

  const handleToggle = (index) => {
    setExpandedItem(expandedItem === index ? -1 : index);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-800">Visa Application Process</h1>
        <p className="text-sm text-gray-600 mb-6">Track and manage visa application steps</p>

        {/* Progress bar */}
        <div className="relative mb-8">
          <div className="h-2 bg-gray-200 rounded-full w-full"></div>
          <div className="h-2 bg-blue-500 rounded-full absolute top-0 left-0" style={{ width: '16.67%' }}></div>
          
          {/* Step indicators */}
          <div className="flex justify-between -mt-1">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center mt-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${index === 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {step.id}
                </div>
                <span className="text-xs mt-1 text-gray-600">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps detail */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className="bg-white rounded-md shadow-sm overflow-hidden"
            >
              <div 
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => handleToggle(index)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${index === 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {step.id}
                  </div>
                  <span className="font-medium">{step.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs rounded px-2 py-1 ${
                    step.status === "IN PROGRESS" 
                      ? "bg-orange-100 text-orange-600" 
                      : "bg-gray-200 text-gray-700"
                  }`}>
                    {step.status}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedItem === index ? 'transform rotate-180' : ''}`} />
                </div>
              </div>
              {expandedItem === index && (
                <div className="p-4 border-t border-gray-100">
                  <p className="text-gray-600 text-sm">
                    Content for {step.title} step goes here. This area can be expanded to show detailed information and actions related to this step.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}