// API: /api/learning/select-question
// 选择问题并生成分析

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
    const { user_id, stock_id, question_ids } = req.body || {};

    // 生成问题分析内容
    const analysis = {
      summary: '根据你选择的问题，我们将为你提供深入的分析和解读，帮助你全面了解这家公司的投资价值。',
      points: [
        '我们将从多个角度为你解读这些问题',
        '内容通俗易懂，适合新手投资者',
        '结合具体案例和数据，让你更容易理解',
        '提供实用的投资建议和风险提示'
      ],
      conclusion: '通过系统学习，你将掌握投资分析的基本方法，为未来的投资决策打下坚实基础。'
    };

    res.status(200).json({
      success: true,
      analysis: analysis,
      message: '问题选择成功，开始学习之旅！'
    });
  } catch (error) {
    console.error('选择问题失败:', error);
    res.status(500).json({
      success: false,
      message: '选择问题失败: ' + error.message
    });
  }
}

