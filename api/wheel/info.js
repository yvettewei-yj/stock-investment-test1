// API: /api/wheel/info
// 返回转盘信息

module.exports = function handler(req, res) {
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

  try {
    const userId = req.query.user_id || '1';

    // 转盘奖品配置
    const prizes = [
      { name: '10积分', color: '#f59e0b', weight: 30 },
      { name: '20积分', color: '#10b981', weight: 25 },
      { name: '50积分', color: '#3b82f6', weight: 15 },
      { name: '100积分', color: '#8b5cf6', weight: 10 },
      { name: '普通卡片', color: '#9ca3af', weight: 10 },
      { name: '稀有卡片', color: '#3b82f6', weight: 5 },
      { name: '史诗卡片', color: '#8b5cf6', weight: 3 },
      { name: '传说卡片', color: '#f59e0b', weight: 2 }
    ];

    res.status(200).json({
      success: true,
      prizes: prizes,
      free_spins_left: 1, // 每日免费次数
      spin_cost: 50 // 积分抽奖费用
    });
  } catch (error) {
    console.error('获取转盘信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取转盘信息失败: ' + error.message
    });
  }
}

