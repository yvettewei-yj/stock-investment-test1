// API: /api/mascot/evolve
// 进化吉祥物

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

    // 进化阶段
    const stages = ['🥚', '🐣', '🐥', '🦆', '🦚'];
    const stageNames = ['神秘蛋', '小财宝', '财宝宝', '小财神', '金凤凰'];

    // 模拟当前阶段（实际应该从数据库获取）
    const currentStage = Math.floor(Math.random() * (stages.length - 1));
    const nextStage = currentStage + 1;

    const mascot = {
      icon: stages[nextStage],
      name: stageNames[nextStage],
      level: nextStage + 1,
      exp: 0,
      exp_to_next: 100,
      can_evolve: false
    };

    res.status(200).json({
      success: true,
      mascot: mascot,
      new_icon: stages[nextStage],
      message: `恭喜！${stageNames[currentStage]}进化为${stageNames[nextStage]}！`
    });
  } catch (error) {
    console.error('进化失败:', error);
    res.status(500).json({
      success: false,
      message: '进化失败: ' + error.message
    });
  }
}

