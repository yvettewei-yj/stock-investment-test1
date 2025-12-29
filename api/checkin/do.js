// API: /api/checkin/do
// 执行签到

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

    // 计算签到奖励
    const basePoints = 10;
    const streakBonus = Math.floor(Math.random() * 5) + 1; // 随机连胜奖励
    const pointsEarned = basePoints + streakBonus;

    // 模拟连续签到天数（实际应该从数据库获取）
    const streak = Math.floor(Math.random() * 7) + 1;

    // 特殊奖励（连续7天）
    const specialRewards = streak >= 7 ? [
      { name: '稀有卡片', type: 'card', rarity: 'rare' }
    ] : [];

    res.status(200).json({
      success: true,
      points_earned: pointsEarned,
      streak: streak,
      special_rewards: specialRewards,
      message: `签到成功！获得${pointsEarned}积分，连续签到${streak}天！`
    });
  } catch (error) {
    console.error('签到失败:', error);
    res.status(500).json({
      success: false,
      message: '签到失败: ' + error.message
    });
  }
}

