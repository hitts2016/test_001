import { Router } from 'express';
import multer from 'multer';
import { S3Storage } from 'coze-coding-dev-sdk';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// POST /api/v1/upload - 上传衣服图片
// FormData: file (image)
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '请上传图片文件' });
      return;
    }
    const { buffer, originalname, mimetype } = req.file;
    const fileName = `clothes/${Date.now()}_${originalname}`;
    const key = await storage.uploadFile({
      fileContent: buffer,
      fileName,
      contentType: mimetype,
    });
    const signedUrl = await storage.generatePresignedUrl({
      key,
      expireTime: 86400 * 30, // 30 days
    });
    res.json({ key, url: signedUrl });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/upload/:key/url - 获取图片签名URL
router.get('/:key/url', async (req, res, next) => {
  try {
    const key = req.params.key;
    const signedUrl = await storage.generatePresignedUrl({
      key,
      expireTime: 86400,
    });
    res.json({ url: signedUrl });
  } catch (err) {
    next(err);
  }
});

export default router;
