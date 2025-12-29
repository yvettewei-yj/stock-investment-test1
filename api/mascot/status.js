// API: /api/mascot/status
// 返回用户吉祥物状态

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

  // 从查询参数获取 user_id
  const userId = req.query.user_id || '1';

  // 返回吉祥物状态（默认值）
  const stages = ['🥚', '🐣', '🐥', '🦆', '🦚'];
  const stageNames = ['神秘蛋', '小财宝', '财宝宝', '小财神', '金凤凰'];
  
  const currentStage = 0; // 默认第一阶段
  const exp = 0;
  const expToNext = 100;

  res.status(200).json({
    success: true,
    user_id: userId,
    mascot: {
      icon: stages[currentStage],
      level: currentStage + 1,
      name: stageNames[currentStage],
      exp: exp,
      exp_to_next: expToNext,
      can_evolve: exp >= expToNext,
      next_stage_icon: currentStage < stages.length - 1 ? stages[currentStage + 1] : null
    },
    messages: [
      '今天也要好好学习哦～',
      '答对题目我会很开心的！',
      '快来和我玩吧～',
      '连续签到可以让我成长！',
      '完成学习任务可以获得经验值！'
    ]
  });
}

