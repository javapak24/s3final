const express = require('express');
const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Configure AWS S3
const s3 = new AWS.S3({
  region: 'us-east-1', // e.g., 'us-east-1'
  accessKeyId: 'AKIAU6GDYQOGRAXKWZVO', // Optional if using environment variables or IAM roles
  secretAccessKey: 'c01c5jbzfPYmlVpGrH5OIv9EICTURrGUeYn987vE' // Optional if using environment variables or IAM roles
});

// Replace with your S3 bucket name
const BUCKET_NAME = 'bucket2-4';

// Set up Multer for file uploads
const upload = multer({ dest: 'uploads/' });

/**
 * GET /images
 * Fetches all object keys from the S3 bucket.
 */
app.get('/images', async (req, res) => {
    try {
      const params = { Bucket: BUCKET_NAME };
      const data = await s3.listObjectsV2(params).promise();
  
      const images = data.Contents.map(item => ({
        Key: item.Key,
        Url: `https://${BUCKET_NAME}.s3.us-east-1.amazonaws.com/${item.Key}`,
      }));
  
      res.status(200).json({ images });
    } catch (error) {
      console.error('Error fetching object keys:', error);
      res.status(500).json({ error: 'Failed to fetch object keys' });
    }
  });
  

/**
 * POST /images
 * Uploads a new image to the S3 bucket.
 * Expects a file upload with the key `image`.
 */
app.post('/images', upload.single('image'), async (req, res) => {
  const filePath = req.file.path;
  const fileName = req.file.originalname;

  try {
    const fileContent = fs.readFileSync(filePath);
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileName, // Use the original filename
      Body: fileContent,
      ContentType: req.file.mimetype,
    };
    await s3.upload(params).promise();

    // Cleanup uploaded file from server
    fs.unlinkSync(filePath);

    res.status(200).json({ message: 'Image uploaded successfully', key: fileName });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
