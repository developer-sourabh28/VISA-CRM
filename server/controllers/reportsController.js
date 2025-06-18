import Payment from '../models/Payment.js';
import Client from '../models/Client.js';
import Enquiry from '../models/Enquiry.js';
import mongoose from 'mongoose';

// Get Revenue Report Data
export const getRevenueData = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      visaType, 
      nationality, 
      source,
      page = 1,
      limit = 50
    } = req.query;

    // Build aggregation pipeline
    const pipeline = [];

    // Match stage for filters
    const matchStage = {};

    // Date filter
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Add payment status filter to only include completed payments
    matchStage.status = { $in: ['Completed', 'Partial'] };

    pipeline.push({ $match: matchStage });

    // Lookup client information
    pipeline.push({
      $lookup: {
        from: 'clients',
        localField: 'clientId',
        foreignField: '_id',
        as: 'client'
      }
    });

    // Unwind client array
    pipeline.push({ $unwind: '$client' });

    // Add client-based filters
    const clientMatchStage = {};
    
    if (visaType && visaType !== 'all') {
      clientMatchStage['client.visaType'] = visaType;
    }
    
    if (nationality && nationality !== 'all') {
      clientMatchStage['client.nationality'] = nationality;
    }

    if (Object.keys(clientMatchStage).length > 0) {
      pipeline.push({ $match: clientMatchStage });
    }

    // Lookup enquiry information for source
    pipeline.push({
      $lookup: {
        from: 'enquiries',
        localField: 'clientId',
        foreignField: 'email',
        as: 'enquiry'
      }
    });

    // Add source filter
    if (source && source !== 'all') {
      if (source === 'FB') {
        pipeline.push({
          $match: {
            $or: [
              { 'enquiry.enquirySource': 'Social Media' },
              { 'enquiry.facebookLeadId': { $exists: true, $ne: null } }
            ]
          }
        });
      } else if (source === 'Office') {
        pipeline.push({
          $match: {
            $and: [
              { 'enquiry.enquirySource': { $ne: 'Social Media' } },
              { 'enquiry.facebookLeadId': { $exists: false } }
            ]
          }
        });
      }
    }

    // Project the required fields
    pipeline.push({
      $project: {
        id: '$_id',
        clientName: {
          $concat: ['$client.firstName', ' ', '$client.lastName']
        },
        country: '$client.nationality', // Using nationality as country for now
        nationality: '$client.nationality',
        visaType: '$client.visaType',
        applicationDate: '$createdAt',
        paymentDate: '$paymentDate',
        totalCharges: '$amount',
        amountReceived: {
          $cond: {
            if: { $eq: ['$status', 'Partial'] },
            then: { $sum: '$installments.installmentHistory.amount' },
            else: '$amount'
          }
        },
        pendingAmount: {
          $cond: {
            if: { $eq: ['$status', 'Partial'] },
            then: { $subtract: ['$amount', { $sum: '$installments.installmentHistory.amount' }] },
            else: 0
          }
        },
        paymentMode: '$method',
        bankReference: '$receiptNumber',
        source: {
          $cond: {
            if: { $or: [
              { $eq: ['$enquiry.enquirySource', 'Social Media'] },
              { $ne: ['$enquiry.facebookLeadId', null] }
            ]},
            then: 'FB',
            else: 'Office'
          }
        }
      }
    });

    // Sort by date
    pipeline.push({ $sort: { applicationDate: -1 } });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const revenueData = await Payment.aggregate(pipeline);

    // Get total count for pagination
    const countPipeline = [...pipeline.slice(0, -2)]; // Remove skip and limit
    countPipeline.push({ $count: 'total' });
    const countResult = await Payment.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    res.json({
      success: true,
      data: revenueData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get Revenue Chart Data
export const getRevenueChartData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {
      status: { $in: ['Completed', 'Partial'] }
    };

    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          applications: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $cond: { if: { $lt: ['$_id.month', 10] }, then: '0', else: '' } },
              { $toString: '$_id.month' }
            ]
          },
          revenue: 1,
          applications: 1
        }
      },
      { $sort: { month: 1 } }
    ];

    const chartData = await Payment.aggregate(pipeline);

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('Error fetching revenue chart data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get Expenses Data
export const getExpensesData = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      paymentType,
      page = 1,
      limit = 50
    } = req.query;

    // For now, we'll use payments as expenses since there's no separate expense model
    // In a real scenario, you'd have a separate Expense model
    const matchStage = {
      serviceType: { $in: ['Document Processing', 'Consultation', 'Embassy Fee', 'Other'] }
    };

    if (startDate && endDate) {
      matchStage.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (paymentType && paymentType !== 'all') {
      matchStage.serviceType = paymentType;
    }

    const expenses = await Payment.find(matchStage)
      .populate('recordedBy', 'name email')
      .sort({ date: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(matchStage);

    // Transform data to match the expected format
    const expensesData = expenses.map(expense => ({
      id: expense._id,
      date: expense.date,
      name: expense.description || expense.serviceType,
      paymentType: expense.serviceType,
      paidTo: expense.recordedBy?.name || 'N/A',
      amount: expense.amount,
      mode: expense.method,
      bank: expense.receiptNumber || 'N/A'
    }));

    res.json({
      success: true,
      data: expensesData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching expenses data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get Expense Chart Data
export const getExpenseChartData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {
      serviceType: { $in: ['Document Processing', 'Consultation', 'Embassy Fee', 'Other'] }
    };

    if (startDate && endDate) {
      matchStage.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$serviceType',
          amount: { $sum: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          amount: 1
        }
      },
      { $sort: { amount: -1 } }
    ];

    const chartData = await Payment.aggregate(pipeline);

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('Error fetching expense chart data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get Profit & Loss Data
export const getPnlData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get revenue data
    const revenueMatch = { ...matchStage, status: { $in: ['Completed', 'Partial'] } };
    const revenueData = await Payment.aggregate([
      { $match: revenueMatch },
      {
        $lookup: {
          from: 'clients',
          localField: 'clientId',
          foreignField: '_id',
          as: 'client'
        }
      },
      { $unwind: '$client' },
      {
        $project: {
          clientName: {
            $concat: ['$client.firstName', ' ', '$client.lastName']
          },
          amountReceived: {
            $cond: {
              if: { $eq: ['$status', 'Partial'] },
              then: { $sum: '$installments.installmentHistory.amount' },
              else: '$amount'
            }
          },
          totalCharges: '$amount'
        }
      }
    ]);

    // Get expenses data (using payments as expenses for now)
    const expenseMatch = { 
      ...matchStage, 
      serviceType: { $in: ['Document Processing', 'Consultation', 'Embassy Fee', 'Other'] }
    };
    const expensesData = await Payment.aggregate([
      { $match: expenseMatch },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' }
        }
      }
    ]);

    const totalExpenses = expensesData.length > 0 ? expensesData[0].totalExpenses : 0;

    // Calculate PNL for each client
    const pnlData = revenueData.map(item => {
      // Mock expense allocation (in real scenario, this would be calculated based on actual expense allocation)
      const expenseAmount = Math.random() * 500 + 200; // Random expense between 200-700
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

    // Calculate totals
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.amountReceived, 0);
    const totalNetProfit = pnlData.reduce((sum, item) => sum + item.netProfit, 0);

    res.json({
      success: true,
      data: {
        pnlData,
        summary: {
          totalRevenue,
          totalExpenses,
          netProfit: totalNetProfit
        }
      }
    });
  } catch (error) {
    console.error('Error fetching PNL data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update Payment Amount (for partial payments)
export const updatePaymentAmount = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountReceived } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Update payment amount
    payment.amount = amountReceived;
    payment.status = amountReceived >= payment.amount ? 'Completed' : 'Partial';
    
    // Update installment history if it's a partial payment
    if (payment.paymentType === 'Partial Payment' && payment.installments) {
      const currentInstallment = payment.installments.currentInstallment;
      const installmentHistory = payment.installments.installmentHistory || [];
      
      // Find or create current installment record
      let currentRecord = installmentHistory.find(h => h.installmentNumber === currentInstallment);
      if (!currentRecord) {
        currentRecord = {
          installmentNumber: currentInstallment,
          amount: 0,
          dueDate: payment.installments.nextInstallmentDate,
          paidDate: new Date(),
          status: 'Completed'
        };
        installmentHistory.push(currentRecord);
      }
      
      currentRecord.amount = amountReceived;
      currentRecord.paidDate = new Date();
      currentRecord.status = 'Completed';
      
      payment.installments.installmentHistory = installmentHistory;
      payment.installments.currentInstallment = currentInstallment + 1;
    }

    await payment.save();

    const updatedPayment = await Payment.findById(id)
      .populate('clientId', 'firstName lastName email phone')
      .populate('recordedBy', 'name email');

    res.json({
      success: true,
      data: updatedPayment,
      message: 'Payment updated successfully'
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 