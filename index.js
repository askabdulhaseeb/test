const express = require('express');
const multer = require('multer');
const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require("@aws-sdk/lib-storage");
const dotenv = require('dotenv');
const cors= require('cors');

dotenv.config();

const app = express();
const port = 3000;



// Create S3 client with explicit credentials
const s3Client = new S3Client({ 
  region:"ap-south-1",
    credentials:{
        accessKeyId:"AKIAT7VYXNPSFIOG6ZWV",
        secretAccessKey:"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",
    }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: 'uploads/' });

// Get all files from S3 bucket
  app.get('/files', async (req, res) => {
    try {
      const data = await s3Client.send(new ListObjectsV2Command({ Bucket: process.env.S3_BUCKET_NAME }));
      console.log(data);
      const files = data.Contents.map(file => {
        const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`;
        return { name: file.Key, url: fileUrl };
      });
      res.json(files);
    } catch (err) {
      console.error('Error fetching files:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// Upload a file to S3 bucket
app.post('/files', upload.single('file'), async (req, res) => {
   const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
   const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: file.originalname,
    // Body:file.
  };
 
  try {
  const data=  await s3Client.send(new PutObjectCommand(params));
  console.log('data',data);
    res.json({ message: 'File uploaded successfully' });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download a file from S3 bucket
app.get('/files/:fileName', async (req, res) => {
  const fileName = req.params.fileName;

  try {
    const params = { Bucket: process.env.S3_BUCKET_NAME, Key: fileName };
    const data = await s3Client.send(new GetObjectCommand(params));
    res.attachment(fileName);
    res.send(data.Body);
  } catch (err) {
    console.error('Error downloading file:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a file from S3 bucket
app.delete('/files/:fileName', async (req, res) => {
  const fileName = req.params.fileName;

  try {
    const params = { Bucket: process.env.S3_BUCKET_NAME, Key: fileName };
    await s3Client.send(new DeleteObjectCommand(params));
    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
