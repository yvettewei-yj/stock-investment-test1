// API: /api/learning-map/generate
// 生成学习地图

module.exports = async function handler(req, res) {
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
    const likedStocks = req.body || [];

    // 股票数据映射
    const stockDataMap = {
      '贵州茅台': { id: 1, name: '贵州茅台', code: '600519', sector: '消费', industry: '白酒' },
      '宁德时代': { id: 2, name: '宁德时代', code: '300750', sector: '新能源', industry: '电池' },
      '招商银行': { id: 3, name: '招商银行', code: '600036', sector: '金融', industry: '银行' },
      '腾讯控股': { id: 4, name: '腾讯控股', code: '00700', sector: '科技', industry: '互联网' },
      '中国平安': { id: 5, name: '中国平安', code: '601318', sector: '金融', industry: '保险' },
      '比亚迪': { id: 6, name: '比亚迪', code: '002594', sector: '新能源', industry: '汽车' },
      '美的集团': { id: 7, name: '美的集团', code: '000333', sector: '消费', industry: '家电' },
      '隆基绿能': { id: 8, name: '隆基绿能', code: '601012', sector: '新能源', industry: '光伏' },
      '五粮液': { id: 9, name: '五粮液', code: '000858', sector: '消费', industry: '白酒' },
      '中国移动': { id: 10, name: '中国移动', code: '600941', sector: '通信', industry: '运营商' },
      '药明康德': { id: 11, name: '药明康德', code: '603259', sector: '医药', industry: 'CRO' },
      '海天味业': { id: 12, name: '海天味业', code: '603288', sector: '消费', industry: '食品' },
      '立讯精密': { id: 13, name: '立讯精密', code: '002475', sector: '科技', industry: '电子' },
      '万华化学': { id: 14, name: '万华化学', code: '600309', sector: '化工', industry: '化学' },
      '长江电力': { id: 15, name: '长江电力', code: '600900', sector: '公用事业', industry: '电力' }
    };

    // 生成学习路径（path）
    const path = likedStocks.map((stockName, index) => {
      const stockInfo = stockDataMap[stockName] || { id: index + 1, name: stockName, code: '000000', sector: '其他', industry: '其他' };
      return {
        id: stockInfo.id,
        name: stockInfo.name,
        stock_name: stockInfo.name,  // 前端使用的字段名
        code: stockInfo.code,
        stock_code: stockInfo.code,   // 前端使用的字段名
        sector: stockInfo.sector,
        industry: stockInfo.industry,
        order: index + 1,             // 节点顺序编号
        progress: index === 0 ? 0 : (index < 0 ? 100 : 0),  // 进度百分比
        status: index === 0 ? 'current' : (index < 0 ? 'completed' : 'locked'),
        is_today: index === 0,
        stars: index < 0 ? 3 : 0      // 已完成节点的星级
      };
    });

    // 生成学习地图数据
    const learningMap = {
      user_id: userId,
      stocks: likedStocks,
      path: path,
      completed_stocks: 0,
      total_stocks: likedStocks.length,
      total_stars: 0,
      modules: [
        {
          id: 1,
          title: '基础入门',
          description: '了解股票投资的基本概念和原理',
          progress: 0,
          lessons: [
            { id: 1, title: '什么是股票', completed: false },
            { id: 2, title: '股票市场基础', completed: false },
            { id: 3, title: '投资风险认知', completed: false }
          ]
        },
        {
          id: 2,
          title: '行业分析',
          description: '深入理解所选股票所属行业',
          progress: 0,
          lessons: [
            { id: 4, title: '行业发展趋势', completed: false },
            { id: 5, title: '行业竞争格局', completed: false },
            { id: 6, title: '行业投资逻辑', completed: false }
          ]
        },
        {
          id: 3,
          title: '公司研究',
          description: '学习如何分析公司基本面',
          progress: 0,
          lessons: [
            { id: 7, title: '财务报表解读', completed: false },
            { id: 8, title: '盈利能力分析', completed: false },
            { id: 9, title: '估值方法', completed: false }
          ]
        }
      ],
      generated_at: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      learning_map: learningMap,
      message: '学习地图生成成功'
    });
  } catch (error) {
    console.error('生成学习地图失败:', error);
    res.status(500).json({
      success: false,
      message: '生成学习地图失败: ' + error.message
    });
  }
}

