// API: /api/cards/collection
// 获取用户卡片收集情况

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

  const userId = req.query.user_id || '1';

  // 生成示例卡片数据
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

  // 生成卡片列表
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
        owned: index < 5 && rarityIndex < 2 // 前5只股票的前2种稀有度已拥有
      });
    });
  });

  // 统计数据
  const ownedCards = cards.filter(c => c.owned);
  const ownedCount = ownedCards.length;
  const totalCount = cards.length;
  
  const byRarity = {
    common: ownedCards.filter(c => c.rarity === 'common').length,
    rare: ownedCards.filter(c => c.rarity === 'rare').length,
    epic: ownedCards.filter(c => c.rarity === 'epic').length,
    legendary: ownedCards.filter(c => c.rarity === 'legendary').length
  };

  res.status(200).json({
    success: true,
    user_id: userId,
    cards: cards,
    owned_count: ownedCount,
    total_count: totalCount,
    by_rarity: byRarity
  });
}

