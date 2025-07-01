import EnquiryMeeting from '../models/EnquiryMeeting.js';
import Enquiry from '../models/Enquiry.js';
import { sendEmail } from '../config/emailConfig.js';

// Get meeting for an enquiry
export const getEnquiryMeeting = async (req, res) => {
    try {
        const { enquiryId } = req.params;
        const meeting = await EnquiryMeeting.findOne({ enquiryId });
        
        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'No meeting found for this enquiry'
            });
        }

        res.status(200).json({
            success: true,
            data: meeting
        });
    } catch (error) {
        console.error('Error in getEnquiryMeeting:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create or update meeting for an enquiry
export const createOrUpdateEnquiryMeeting = async (req, res) => {
    try {
        const { enquiryId } = req.params;
        const meetingData = { ...req.body, enquiryId };

        let meeting = await EnquiryMeeting.findOne({ enquiryId });
        if (meeting) {
            meeting = await EnquiryMeeting.findByIdAndUpdate(
                meeting._id,
                meetingData,
                { new: true, runValidators: true }
            );
        } else {
            meeting = new EnquiryMeeting(meetingData);
            await meeting.save();
        }

        // Get enquiry details for email
        const enquiry = await Enquiry.findById(enquiryId);
        if (enquiry) {
            try {
                await sendEmail(enquiry.email, 'meetingConfirmation', {
                    ...meeting.toObject(),
                    clientName: enquiry.name
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
        console.error('Error in createOrUpdateEnquiryMeeting:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 