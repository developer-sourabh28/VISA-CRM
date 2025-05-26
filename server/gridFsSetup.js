// server/gridFsSetup.js
import mongoose from 'mongoose';
import Grid from 'gridfs-stream';

let gfs;

const connectGridFS = (conn) => {
    Grid.mongo = mongoose.mongo;
    gfs = Grid(conn.connection.db, mongoose.mongo);
    gfs.collection('agreements'); // collection name in MongoDB
};

export { gfs, connectGridFS };
