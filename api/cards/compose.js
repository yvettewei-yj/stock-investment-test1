// API: /api/cards/compose
// 卡片合成

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
    const targetRarity = req.query.target_rarity || 'rare';

    // 稀有度映射
    const rarityMap = {
      'rare': { from: 'common', name: '稀有', color: '#3b82f6', glow: '0 0 20px rgba(59, 130, 246, 0.5)' },
      'epic': { from: 'rare', name: '史诗', color: '#8b5cf6', glow: '0 0 30px rgba(139, 92, 246, 0.6)' },
      'legendary': { from: 'epic', name: '传说', color: '#f59e0b', glow: '0 0 40px rgba(245, 158, 11, 0.8)' }
    };

    const config = rarityMap[targetRarity];
    if (!config) {
      return res.status(400).json({
        success: false,
        message: '无效的稀有度'
      });
    }

    // 随机生成合成后的卡片
    const stocks = [
      { id: 1, name: '贵州茅台', code: '600519', sector: '消费' },
      { id: 2, name: '宁德时代', code: '300750', sector: '新能源' },
      { id: 3, name: '招商银行', code: '600036', sector: '金融' },
      { id: 4, name: '腾讯控股', code: '00700', sector: '科技' },
      { id: 5, name: '中国平安', code: '601318', sector: '金融' }
    ];

    const selectedStock = stocks[Math.floor(Math.random() * stocks.length)];

    const card = {
      id: Date.now(),
      stock_id: selectedStock.id,
      stock_name: selectedStock.name,
      stock_code: selectedStock.code,
      sector: selectedStock.sector,
      rarity: targetRarity,
      rarity_info: {
        name: config.name,
        color: config.color,
        glow: config.glow
      },
      is_new: true
    };

    res.status(200).json({
      success: true,
      card: card,
      message: `合成成功！获得${config.name}卡片：${card.stock_name}！`
    });
  } catch (error) {
    console.error('卡片合成失败:', error);
    res.status(500).json({
      success: false,
      message: '卡片合成失败: ' + error.message
    });
  }
}

