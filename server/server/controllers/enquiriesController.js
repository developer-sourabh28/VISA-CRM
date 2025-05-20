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
}

export default EnquiriesController;