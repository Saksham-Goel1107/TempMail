import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  PORT: process.env.PORT,
  ARCJET_KEY: process.env.ARCJET_KEY,
};