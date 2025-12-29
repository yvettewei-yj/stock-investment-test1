// API: /api/cards/open-box
// 开启宝箱获取卡片

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

    // 卡片稀有度权重
    const rarityWeights = {
      common: 60,
      rare: 25,
      epic: 10,
      legendary: 5
    };

    // 随机选择稀有度
    const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let selectedRarity = 'common';

    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      random -= weight;
      if (random <= 0) {
        selectedRarity = rarity;
        break;
      }
    }

    // 随机选择股票
    const stocks = [
      { id: 1, name: '贵州茅台', code: '600519', sector: '消费' },
      { id: 2, name: '宁德时代', code: '300750', sector: '新能源' },
      { id: 3, name: '招商银行', code: '600036', sector: '金融' },
      { id: 4, name: '腾讯控股', code: '00700', sector: '科技' },
      { id: 5, name: '中国平安', code: '601318', sector: '金融' }
    ];

    const selectedStock = stocks[Math.floor(Math.random() * stocks.length)];

    // 稀有度配置
    const rarityConfigs = {
      common: { name: '普通', color: '#9ca3af', glow: '0 0 20px rgba(156, 163, 175, 0.5)' },
      rare: { name: '稀有', color: '#3b82f6', glow: '0 0 20px rgba(59, 130, 246, 0.5)' },
      epic: { name: '史诗', color: '#8b5cf6', glow: '0 0 30px rgba(139, 92, 246, 0.6)' },
      legendary: { name: '传说', color: '#f59e0b', glow: '0 0 40px rgba(245, 158, 11, 0.8)' }
    };

    const card = {
      id: Date.now(),
      stock_id: selectedStock.id,
      stock_name: selectedStock.name,
      stock_code: selectedStock.code,
      sector: selectedStock.sector,
      rarity: selectedRarity,
      rarity_info: rarityConfigs[selectedRarity],
      is_new: Math.random() > 0.5 // 随机是否为新卡片
    };

    res.status(200).json({
      success: true,
      card: card,
      message: `恭喜获得${card.rarity_info.name}卡片：${card.stock_name}！`
    });
  } catch (error) {
    console.error('开箱失败:', error);
    res.status(500).json({
      success: false,
      message: '开箱失败: ' + error.message
    });
  }
}

