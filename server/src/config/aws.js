// Configuração do AWS S3 será implementada depois

export const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'sa-east-1',
  bucket: process.env.AWS_S3_BUCKET,
  bucketName: process.env.AWS_S3_BUCKET,
  cdnUrl: process.env.AWS_CDN_URL
};

