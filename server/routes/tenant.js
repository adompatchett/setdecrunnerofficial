import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Production from '../models/Production.js';

const router = Router();

/* ------------------------------- helpers -------------------------------- */

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));

/**
 * Normalize many possible ID shapes into a string:
 * - string/number
 * - raw ObjectId
 * - documents or payloads with _id / id / uid / userId
 */
// utils/id.js (or near your router code)

const HEX24 = /^[a-f0-9]{24}$/i;

export function toId(v) {
  if (!v) return '';
  if (typeof v === 'string') return HEX24.test(v) ? v : '';
  if (Array.isArray(v)) return toId(v[0]);

  // Raw ObjectId
  if (v instanceof mongoose.Types.ObjectId) return v.toString();

  // Populated/doc shapes
  if (v._id) return toId(v._id);
  if (v.id)  return toId(v.id);
  if (v.user) return toId(v.user);

  // Last resort
  try {
    const s = v.toString?.();
    return HEX24.test(s) ? s : '';
  } catch { return ''; }
}
export const idsEqual = (a,b) => {
  const A = toId(a), B = toId(b);
  return A && B && A === B;
};

const getProductionId = (req) => {
  const pid = req.headers['x-production-id'];
  return pid ? String(pid).trim() : '';
};

function requireContext(req, res) {
  const uid = toId(req.user);
  const productionId = getProductionId(req);

  if (!uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  if (!productionId || !isObjectId(productionId)) {
    res.status(400).json({ error: 'Missing or invalid x-production-id header' });
    return false;
  }
  return true;
}

/* ----------------------------- owner guard ------------------------------ */
/**
 * requireOwner:
 * - Uses x-production-id header **only**.
 * - If owner exists (in `ownerUserId` or `owner`), it must match current user.
 * - If NO owner, only an existing member can claim; claim sets both `ownerUserId` and `owner`.
 * - Keeps membership in sync:
 *   - owner ∈ Production.members
 *   - productionId ∈ User.productionIds
 */
export async function requireOwner(req, res, next) {
  try {
    if (!requireContext(req, res)) return;

    const userId = toId(req.user);
    const productionId = getProductionId(req);

    const prod = await Production.findById(req.headers['x-production-id'])
      .select('_id ownerUserId owner members')
      .lean();

    if (!prod) return res.status(404).json({ error: 'Production not found' });

    const ownerId = prod.ownerUserId || prod.owner || null;

    // If already owned, verify and sync
    if (ownerId) {
      if (!idsEqual(ownerId, userId)) {
        return res.status(403).json({ error: 'Owner permissions required' });
      }

      // Ensure bidirectional membership
      const upserts = [];

      const isMember =
        Array.isArray(prod.members) && prod.members.some((m) => idsEqual(m, userId));

      if (!isMember) {
        upserts.push(
          Production.updateOne({ _id: prod._id }, { $addToSet: { members: userId } })
        );
      }
      upserts.push(
        User.updateOne({ _id: userId }, { $addToSet: { productionIds: prod._id } })
      );

      if (upserts.length) await Promise.all(upserts);
      return next();
    }

    // No owner yet — only a current member may claim ownership.
    let isMember =
      Array.isArray(prod.members) && prod.members.some((m) => idsEqual(m, userId));

    if (!isMember) {
      // OR: user.productionIds contains this production
      const userHasProd = await User.exists({ _id: userId, productionIds: prod._id });
      isMember = !!userHasProd;
    }

    if (!isMember) {
      return res.status(403).json({ error: 'Only an existing member can claim ownership' });
    }

    // Atomically claim ownership (set BOTH fields for compatibility) and ensure membership
    const claimed = await Production.findOneAndUpdate(
      {
        _id: prod._id,
        $or: [{ ownerUserId: { $exists: false } }, { ownerUserId: null }],
        // If your data sometimes uses `owner` only, also allow claiming when `owner` is null
      },
      { $set: { ownerUserId: userId, owner: userId }, $addToSet: { members: userId } },
      { new: true }
    ).lean();

    if (!claimed) {
      // Someone else may have claimed; re-read to confirm
      const latest = await Production.findById(prod._id).select('_id ownerUserId owner').lean();
      const nowOwner = latest?.ownerUserId || latest?.owner;
      if (!nowOwner || !idsEqual(nowOwner, userId)) {
        return res.status(403).json({ error: 'Owner permissions required' });
      }
    }

    // Keep user's side in sync
    await User.updateOne({ _id: userId }, { $addToSet: { productionIds: prod._id } });

    return next();
  } catch (e) {
    console.error('requireOwner error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

/* -------------------------------- routes -------------------------------- */
/**
 * GET /members
 * Returns members for this production.
 * UNION of:
 *   - Production.members
 *   - Users with productionIds containing this production
 * Owner (from ownerUserId OR owner) sorted first.
 */
router.get('/members', async (req, res) => {

  try {
    if (!requireContext(req, res)) return;

    const productionId = getProductionId(req);
    
    const prod = await Production.findById(productionId)
      .select('members ownerUserId owner')
      .lean();
    if (!prod) return res.status(404).json({ error: 'Production not found' });
    
    const ownerId = prod.ownerUserId || prod.owner || null;
   
    const fromProd = (prod.members || []).map((m) => toId(m)).filter(Boolean);
    
    const viaUsers = await User.find({ productionIds: req.headers['x-production-id'] }).select('_id').lean();
    const set = new Set(fromProd);
    for (const u of viaUsers) set.add(toId(u._id));
    const ids = [...set].filter(Boolean);

    if (!ids.length) return res.json({ items: [] });

    const users = await User.find({ _id: { $in: ids } })
      .select('_id email name role photo')
      .lean();

    users.sort((a, b) => {
      if (ownerId && idsEqual(a._id, ownerId)) return -1;
      if (ownerId && idsEqual(b._id, ownerId)) return 1;
      const an = (a.name || a.email || '').toLowerCase();
      const bn = (b.name || b.email || '').toLowerCase();
      return an.localeCompare(bn);
    });

   

    return res.json({ items: users });
  } catch (e) {
    console.error('GET /members error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /members
 * Body: { email }
 * Owner-only. Upserts user and links both sides.
 */
// inside POST /members
router.post('/members', requireOwner, async (req, res) => {
  try {
    if (!requireContext(req, res)) return;

    const productionId = getProductionId(req);               // <-- ObjectId string from header
    const email = String(req.body?.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ error: 'Email required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Upsert/find user
    const user = await User.findOneAndUpdate(
      { email },
      { $setOnInsert: { email } },
      { upsert: true, new: true }
    ).lean();

    // Ensure membership on the Production side (handles both schemas)
    const prod = await Production.findById(req.headers['x-production-id']).select('_id members').lean();
    if (!prod) return res.status(404).json({ error: 'Production not found' });

    const userIdStr = String(user._id);
    const hasMember = (prod.members || []).some(m =>
      String(m) === userIdStr || String(m?.user) === userIdStr
    );

    if (!hasMember) {
      if (Array.isArray(prod.members) && prod.members.length && typeof prod.members[0] === 'object' && prod.members[0] !== null && 'user' in prod.members[0]) {
        // members: [{ user: ObjectId, role?: string }]
        await Production.updateOne(
          { _id: productionId, 'members.user': { $ne: user._id } },
          { $push: { members: { user: user._id } } }          // push object form
        );
      } else {
        // members: [ObjectId]
        await Production.updateOne(
          { _id: productionId },                               // <-- FIXED: match by _id
          { $addToSet: { members: user._id } }                 // dedupe by ObjectId
        );
      }
    }

    // Ensure membership on the User side
    await User.updateOne(
      { _id: user._id },
      { $addToSet: { productionIds: productionId } }
    );

    return res.json({ ok: true, user: { id: user._id, email: user.email } });
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    console.error('POST /members error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /members/:userId
 * Owner-only. Removes membership on both sides. Owner cannot remove self.
 */
// helper: safe cast to ObjectId or return null
const toOid = (v) => {
  const s = String(v || '').trim();
  return mongoose.Types.ObjectId.isValid(s) ? new mongoose.Types.ObjectId(s) : null;
};

router.delete('/members/:userId', requireOwner, async (req, res) => {
  try {
    if (!requireContext(req, res)) return;

    const productionId = getProductionId(req);
    const { userId } = req.params;

    const prodOid = toOid(productionId);
    const userOid = toOid(userId);
    if (!prodOid) return res.status(400).json({ error: 'Invalid production id' });
    if (!userOid) return res.status(400).json({ error: 'Invalid userId' });

    // Owner guard
    const prod = await Production.findById(prodOid).select('ownerUserId owner').lean();
    if (!prod) return res.status(404).json({ error: 'Production not found' });

    const ownerId = (prod.ownerUserId ?? prod.owner) ? String(prod.ownerUserId ?? prod.owner) : null;
    if (ownerId && String(userOid) === ownerId) {
      return res.status(400).json({ error: 'Owner cannot be removed' });
    }

    // Perform pulls for both shapes (and string variants, just in case)
    const userIdStr = String(userOid);

    const [pullDirectOid, pullObjectOid, pullDirectStr, pullObjectStr, pullUserSide] = await Promise.all([
      // members: [ObjectId]
      Production.updateOne({ _id: prodOid }, { $pull: { members: userOid } }),
      // members: [{ user: ObjectId, ... }]
      Production.updateOne({ _id: prodOid }, { $pull: { members: { user: userOid } } }),
      // if stored as strings by accident
      Production.updateOne({ _id: prodOid }, { $pull: { members: userIdStr } }),
      Production.updateOne({ _id: prodOid }, { $pull: { members: { user: userIdStr } } }),
      // user.productionIds: [ObjectId]
      User.updateOne({ _id: userOid }, { $pull: { productionIds: prodOid } }),
    ]);

    // Optional: report whether anything changed
    const modified =
      (pullDirectOid.modifiedCount ?? pullDirectOid.nModified ?? 0) +
      (pullObjectOid.modifiedCount ?? pullObjectOid.nModified ?? 0) +
      (pullDirectStr.modifiedCount ?? pullDirectStr.nModified ?? 0) +
      (pullObjectStr.modifiedCount ?? pullObjectStr.nModified ?? 0);

    return res.json({ ok: true, removedFromProduction: modified > 0 });
  } catch (e) {
    console.error('DELETE /members/:userId error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
});
export default router;

