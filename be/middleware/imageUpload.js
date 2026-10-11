const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');

const uploadDirectory = path.join(__dirname, '..', 'uploads');
const extensionByMimeType = {
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      fs.mkdir(uploadDirectory, { recursive: true }, (error) => callback(error, uploadDirectory));
    },
    filename: (req, file, callback) => {
      callback(null, `${crypto.randomUUID()}${extensionByMimeType[file.mimetype]}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!extensionByMimeType[file.mimetype]) {
      const error = new Error('Chỉ hỗ trợ ảnh JPG, PNG, GIF hoặc WebP.');
      error.code = 'UNSUPPORTED_IMAGE_TYPE';
      callback(error);
      return;
    }
    callback(null, true);
  },
}).single('image');

function uploadMedicineImage(req, res, next) {
  upload(req, res, (error) => {
    if (error) {
      return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
        message: error.code === 'LIMIT_FILE_SIZE'
          ? 'Ảnh vượt quá dung lượng tối đa 5 MB.'
          : error.message,
      });
    }
    if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn ảnh cần tải lên.' });
    next();
  });
}

module.exports = { uploadMedicineImage, uploadDirectory };