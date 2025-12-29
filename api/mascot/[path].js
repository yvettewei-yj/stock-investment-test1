// API: /api/mascot
// 合并的吉祥物相关API端点

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
    // 从URL路径解析：/api/mascot/status -> status
    const path = req.query.path || 'status';
    const userId = req.query.user_id || '1';

    if (path === 'status' || (!path && req.method === 'GET')) {
      // GET /api/mascot?path=status
      if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
      }

      const stages = ['🥚', '🐣', '🐥', '🦆', '🦚'];
      const stageNames = ['神秘蛋', '小财宝', '财宝宝', '小财神', '金凤凰'];
      
      const currentStage = 0;
      const exp = 0;
      const expToNext = 100;

      return res.status(200).json({
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

    if (path === 'feed') {
      // POST /api/mascot?path=feed
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
      }

      const expAmount = parseInt(req.query.exp_amount) || 10;
      let currentExp = 50;
      let expToNext = 100;
      let level = 1;
      let icon = '🥚';
      let name = '新手蛋';

      currentExp += expAmount;
      let evolved = false;
      if (currentExp >= expToNext) {
        level++;
        currentExp = currentExp - expToNext;
        expToNext = level * 100;
        evolved = true;
        if (level === 2) { icon = '🐣'; name = '小财宝'; }
        else if (level === 3) { icon = '🐥'; name = '财宝宝'; }
        else if (level === 4) { icon = '🦆'; name = '小财神'; }
        else if (level >= 5) { icon = '🦚'; name = '金凤凰'; }
      }

      return res.status(200).json({
        success: true,
        current_exp: currentExp,
        level: level,
        exp_to_next: expToNext,
        evolved: evolved,
        stage_icon: icon,
        message: `喂养成功，经验+${expAmount}！`
      });
    }

    if (path === 'evolve') {
      // POST /api/mascot?path=evolve
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
      }

      const newLevel = 2;
      const newIcon = '🐣';
      const newName = '小财宝';

      return res.status(200).json({
        success: true,
        mascot: {
          icon: newIcon,
          level: newLevel,
          name: newName,
          exp: 0,
          next_level_exp: newLevel * 100
        },
        message: `恭喜，你的吉祥物进化为${newName}！`
      });
    }

    return res.status(404).json({ success: false, message: 'Endpoint not found' });
  } catch (error) {
    console.error('Mascot API error:', error);
    return res.status(500).json({
      success: false,
      message: 'API error: ' + error.message
    });
  }
};

