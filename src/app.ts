import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import multer from 'multer'
import nodemailer from 'nodemailer'
import qrcode from 'qrcode'
import bcrypt from 'bcrypt'

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('/', (req, res) => {
  res.status(200).send('Artist Platform API!');
});

export default app;