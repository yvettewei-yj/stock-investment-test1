// API: /api/challenge
// 合并的挑战相关API端点

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
    // 从URL路径解析：/api/challenge/start -> start
    let path = req.query.path;
    if (!path) {
      const urlPath = req.url.split('?')[0];
      const parts = urlPath.split('/').filter(p => p);
      if (parts.length >= 3 && parts[1] === 'challenge') {
        path = parts[2];
      } else {
        path = 'start';
      }
    }
    const userId = req.query.user_id || '1';

    if (path === 'start' || (!path && req.method === 'GET')) {
      // GET /api/challenge?path=start
      if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
      }

      const questions = [
        { id: 1, question: '以下哪个不是股票投资的风险？', options: ['市场风险', '行业风险', '公司风险', '天气风险'], correct: 3 },
        { id: 2, question: '市盈率（PE）是衡量公司哪个方面的指标？', options: ['盈利能力', '成长性', '估值水平', '负债水平'], correct: 2 },
        { id: 3, question: '"护城河"在投资中指的是什么？', options: ['公司所在地有河流', '公司的竞争优势', '公司的财务状况', '公司的员工福利'], correct: 1 },
        { id: 4, question: '新手投资者最适合的策略是？', options: ['频繁交易', '追涨杀跌', '定投策略', '借钱炒股'], correct: 2 },
        { id: 5, question: '以下哪个是判断公司是否赚钱的指标？', options: ['营业收入', '净利润', '总资产', '总负债'], correct: 1 }
      ];

      return res.status(200).json({
        success: true,
        challenge: {
          id: 'challenge_1',
          questions: questions,
          duration: 60,
          total_questions: questions.length
        }
      });
    }

    if (path === 'submit') {
      // POST /api/challenge/submit
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
      }

      // 解析POST请求体
      let body = {};
      if (req.body) {
        try {
          body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        } catch (e) {
          body = req.body;
        }
      }

      const { answers } = body;
      const correctAnswers = [3, 2, 1, 2, 1];
      let correctCount = 0;
      for (const qId in answers) {
        if (answers[qId] === correctAnswers[parseInt(qId) - 1]) {
          correctCount++;
        }
      }

      const totalQuestions = correctAnswers.length;
      const score = (correctCount / totalQuestions) * 100;
      let pointsEarned = correctCount * 20;
      let isPerfect = false;
      if (correctCount === totalQuestions) {
        pointsEarned += 100;
        isPerfect = true;
      }

      return res.status(200).json({
        success: true,
        score: score,
        correct_count: correctCount,
        total_count: totalQuestions,
        points_earned: pointsEarned,
        is_perfect: isPerfect,
        message: '挑战完成！'
      });
    }

    return res.status(404).json({ success: false, message: 'Endpoint not found' });
  } catch (error) {
    console.error('Challenge API error:', error);
    return res.status(500).json({
      success: false,
      message: 'API error: ' + error.message
    });
  }
};

