// API: /api/cards/collection
// 获取用户卡片收集情况

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

  // 返回卡片收集数据（默认值）
  res.status(200).json({
    success: true,
    user_id: userId,
    cards: [],
    total_cards: 0,
    collected_cards: 0
  });
}

