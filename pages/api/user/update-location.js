import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).end();
    await dbConnect();

    await User.findByIdAndUpdate(session.user.id, {
        location: req.body.location,
    });

    res.json({ success: true });
}
