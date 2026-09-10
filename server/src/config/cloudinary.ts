import { v2 as cloudinary } from 'cloudinary';
import { ENV } from './env.js';
import fs from 'fs';
import path from 'path';

const isCloudinaryConfigured = Boolean(
  ENV.CLOUDINARY_CLOUD_NAME && ENV.CLOUDINARY_API_KEY && ENV.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
    api_key: ENV.CLOUDINARY_API_KEY,
    api_secret: ENV.CLOUDINARY_API_SECRET,
  });
}

// Ensure local uploads directory exists for development/fallback
const localUploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

export async function uploadImageBuffer(
  buffer: Buffer,
  folder = 'devconnect',
  filename = `upload_${Date.now()}`
): Promise<string> {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error('Cloudinary upload failed'));
          }
          resolve(result.secure_url);
        }
      );
      uploadStream.end(buffer);
    });
  } else {
    // Local fallback: write to disk and return URL path
    const ext = '.jpg';
    const uniqueName = `${folder}_${filename}_${Date.now()}${ext}`;
    const filePath = path.join(localUploadsDir, uniqueName);
    await fs.promises.writeFile(filePath, buffer);
    return `/uploads/${uniqueName}`;
  }
}

export { cloudinary, isCloudinaryConfigured };
