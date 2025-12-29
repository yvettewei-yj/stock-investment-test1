// API: /api/wheel/spin
// 转盘抽奖

module.exports = function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const userId = req.query.user_id || '1';

    // 转盘奖品配置
    const prizes = [
      { name: '10积分', color: '#f59e0b', weight: 30, type: 'points', value: 10 },
      { name: '20积分', color: '#10b981', weight: 25, type: 'points', value: 20 },
      { name: '50积分', color: '#3b82f6', weight: 15, type: 'points', value: 50 },
      { name: '100积分', color: '#8b5cf6', weight: 10, type: 'points', value: 100 },
      { name: '普通卡片', color: '#9ca3af', weight: 10, type: 'card', rarity: 'common' },
      { name: '稀有卡片', color: '#3b82f6', weight: 5, type: 'card', rarity: 'rare' },
      { name: '史诗卡片', color: '#8b5cf6', weight: 3, type: 'card', rarity: 'epic' },
      { name: '传说卡片', color: '#f59e0b', weight: 2, type: 'card', rarity: 'legendary' }
    ];

    // 根据权重随机选择奖品
    const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedPrize = null;
    let prizeIndex = 0;

    for (let i = 0; i < prizes.length; i++) {
      random -= prizes[i].weight;
      if (random <= 0) {
        selectedPrize = prizes[i];
        prizeIndex = i;
        break;
      }
    }

    res.status(200).json({
      success: true,
      prize: selectedPrize,
      prize_index: prizeIndex,
      message: `恭喜获得${selectedPrize.name}！`
    });
  } catch (error) {
    console.error('转盘抽奖失败:', error);
    res.status(500).json({
      success: false,
      message: '转盘抽奖失败: ' + error.message
    });
  }
}

