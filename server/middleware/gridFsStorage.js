// gridFsStorage.js
import { GridFsStorage } from 'multer-gridfs-storage';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

const storage = new GridFsStorage({
    url: process.env.MONGO_URI, // <-- Replace with your real MongoDB URI
    file: (req, file) => {
        return {
            filename: `${Date.now()}-${file.originalname}`
        };
    }
});

const upload = multer({ storage });

export default upload;
