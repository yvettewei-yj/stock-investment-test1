// API: /api/learning/hot-questions
// 返回热门问题

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
    const stockId = req.query.stock_id || '1';

    // 返回热门问题
    const hotQuestions = [
      {
        id: 1,
        title: '这家公司是做什么的？',
        desc: '想了解公司的基本业务和主营业务',
        hot: true
      },
      {
        id: 2,
        title: '这家公司赚钱吗？',
        desc: '想了解公司的盈利能力和财务状况',
        hot: true
      },
      {
        id: 3,
        title: '现在买入合适吗？',
        desc: '想了解当前的投资价值和买入时机',
        hot: true
      }
    ];

    res.status(200).json({
      success: true,
      questions: hotQuestions
    });
  } catch (error) {
    console.error('获取热门问题失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热门问题失败: ' + error.message
    });
  }
}

