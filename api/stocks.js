// API: /api/stocks
// 返回股票列表数据

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

  // 返回股票数据
  const stocks = [
    { id: 1, name: '贵州茅台', code: '600519', desc: '白酒龙头，现金流之王', sector: '消费', industry: '白酒', style: 'value', risk: 'low' },
    { id: 2, name: '宁德时代', code: '300750', desc: '新能源电池核心玩家', sector: '新能源', industry: '电池', style: 'growth', risk: 'high' },
    { id: 3, name: '招商银行', code: '600036', desc: '零售银行标杆', sector: '金融', industry: '银行', style: 'value', risk: 'low' },
    { id: 4, name: '腾讯控股', code: '00700', desc: '互联网社交巨头', sector: '科技', industry: '互联网', style: 'growth', risk: 'medium' },
    { id: 5, name: '中国平安', code: '601318', desc: '综合金融服务商', sector: '金融', industry: '保险', style: 'value', risk: 'low' },
    { id: 6, name: '比亚迪', code: '002594', desc: '新能源汽车领军者', sector: '新能源', industry: '汽车', style: 'growth', risk: 'high' },
    { id: 7, name: '美的集团', code: '000333', desc: '家电行业龙头', sector: '消费', industry: '家电', style: 'balanced', risk: 'medium' },
    { id: 8, name: '隆基绿能', code: '601012', desc: '光伏产业领导者', sector: '新能源', industry: '光伏', style: 'growth', risk: 'high' },
    { id: 9, name: '五粮液', code: '000858', desc: '白酒行业巨头', sector: '消费', industry: '白酒', style: 'value', risk: 'low' },
    { id: 10, name: '中国移动', code: '600941', desc: '通信运营商龙头', sector: '通信', industry: '运营商', style: 'value', risk: 'low' },
    { id: 11, name: '药明康德', code: '603259', desc: '医药研发外包领军', sector: '医药', industry: 'CRO', style: 'growth', risk: 'medium' },
    { id: 12, name: '海天味业', code: '603288', desc: '调味品行业龙头', sector: '消费', industry: '食品', style: 'value', risk: 'low' },
    { id: 13, name: '立讯精密', code: '002475', desc: '消费电子精密制造', sector: '科技', industry: '电子', style: 'growth', risk: 'medium' },
    { id: 14, name: '万华化学', code: '600309', desc: '化工行业领军者', sector: '化工', industry: '化学', style: 'balanced', risk: 'medium' },
    { id: 15, name: '长江电力', code: '600900', desc: '水电行业龙头', sector: '公用事业', industry: '电力', style: 'value', risk: 'low' }
  ];

  res.status(200).json(stocks);
}

