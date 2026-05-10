const { onRequest } = require('firebase-functions/v2/https');
const {
  getNotifications,
  markAsRead,
} = require('../services/notificationHistoryService');
const { verifyToken } = require('../middlewares/authMiddleware');

const getNotificationsHandler = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');
  const decoded = await verifyToken(req, res);
  if (!decoded) return;
  const limit = parseInt(req.query.limit) || 20;
  try {
    const notifications = await getNotifications(decoded.uid, limit);
    res.status(200).json({ notifications });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const markNotificationReadHandler = onRequest(
  { cors: true },
  async (req, res) => {
    if (req.method !== 'POST')
      return res.status(405).send('Method Not Allowed');
    const decoded = await verifyToken(req, res);
    if (!decoded) return;
    const { notificationId } = req.body;
    if (!notificationId)
      return res.status(400).json({ error: 'notificationId 필수' });
    try {
      await markAsRead(notificationId);
      res.status(200).json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

module.exports = { getNotificationsHandler, markNotificationReadHandler };
