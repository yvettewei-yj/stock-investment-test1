// API: /api/challenge/submit
// 提交挑战答案

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
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const answers = body.answers || {};

    // 题目答案（应该从数据库获取，这里使用示例）
    const correctAnswers = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    // 计算得分
    let correctCount = 0;
    const totalCount = Object.keys(correctAnswers).length;

    Object.keys(answers).forEach(questionId => {
      if (answers[questionId] === correctAnswers[questionId]) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / totalCount) * 100);
    const pointsEarned = correctCount * 20 + (score === 100 ? 100 : 0); // 每答对一题20分，满分额外100分
    const isPerfect = score === 100;

    res.status(200).json({
      success: true,
      score: score,
      correct_count: correctCount,
      total_count: totalCount,
      points_earned: pointsEarned,
      is_perfect: isPerfect
    });
  } catch (error) {
    console.error('提交挑战失败:', error);
    res.status(500).json({
      success: false,
      message: '提交挑战失败: ' + error.message
    });
  }
}

