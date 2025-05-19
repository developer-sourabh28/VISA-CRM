class EnquiriesController {
    constructor(enquiriesModel) {
        this.enquiriesModel = enquiriesModel;
    }

    async createEnquiry(req, res) {
        try {
            const enquiryData = req.body;
            const newEnquiry = await this.enquiriesModel.create(enquiryData);
            res.status(201).json(newEnquiry);
        } catch (error) {
            res.status(500).json({ message: 'Error creating enquiry', error });
        }
    }

    async getEnquiries(req, res) {
        try {
            const enquiries = await this.enquiriesModel.findAll();
            res.status(200).json(enquiries);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching enquiries', error });
        }
    }

    async updateEnquiry(req, res) {
        try {
            const { id } = req.params;
            const enquiryData = req.body;
            const updatedEnquiry = await this.enquiriesModel.update(id, enquiryData);
            if (!updatedEnquiry) {
                return res.status(404).json({ message: 'Enquiry not found' });
            }
            res.status(200).json(updatedEnquiry);
        } catch (error) {
            res.status(500).json({ message: 'Error updating enquiry', error });
        }
    }

    async deleteEnquiry(req, res) {
        try {
            const { id } = req.params;
            const deletedEnquiry = await this.enquiriesModel.delete(id);
            if (!deletedEnquiry) {
                return res.status(404).json({ message: 'Enquiry not found' });
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error deleting enquiry', error });
        }
    }
}

export default EnquiriesController;