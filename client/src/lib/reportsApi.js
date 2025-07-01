// Reports API service
import { apiRequest } from './api';

// Mock data for development/testing (fallback)
const mockRevenueData = [
  {
    id: "APP001",
    clientName: "John Smith",
    country: "USA",
    nationality: "Indian",
    visaType: "Student",
    applicationDate: "2024-01-15",
    paymentDate: "2024-01-20",
    totalCharges: 2500,
    amountReceived: 2000,
    pendingAmount: 500,
    paymentMode: "Bank Transfer",
    bankReference: "REF123456",
    source: "FB"
  },
  {
    id: "APP002",
    clientName: "Sarah Johnson",
    country: "Canada",
    nationality: "Pakistani",
    visaType: "Work",
    applicationDate: "2024-01-18",
    paymentDate: "2024-01-22",
    totalCharges: 3000,
    amountReceived: 3000,
    pendingAmount: 0,
    paymentMode: "Credit Card",
    bankReference: "REF123457",
    source: "Office"
  },
  {
    id: "APP003",
    clientName: "Michael Brown",
    country: "UK",
    nationality: "Nigerian",
    visaType: "Tourist",
    applicationDate: "2024-01-20",
    paymentDate: "2024-01-25",
    totalCharges: 1800,
    amountReceived: 1500,
    pendingAmount: 300,
    paymentMode: "Cash",
    bankReference: "REF123458",
    source: "FB"
  },
  {
    id: "APP004",
    clientName: "Emily Davis",
    country: "Australia",
    nationality: "Ghanaian",
    visaType: "Student",
    applicationDate: "2024-01-22",
    paymentDate: "2024-01-28",
    totalCharges: 2800,
    amountReceived: 2800,
    pendingAmount: 0,
    paymentMode: "Bank Transfer",
    bankReference: "REF123459",
    source: "Office"
  },
  {
    id: "APP005",
    clientName: "David Wilson",
    country: "USA",
    nationality: "Kenyan",
    visaType: "Business",
    applicationDate: "2024-01-25",
    paymentDate: "2024-01-30",
    totalCharges: 3500,
    amountReceived: 2500,
    pendingAmount: 1000,
    paymentMode: "Credit Card",
    bankReference: "REF123460",
    source: "FB"
  }
];

const mockExpensesData = [
  {
    id: 1,
    date: "2024-01-15",
    name: "Office Rent",
    paymentType: "Rent",
    paidTo: "Landlord",
    amount: 5000,
    mode: "Bank Transfer",
    bank: "HBL Bank"
  },
  {
    id: 2,
    date: "2024-01-18",
    name: "Staff Salaries",
    paymentType: "Salary",
    paidTo: "Employees",
    amount: 15000,
    mode: "Bank Transfer",
    bank: "HBL Bank"
  },
  {
    id: 3,
    date: "2024-01-20",
    name: "Marketing Campaign",
    paymentType: "Marketing",
    paidTo: "Facebook Ads",
    amount: 2000,
    mode: "Credit Card",
    bank: "HBL Bank"
  },
  {
    id: 4,
    date: "2024-01-22",
    name: "Office Supplies",
    paymentType: "Supplies",
    paidTo: "Stationery Store",
    amount: 500,
    mode: "Cash",
    bank: "N/A"
  },
  {
    id: 5,
    date: "2024-01-25",
    name: "Internet & Utilities",
    paymentType: "Utilities",
    paidTo: "PTCL",
    amount: 800,
    mode: "Bank Transfer",
    bank: "HBL Bank"
  }
];

// Revenue Reports API
export const getRevenueData = async (filters = {}) => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.visaType && filters.visaType !== 'all') params.append('visaType', filters.visaType);
    if (filters.nationality && filters.nationality !== 'all') params.append('nationality', filters.nationality);
    if (filters.source && filters.source !== 'all') params.append('source', filters.source);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await apiRequest('GET', `/api/reports/revenue?${params.toString()}`);
    
    if (response.success) {
      return response;
    } else {
      throw new Error(response.error || 'Failed to fetch revenue data');
    }
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    // Return mock data as fallback
    return {
      success: true,
      data: mockRevenueData.filter(item => {
        if (filters.visaType && filters.visaType !== 'all' && item.visaType !== filters.visaType) return false;
        if (filters.nationality && filters.nationality !== 'all' && item.nationality !== filters.nationality) return false;
        if (filters.source && filters.source !== 'all' && item.source !== filters.source) return false;
        return true;
      })
    };
  }
};

// Expenses API
export const getExpensesData = async (filters = {}) => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.paymentType && filters.paymentType !== 'all') params.append('paymentType', filters.paymentType);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await apiRequest('GET', `/api/reports/expenses?${params.toString()}`);
    
    if (response.success) {
      return response;
    } else {
      throw new Error(response.error || 'Failed to fetch expenses data');
    }
  } catch (error) {
    console.error('Error fetching expenses data:', error);
    // Return mock data as fallback
    return {
      success: true,
      data: mockExpensesData.filter(item => {
        if (filters.paymentType && filters.paymentType !== 'all' && item.paymentType !== filters.paymentType) return false;
        return true;
      })
    };
  }
};

// Update payment amount
export const updatePaymentAmount = async (applicationId, newAmount) => {
  try {
    const response = await apiRequest('PATCH', `/api/reports/payments/${applicationId}`, {
      amountReceived: newAmount
    });
    
    if (response.success) {
      return response;
    } else {
      throw new Error(response.error || 'Failed to update payment');
    }
  } catch (error) {
    console.error('Error updating payment:', error);
    return {
      success: false,
      error: error.message || 'Failed to update payment'
    };
  }
};

// Get chart data
export const getRevenueChartData = async (filters = {}) => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiRequest('GET', `/api/reports/revenue/chart?${params.toString()}`);
    
    if (response.success) {
      return response;
    } else {
      throw new Error(response.error || 'Failed to fetch revenue chart data');
    }
  } catch (error) {
    console.error('Error fetching revenue chart data:', error);
    // Return mock chart data as fallback
    return {
      success: true,
      data: [
        { month: 'Jan', revenue: 8500, applications: 5 },
        { month: 'Feb', revenue: 12000, applications: 8 },
        { month: 'Mar', revenue: 9500, applications: 6 },
        { month: 'Apr', revenue: 15000, applications: 10 },
        { month: 'May', revenue: 11000, applications: 7 },
        { month: 'Jun', revenue: 18000, applications: 12 }
      ]
    };
  }
};

export const getExpenseChartData = async (filters = {}) => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiRequest('GET', `/api/reports/expenses/chart?${params.toString()}`);
    
    if (response.success) {
      return response;
    } else {
      throw new Error(response.error || 'Failed to fetch expense chart data');
    }
  } catch (error) {
    console.error('Error fetching expense chart data:', error);
    // Return mock chart data as fallback
    return {
      success: true,
      data: [
        { category: 'Rent', amount: 5000, color: '#3B82F6' },
        { category: 'Salary', amount: 15000, color: '#10B981' },
        { category: 'Marketing', amount: 2000, color: '#F59E0B' },
        { category: 'Supplies', amount: 500, color: '#EF4444' },
        { category: 'Utilities', amount: 800, color: '#8B5CF6' }
      ]
    };
  }
};

// Get PNL data
export const getPnlData = async (filters = {}) => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.branch) params.append('branch', filters.branch);
    if (filters.month) params.append('month', filters.month);
    if (filters.year) params.append('year', filters.year);

    const response = await apiRequest('GET', `/api/reports/pnl?${params.toString()}`);
    
    if (response.success) {
      return response;
    } else {
      throw new Error(response.error || 'Failed to fetch PNL data');
    }
  } catch (error) {
    console.error('Error fetching PNL data:', error);
    // Return mock PNL data as fallback
    const mockPnlData = mockRevenueData.map(item => {
      const expenseAmount = Math.random() * 500 + 200;
      const netProfit = item.amountReceived - expenseAmount;
      const profitMargin = ((netProfit / item.amountReceived) * 100);

      return {
        clientName: item.clientName,
        amountReceived: item.amountReceived,
        expenseAmount: expenseAmount,
        netProfit: netProfit,
        profitMargin: profitMargin
      };
    });

    const totalRevenue = mockRevenueData.reduce((sum, item) => sum + item.amountReceived, 0);
    const totalExpenses = mockExpensesData.reduce((sum, item) => sum + item.amount, 0);
    const totalNetProfit = mockPnlData.reduce((sum, item) => sum + item.netProfit, 0);

    return {
      success: true,
      data: {
        pnlData: mockPnlData,
        summary: {
          totalRevenue,
          totalExpenses,
          netProfit: totalNetProfit
        }
      }
    };
  }
};

// Export mock data for direct use in components
export { mockRevenueData, mockExpensesData }; 