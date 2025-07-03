# Role-Based Permission System

This document outlines how to use the role-based permission system in the VISA-CRM application.

## Overview

The system allows admins to:
1. Create and manage roles with specific permissions
2. Assign roles to team members
3. Control access to modules based on role permissions

## Role Management

### Creating Roles

1. Navigate to `/admin/role-setting`
2. Click "Add New Role"
3. Fill in role details:
   - **Name**: Name of the role (e.g., "Sales Executive")
   - **Description**: Brief description of the role

4. Configure permissions:
   - **Dashboard Components**: Select which dashboard widgets/components this role can see
   - **Module Permissions**: For each module, select one of:
     - **No Access**: Cannot access the module
     - **Only See (View)**: Can view but not modify data
     - **See and Edit (Full Access)**: Can view and modify data

5. Click "Add Role" to save

### Editing Roles

1. Click the edit icon next to a role
2. Modify permissions as needed
3. Click "Update Role" to save changes

## Team Management

### Assigning Roles to Users

1. Navigate to `/settings/team-management`
2. When creating or editing a team member, select a role from the dropdown
3. The team member will inherit all permissions from the selected role

## Technical Implementation

### Permission Structure

Roles store permissions in the following format:

```json
{
  "roleName": "Sales Executive",
  "permissions": {
    "dashboard": {
      "components": ["summaryCard", "chartBox", "leadStats"]
    },
    "enquiries": ["view", "edit"],
    "clients": ["view"],
    "appointments": ["view", "edit"],
    ...
  }
}
```

### Checking Permissions in Code

Use the auth context to check permissions:

```jsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { hasPermission, canViewDashboardComponent } = useAuth();
  
  // Check if user can view the clients module
  const canViewClients = hasPermission('clients', 'view');
  
  // Check if user can edit in the enquiries module
  const canEditEnquiries = hasPermission('enquiries', 'edit');
  
  // Check if user can see a specific dashboard component
  const canViewLeadStats = canViewDashboardComponent('leadStats');
  
  return (
    <div>
      {canViewClients && <ClientsList />}
      {canEditEnquiries && <EditEnquiryButton />}
      {canViewLeadStats && <LeadStatsWidget />}
    </div>
  );
}
```

### Server-Side Permission Checks

Use the `hasModulePermission` middleware:

```js
import { hasModulePermission } from '../middleware/auth.js';

// Protect routes that require view access to clients
router.get('/clients', hasModulePermission('clients', 'view'), clientController.getAll);

// Protect routes that require edit access to clients
router.post('/clients', hasModulePermission('clients', 'edit'), clientController.create);
```

## Migration Considerations

- Existing users will maintain their current permissions
- New users should be assigned roles
- A migration script can be created to transition all users to the role-based system

## Best Practices

1. Create roles based on job functions
2. Use the principle of least privilege
3. Regularly review and update role permissions
4. Test permissions thoroughly after changes 