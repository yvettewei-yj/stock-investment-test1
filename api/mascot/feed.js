// API: /api/mascot/feed
// 喂养吉祥物

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
    const expAmount = parseInt(req.query.exp_amount) || 10;

    // 模拟当前经验值（实际应该从数据库获取）
    const currentExp = Math.floor(Math.random() * 50) + expAmount;
    const expToNext = 100;
    const canEvolve = currentExp >= expToNext;

    res.status(200).json({
      success: true,
      current_exp: currentExp,
      exp_to_next: expToNext,
      evolved: canEvolve,
      stage_icon: canEvolve ? '🐥' : null,
      message: canEvolve ? '恭喜！吉祥物可以进化了！' : `获得${expAmount}经验值`
    });
  } catch (error) {
    console.error('喂养失败:', error);
    res.status(500).json({
      success: false,
      message: '喂养失败: ' + error.message
    });
  }
}

