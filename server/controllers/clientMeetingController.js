import ClientMeeting from '../models/ClientMeeting.js';
import Client from '../models/Client.js';
import { sendEmail } from '../config/emailConfig.js';

// Get meeting for a client
export const getClientMeeting = async (req, res) => {
    try {
        const { clientId } = req.params;
        const meeting = await ClientMeeting.findOne({ clientId });
        
        // Return successful response even if no meeting is found
        res.status(200).json({
            success: true,
            data: meeting || null
        });
    } catch (error) {
        console.error('Error in getClientMeeting:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create or update meeting for a client
export const createOrUpdateClientMeeting = async (req, res) => {
    try {
        const { clientId } = req.params;
        const meetingData = { ...req.body, clientId };

        let meeting = await ClientMeeting.findOne({ clientId });
        if (meeting) {
            meeting = await ClientMeeting.findByIdAndUpdate(
                meeting._id,
                { ...meetingData, updatedAt: Date.now() },
                { new: true, runValidators: true }
            );
        } else {
            meeting = new ClientMeeting(meetingData);
            await meeting.save();
        }

        // Get client details for email
        const client = await Client.findById(clientId);
        if (client) {
            try {
                await sendEmail(client.email, 'meetingConfirmation', {
                    ...meeting.toObject(),
                    clientName: `${client.firstName} ${client.lastName}`
                });
            } catch (emailError) {
                console.error('Error sending meeting confirmation email:', emailError);
                // Don't fail the request if email fails
            }
        }

        res.status(200).json({
            success: true,
            data: meeting,
            message: meeting ? 'Meeting updated successfully' : 'Meeting created successfully'
        });
    } catch (error) {
        console.error('Error in createOrUpdateClientMeeting:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 