const mongoose = require('mongoose');
// Mongoose provides the functionality required to connect to MongoDB
// (Mongoose, n.d.-a).
const logger = require('../utils/logger');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  //Retrieves the MongoDB connection URI from an environment variable.
  //Mongoose (n.d.-a).

  if (!uri) {
    logger.error('MONGO_URI is not set. Add it to your .env file.');
    process.exit(1);
    //Exits the application with a failure status if the required
    //configuration is missing (Node.js, n.d.).
  }

  try {
    mongoose.set('strictQuery', true);
    //Configures Mongoose strict query behaviour (Mongoose, n.d.-b).

    await mongoose.connect(uri);
    //Establishes an asynchronous connection to MongoDB
    //(Mongoose, n.d.-a).

    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
    //Retrieves the host associated with the Mongoose connection
    //(Mongoose, n.d.-a).

  } catch (err) {
    logger.error('MongoDB connection failed', {
      message: err.message
    });

    process.exit(1);
    //Terminates the process with a non-zero exit status
    //(Node.js, n.d.).
  }
}

module.exports = connectDB;

//References
//Mongoose (n.d.-a) Connecting to MongoDB. Available at: https://mongoosejs.com/docs/connections.html (Accessed: 7 October 2026).
//Mongoose (n.d.-b) Mongoose Schemas: strictQuery option. Available at: https://mongoosejs.com/docs/guide.html (Accessed: 7 October 2026).
//Node.js (n.d.) Process. Available at: https://nodejs.org/api/process.html (Accessed: 7 October 2026).

