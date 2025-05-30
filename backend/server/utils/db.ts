import mongoose from 'mongoose';
import config from '../config/index';

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoURI);
    console.log('MongoDB подключена успешно!');

    mongoose.connection.on('error', (err) => {
      console.error(`Ошибка MongoDB после подключения: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB отключена.');
    });

  } catch (err: any) {
    console.error(`Ошибка подключения к MongoDB: ${err.message}`);

    process.exit(1);
  }
};

export default connectDB;