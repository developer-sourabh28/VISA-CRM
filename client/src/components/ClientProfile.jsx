  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <span className="text-2xl font-semibold text-primary-600 dark:text-primary-400">
              {client.firstName.charAt(0)}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {client.firstName} {client.lastName}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">{client.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 dark:bg-primary-500 rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{client.phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{client.address || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">City</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{client.city || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">State</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{client.state || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Country</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{client.country || 'Not provided'}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Visa Information</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Visa Type</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{client.visaType || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Destination Country</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{client.destinationCountry || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Travel Date</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {client.travelDate ? new Date(client.travelDate).toLocaleDateString() : 'Not specified'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{client.status || 'Not specified'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div> 