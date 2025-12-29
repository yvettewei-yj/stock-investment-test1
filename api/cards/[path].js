// API: /api/cards
// 合并的卡片相关API端点

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
    // 从URL路径解析：/api/cards/collection -> collection
    let path = req.query.path;
    if (!path) {
      const urlPath = req.url.split('?')[0];
      const parts = urlPath.split('/').filter(p => p);
      if (parts.length >= 3 && parts[1] === 'cards') {
        path = parts[2];
      } else {
        path = 'collection';
      }
    }
    const userId = req.query.user_id || '1';

    if (path === 'collection' || (!path && req.method === 'GET')) {
      // GET /api/cards?path=collection
      if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
      }

      const stocks = [
        { id: 1, name: '贵州茅台', code: '600519', sector: '消费' },
        { id: 2, name: '宁德时代', code: '300750', sector: '新能源' },
        { id: 3, name: '招商银行', code: '600036', sector: '金融' },
        { id: 4, name: '腾讯控股', code: '00700', sector: '科技' },
        { id: 5, name: '中国平安', code: '601318', sector: '金融' },
        { id: 6, name: '比亚迪', code: '002594', sector: '新能源' },
        { id: 7, name: '美的集团', code: '000333', sector: '消费' },
        { id: 8, name: '隆基绿能', code: '601012', sector: '新能源' },
        { id: 9, name: '五粮液', code: '000858', sector: '消费' },
        { id: 10, name: '中国移动', code: '600941', sector: '通信' },
        { id: 11, name: '药明康德', code: '603259', sector: '医药' },
        { id: 12, name: '海天味业', code: '603288', sector: '消费' },
        { id: 13, name: '立讯精密', code: '002475', sector: '科技' },
        { id: 14, name: '万华化学', code: '600309', sector: '化工' },
        { id: 15, name: '长江电力', code: '600900', sector: '公用事业' }
      ];

      const rarities = ['common', 'rare', 'epic', 'legendary'];
      const rarityConfigs = {
        common: { name: '普通', color: '#9ca3af', glow: '0 0 20px rgba(156, 163, 175, 0.5)' },
        rare: { name: '稀有', color: '#3b82f6', glow: '0 0 20px rgba(59, 130, 246, 0.5)' },
        epic: { name: '史诗', color: '#8b5cf6', glow: '0 0 30px rgba(139, 92, 246, 0.6)' },
        legendary: { name: '传说', color: '#f59e0b', glow: '0 0 40px rgba(245, 158, 11, 0.8)' }
      };

      const cards = [];
      stocks.forEach((stock, index) => {
        rarities.forEach((rarity, rarityIndex) => {
          const cardId = `${stock.id}_${rarity}`;
          cards.push({
            id: cardId,
            stock_id: stock.id,
            stock_name: stock.name,
            stock_code: stock.code,
            sector: stock.sector,
            rarity: rarity,
            rarity_info: rarityConfigs[rarity],
            owned: index < 5 && rarityIndex < 2
          });
        });
      });

      const ownedCards = cards.filter(c => c.owned);
      const ownedCount = ownedCards.length;
      const totalCount = cards.length;
      
      const byRarity = {
        common: ownedCards.filter(c => c.rarity === 'common').length,
        rare: ownedCards.filter(c => c.rarity === 'rare').length,
        epic: ownedCards.filter(c => c.rarity === 'epic').length,
        legendary: ownedCards.filter(c => c.rarity === 'legendary').length
      };

      return res.status(200).json({
        success: true,
        user_id: userId,
        cards: cards,
        owned_count: ownedCount,
        total_count: totalCount,
        by_rarity: byRarity
      });
    }

    if (path === 'open-box') {
      // POST /api/cards/open-box
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
      }

      const rarityWeights = {
        common: 60,
        rare: 25,
        epic: 10,
        legendary: 5
      };

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

      const stocks = [
        { id: 1, name: '贵州茅台', code: '600519', sector: '消费' },
        { id: 2, name: '宁德时代', code: '300750', sector: '新能源' },
        { id: 3, name: '招商银行', code: '600036', sector: '金融' },
        { id: 4, name: '腾讯控股', code: '00700', sector: '科技' },
        { id: 5, name: '中国平安', code: '601318', sector: '金融' }
      ];

      const selectedStock = stocks[Math.floor(Math.random() * stocks.length)];

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
        is_new: Math.random() > 0.5
      };

      return res.status(200).json({
        success: true,
        card: card,
        message: `恭喜获得${card.rarity_info.name}卡片：${card.stock_name}！`
      });
    }

    if (path === 'compose') {
      // POST /api/cards/compose
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
      }

      const targetRarity = req.query.target_rarity;
      const rarityMap = {
        'rare': { from: 'common', name: '稀有', color: '#3b82f6' },
        'epic': { from: 'rare', name: '史诗', color: '#8b5cf6' },
        'legendary': { from: 'epic', name: '传说', color: '#f59e0b' }
      };

      const config = rarityMap[targetRarity];
      if (!config) {
        return res.status(400).json({ success: false, message: '无效的合成目标稀有度' });
      }

      const newCard = {
        id: `composed_card_${Date.now()}`,
        stock_id: Math.floor(Math.random() * 15) + 1,
        stock_name: '合成股票',
        stock_code: '000000',
        sector: '科技',
        rarity: targetRarity,
        rarity_info: { name: config.name, color: config.color },
        owned: true,
        is_new: true
      };

      return res.status(200).json({
        success: true,
        card: newCard,
        message: `成功合成一张${config.name}卡片！`
      });
    }

    return res.status(404).json({ success: false, message: 'Endpoint not found' });
  } catch (error) {
    console.error('Cards API error:', error);
    return res.status(500).json({
      success: false,
      message: 'API error: ' + error.message
    });
  }
};

