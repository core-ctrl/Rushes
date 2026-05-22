import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { getUserFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();
    await dbConnect();

    const { u } = req.query;
    if (!u || u.length < 3) return res.json({ available: false });

    const decoded = getUserFromRequest(req);
    const exists = await User.findOne({
        username: String(u).toLowerCase(),
        ...(decoded?.id ? { _id: { $ne: decoded.id } } : {}),
    });
    res.json({ available: !exists });
}
