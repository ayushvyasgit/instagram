import { Client } from 'minio';
import { config } from './env.js';

const minioClient = new Client({
  endPoint: config.MINIO_ENDPOINT,
  port: config.MINIO_PORT,
  useSSL: false,
  accessKey: config.MINIO_ACCESS_KEY,
  secretKey: config.MINIO_SECRET_KEY,
});

// Initialize bucket
const initializeBucket = async () => {
  try {
    const bucketExists = await minioClient.bucketExists(config.MINIO_BUCKET);
    
    if (!bucketExists) {
      await minioClient.makeBucket(config.MINIO_BUCKET, 'us-east-1');
      console.log(`✅ MinIO bucket '${config.MINIO_BUCKET}' created`);
      
      // Set bucket policy to allow public read
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${config.MINIO_BUCKET}/*`],
          },
        ],
      };
      
      await minioClient.setBucketPolicy(
        config.MINIO_BUCKET,
        JSON.stringify(policy)
      );
    } else {
      console.log(`✅ MinIO bucket '${config.MINIO_BUCKET}' exists`);
    }
  } catch (error) {
    console.error('MinIO initialization error:', error);
    throw error;
  }
};

// Upload service
export const uploadService = {
  async uploadFile(file, userId, folder = 'posts') {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.originalname.split('.').pop();
    const fileName = `${folder}/${userId}/${timestamp}-${randomString}.${extension}`;

    await minioClient.putObject(
      config.MINIO_BUCKET,
      fileName,
      file.buffer,
      file.size,
      {
        'Content-Type': file.mimetype,
      }
    );

    const url = `http://${config.MINIO_PUBLIC_ENDPOINT}:${config.MINIO_PORT}/${config.MINIO_BUCKET}/${fileName}`;
    
    return {
      fileName,
      url,
      size: file.size,
      mimeType: file.mimetype,
    };
  },

  async deleteFile(fileName) {
    try {
      await minioClient.removeObject(config.MINIO_BUCKET, fileName);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  },

  async getFileUrl(fileName) {
    return `http://${config.MINIO_PUBLIC_ENDPOINT}:${config.MINIO_PORT}/${config.MINIO_BUCKET}/${fileName}`;
  },
};

export { initializeBucket };
export default minioClient;