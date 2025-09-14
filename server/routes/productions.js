import express from 'express';
import Production from '../models/Production.js';
import { authRequired } from '../middleware/auth.js';
import { requireMembership } from '../middleware/requireMembership.js';

const router = express.Router();
router.use(authRequired, requireMembership);

// GET /api/tenant/productions/:id
router.get('/:id', async (req, res, next) => {
  console.log(req.params.id);
  try {
    const prod = await Production.findOne({ slug: req.params.id }).lean();
    if (!prod) return res.status(404).json({ error: 'Not found' });
    res.json(prod);
  } catch (e) { next(e); }
});

export default router;