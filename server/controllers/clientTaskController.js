import ClientTask from "../models/ClientTask.js";
import Client from "../models/Client.js";
import { sendEmail } from "../config/emailConfig.js";

// Get all tasks for a client
export const getClientTasks = async (req, res) => {
    try {
        const { clientId } = req.params;
        const tasks = await ClientTask.find({ clientId }).sort({ dueDate: 1 });

        res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        console.error('Error in getClientTasks:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// Create a new task
export const createClientTask = async (req, res) => {
    try {
        const { clientId } = req.params;
        const taskData = { ...req.body, clientId };
        const task = new ClientTask(taskData);
        await task.save();

        // Get client details for email
        const client = await Client.findById(clientId);
        if (client) {
            try {
                await sendEmail(client.email, 'taskReminder', {
                    ...task.toObject(),
                    clientName: client.name
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
        console.error('Error in createClientTask:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update a task
export const updateClientTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const updatedData = req.body;

        const task = await ClientTask.findByIdAndUpdate(
            taskId,
            updatedData,
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
            message : 'Task updated successfully'
        });
    }
    catch (error) {
        console.error('Error in updateClientTask:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
// Delete a task
export const deleteClientTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await ClientTask.findByIdAndDelete(taskId);
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
        console.error('Error in deleteClientTask:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};