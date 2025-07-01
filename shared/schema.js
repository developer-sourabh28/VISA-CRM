const userRoles = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  OPERATION_EXECUTIVE: 'OPERATION_EXECUTIVE',
  SALES_EXECUTIVE: 'SALES_EXECUTIVE'
};

// Visa status
const visaStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};

// Document status
const documentStatus = {
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED'
};

// Payment status
const paymentStatus = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  COMPLETED: 'COMPLETED',
  REFUNDED: 'REFUNDED'
};

module.exports = { userRoles, visaStatus, documentStatus, paymentStatus };