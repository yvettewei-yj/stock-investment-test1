// API: /api/wheel
// 合并的转盘相关API端点

module.exports = function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 从URL路径解析：/api/wheel/info -> info
    const urlPath = req.url.split('?')[0];
    const pathParts = urlPath.split('/').filter(p => p);
    const path = pathParts.length > 2 ? pathParts[2] : (req.query.path || 'info');
    const userId = req.query.user_id || '1';

    if (path === 'info' || (!path && req.method === 'GET')) {
      // GET /api/wheel?path=info
      if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
      }

      const prizes = [
        { id: 1, name: '100积分', type: 'points', value: 100, color: '#f59e0b' },
        { id: 2, name: '稀有卡片', type: 'card', rarity: 'rare', color: '#3b82f6' },
        { id: 3, name: '50积分', type: 'points', value: 50, color: '#10b981' },
        { id: 4, name: '谢谢参与', type: 'none', color: '#ef4444' },
        { id: 5, name: '200积分', type: 'points', value: 200, color: '#8b5cf6' },
        { id: 6, name: '普通卡片', type: 'card', rarity: 'common', color: '#9ca3af' }
      ];

      return res.status(200).json({
        success: true,
        prizes: prizes,
        free_spins_left: 1,
        spin_cost: 50
      });
    }

    if (path === 'spin') {
      // POST /api/wheel?path=spin
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
      }

      const prizes = [
        { id: 1, name: '100积分', type: 'points', value: 100, color: '#f59e0b', weight: 30 },
        { id: 2, name: '稀有卡片', type: 'card', rarity: 'rare', color: '#3b82f6', weight: 20 },
        { id: 3, name: '50积分', type: 'points', value: 50, color: '#10b981', weight: 40 },
        { id: 4, name: '谢谢参与', type: 'none', color: '#ef4444', weight: 10 },
        { id: 5, name: '200积分', type: 'points', value: 200, color: '#8b5cf6', weight: 15 },
        { id: 6, name: '普通卡片', type: 'card', rarity: 'common', color: '#9ca3af', weight: 25 }
      ];

      const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
      let random = Math.random() * totalWeight;
      let prizeIndex = 0;
      for (let i = 0; i < prizes.length; i++) {
        random -= prizes[i].weight;
        if (random < 0) {
          prizeIndex = i;
          break;
        }
      }

      const awardedPrize = prizes[prizeIndex];
      return res.status(200).json({
        success: true,
        prize_index: prizeIndex,
        prize: awardedPrize,
        message: `恭喜获得 ${awardedPrize.name}!`
      });
    }

    return res.status(404).json({ success: false, message: 'Endpoint not found' });
  } catch (error) {
    console.error('Wheel API error:', error);
    return res.status(500).json({
      success: false,
      message: 'API error: ' + error.message
    });
  }
};

