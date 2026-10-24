import mongoose from 'mongoose';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();
mongoose.set("strictQuery", false);

const dbPassword = process.env.MONGODB_PASSWORD;
if (!dbPassword) {
  console.error('MONGODB_PASSWORD is not set in .env');
  process.exit(1);
}

const dbURI = `mongodb+srv://loc8r_user:${encodeURIComponent(dbPassword)}@cluster0.71zjfdj.mongodb.net/Loc8r`;
// mongodb+srv://<db_username>:<db_password>@cluster0.71zjfdj.mongodb.net/
// `mongodb+srv://loc8r_user:${encodeURIComponent(dbPassword)}@cluster0.71zjfdj.mongodb.net/Loc8r`;

const connect = async () => {
  try {
    await mongoose.connect(dbURI);
  } catch (err) {
    console.error('Initial MongoDB connection error:', err.message);
    setTimeout(connect, 3000);
  }
};

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to ' + dbURI);
});

mongoose.connection.on('error', err => {
  console.log('Mongoose connection error: ' + err);
  return connect();
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

if (process.platform === 'win32') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('SIGINT', () => {
    process.emit('SIGINT');
  });
}

const gracefulShutdown = async (msg, callback) => {
  await mongoose.connection.close();
  console.log(`Mongoose disconnected through ${msg}`);
  callback();
};

/*
const gracefulShutdown = (msg, callback) => {
  mongoose.connection.close(() => {
    console.log(`Mongoose disconnected through ${msg}`);
    callback();
  });
};
*/

process.once('SIGUSR2', () => {
  gracefulShutdown('nodemon restart', () => {
    process.kill(process.pid, 'SIGUSR2');
  });
});

process.on('SIGINT', () => {
  gracefulShutdown('app termination', () => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  gracefulShutdown('Heroku app shutdown', () => {
    process.exit(0);
  });
});

connect();

import './locations.js';