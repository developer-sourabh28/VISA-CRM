class EnquiriesModel {
    constructor(database) {
        this.database = database;
        this.collection = this.database.collection('enquiries');
    }

    async create(enquiryData) {
        const result = await this.collection.insertOne(enquiryData);
        return result.ops[0];
    }

    async findAll() {
        return await this.collection.find().toArray();
    }

    async findById(id) {
        return await this.collection.findOne({ _id: id });
    }

    async update(id, enquiryData) {
        await this.collection.updateOne({ _id: id }, { $set: enquiryData });
        return this.findById(id);
    }

    async delete(id) {
        const result = await this.collection.deleteOne({ _id: id });
        return result.deletedCount > 0;
    }
}

export default EnquiriesModel;