import express from 'express';

const router = express.Router();

/**
 * GET /api/vapi/config
 * Get VAPI public key (for client-side initialization)
 * Returns null if not configured (frontend will use fallback)
 */
router.get('/config', async (req, res, next) => {
  try {
    const vapiPublicKey = process.env.VAPI_PUBLIC_KEY;

    if (!vapiPublicKey) {
      // Return 200 with null - frontend will use fallback from env variable
      return res.json({ publicKey: null });
    }

    res.json({ publicKey: vapiPublicKey });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/vapi/session-config
 * Get VAPI session configuration for interview (public, no auth required)
 */
router.post('/session-config', async (req, res, next) => {
  try {
    const { candidateId } = req.body;

    if (!candidateId) {
      return res.status(400).json({ error: 'candidateId is required' });
    }

    const vapiPublicKey = process.env.VAPI_PUBLIC_KEY;

    if (!vapiPublicKey) {
      return res.status(500).json({ error: 'VAPI configuration not available' });
    }

    // Return configuration that frontend can use
    res.json({
      publicKey: vapiPublicKey,
      // Add any other VAPI configuration here if needed
    });
  } catch (error) {
    next(error);
  }
});

export default router;

