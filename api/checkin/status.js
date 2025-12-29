// API: /api/checkin/status
// 返回用户签到状态

export default function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const userId = req.query.user_id || '1';

  // 返回签到状态（默认值）
  res.status(200).json({
    success: true,
    user_id: userId,
    streak: 0,
    last_checkin: null,
    can_checkin: true
  });
}

