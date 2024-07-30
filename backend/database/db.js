const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const DBconnection = async() => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            
        });
        console.log('Connected to DB successfully');
    } catch (error) {
        console.log("error connecting to db", error.message);
    }
};

module.exports = {DBconnection};