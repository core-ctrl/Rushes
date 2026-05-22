import dbConnect from '../../../lib/mongodb';
import Report from '../../../models/Report';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).end();
    await dbConnect();

    const { targetId, targetType, reason } = req.body;

    await Report.create({
        reportedBy: session.user.id,
        targetId,
        targetType,
        reason,
    });

    res.json({ success: true });
}
