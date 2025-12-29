// API: /api/learning/questions
// 返回问题列表

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

    // 生成针对新手的热门问题
    const questions = [
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
      },
      {
        id: 4,
        title: '这家公司有什么风险？',
        desc: '想了解投资这家公司可能面临的风险',
        hot: false
      },
      {
        id: 5,
        title: '新手应该怎么投资？',
        desc: '想了解适合新手的投资策略和方法',
        hot: true
      },
      {
        id: 6,
        title: '这家公司的竞争优势是什么？',
        desc: '想了解公司在行业中的竞争地位',
        hot: false
      },
      {
        id: 7,
        title: '这家公司未来发展前景如何？',
        desc: '想了解公司的成长潜力和发展空间',
        hot: false
      },
      {
        id: 8,
        title: '如何评估这家公司的投资价值？',
        desc: '想了解评估公司投资价值的方法和指标',
        hot: false
      }
    ];

    res.status(200).json({
      success: true,
      questions: questions
    });
  } catch (error) {
    console.error('获取问题列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取问题列表失败: ' + error.message
    });
  }
}

