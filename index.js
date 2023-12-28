const express = require('express');
const multer = require('multer');
const B2 = require('backblaze-b2');
const { v4: uuidv4 } = require('uuid'); 

const credentials = {
  applicationKeyId: "005302d9f60a3560000000004",
  applicationKey: "K005G/3ZftEm1QKeUcF+LGWe+jVldxc",
};

const bucketName = 'qatafaProject';

const b2 = new B2(credentials);

const app = express();
const port = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

async function getBucketIdByName(bucketName) {
  try {
    const listBucketsResponse = await b2.listBuckets();
    const bucket = listBucketsResponse.data.buckets.find(b => b.bucketName === bucketName);
    if (bucket) {
      return bucket.bucketId;
    }
    throw new Error('Bucket not found');
  } catch (error) {
    console.error('Error getting bucket ID:', error);
    throw error;
  }
}

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    await b2.authorize();
    console.log('Authorized');

    const bucketId = await getBucketIdByName(bucketName);

    const uniqueFileName = `${uuidv4()}_${req.file.originalname}`;

    const uploadUrlResponse = await b2.getUploadUrl({
      bucketId,
    });

    const uploadFileResponse = await b2.uploadFile({
      uploadUrl: uploadUrlResponse.data.uploadUrl,
      uploadAuthToken: uploadUrlResponse.data.authorizationToken,
      fileName: uniqueFileName,
      data: req.file.buffer,
      contentLength: req.file.buffer.length,
      mime: req.file.mimetype,
    });

    console.log('File uploaded:', uploadFileResponse.data);

    res.send('File uploaded successfully');
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
