// cloudinary/index.js

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// 🔐 Replace these with your actual values or use environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djvvewegg',
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'YelpCamp', // Folder name in your Cloudinary account
    allowed_formats: ['jpeg', 'png', 'jpg']
  }
});

module.exports = {
  cloudinary,
  storage
};
