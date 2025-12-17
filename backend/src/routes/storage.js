import express from 'express';
import { supabase } from '../config/supabase.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/storage/upload
 * Upload a file to Supabase storage
 */
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { bucket, path } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!bucket) {
      return res.status(400).json({ error: 'Bucket name is required' });
    }

    const filePath = path || `${userId}/${Date.now()}_${file.originalname}`;

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    res.json({
      path: data.path,
      publicUrl: urlData.publicUrl,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/storage/delete
 * Delete a file from Supabase storage
 */
router.delete('/delete', async (req, res, next) => {
  try {
    const { bucket, path } = req.body;

    if (!bucket || !path) {
      return res.status(400).json({ error: 'Bucket and path are required' });
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

