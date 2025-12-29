// API: /api/challenge/start
// 开始限时挑战

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
    const userId = req.query.user_id || '1';

    // 生成5道挑战题目
    const questions = [
      {
        id: 1,
        question: '市盈率（PE）越低，说明股票越？',
        options: ['便宜', '贵', '风险高', '不确定'],
        correct: 0
      },
      {
        id: 2,
        question: 'ROE（净资产收益率）反映什么？',
        options: ['公司盈利能力', '股价涨跌', '市值大小', '成交量'],
        correct: 0
      },
      {
        id: 3,
        question: '新手最适合的投资策略是？',
        options: ['定投策略', '频繁交易', '一次性全仓', '追涨杀跌'],
        correct: 0
      },
      {
        id: 4,
        question: '投资股票应该控制仓位，不要投入超过自己承受能力的资金',
        options: ['正确', '错误'],
        correct: 0
      },
      {
        id: 5,
        question: '以下哪个是评估公司经营状况的指标？',
        options: ['营业收入', '股价涨跌', '成交量', '市值'],
        correct: 0
      }
    ];

    res.status(200).json({
      success: true,
      challenge: {
        id: Date.now(),
        questions: questions,
        time_limit: 60
      }
    });
  } catch (error) {
    console.error('开始挑战失败:', error);
    res.status(500).json({
      success: false,
      message: '开始挑战失败: ' + error.message
    });
  }
}

