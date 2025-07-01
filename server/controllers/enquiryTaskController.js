import EnquiryTask from '../models/EnquiryTask.js';
import Enquiry from '../models/Enquiry.js';
import { sendEmail } from '../config/emailConfig.js';

// Get all tasks for an enquiry
export const getEnquiryTasks = async (req, res) => {
    try {
        const { enquiryId } = req.params;
        const tasks = await EnquiryTask.find({ enquiryId }).sort({ dueDate: 1 });
        
        res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        console.error('Error in getEnquiryTasks:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create a new task
export const createEnquiryTask = async (req, res) => {
    try {
        const { enquiryId } = req.params;
        const taskData = { ...req.body, enquiryId };
        const task = new EnquiryTask(taskData);
        await task.save();

        // Get enquiry details for email
        const enquiry = await Enquiry.findById(enquiryId);
        if (enquiry) {
            try {
                await sendEmail(enquiry.email, 'taskReminder', {
                    ...task.toObject(),
                    clientName: enquiry.name
                });
            } catch (emailError) {
                console.error('Error sending task reminder email:', emailError);
                // Don't fail the request if email fails
            }
        }

        res.status(201).json({
            success: true,
            data: task,
            message: 'Task created successfully'
        });
    } catch (error) {
        console.error('Error in createEnquiryTask:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update a task
export const updateEnquiryTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const taskData = req.body;

        const task = await EnquiryTask.findByIdAndUpdate(
            taskId,
            { ...taskData, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.status(200).json({
            success: true,
            data: task,
            message: 'Task updated successfully'
        });
    } catch (error) {
        console.error('Error in updateEnquiryTask:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete a task
export const deleteEnquiryTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await EnquiryTask.findByIdAndDelete(taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteEnquiryTask:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 