// API: /api/achievements/list
// 返回成就列表

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

    // 成就列表
    const achievements = [
      {
        id: 'first_login',
        name: '初次见面',
        desc: '首次登录应用',
        icon: '👋',
        points: 10,
        unlocked: true
      },
      {
        id: 'first_learning',
        name: '学无止境',
        desc: '完成第一次学习',
        icon: '📚',
        points: 50,
        unlocked: false
      },
      {
        id: 'perfect_score',
        name: '完美答题',
        desc: '答题获得满分',
        icon: '⭐',
        points: 100,
        unlocked: false
      },
      {
        id: 'streak_7',
        name: '一周坚持',
        desc: '连续7天签到',
        icon: '🔥',
        points: 200,
        unlocked: false
      },
      {
        id: 'collect_10',
        name: '初级收藏家',
        desc: '收集10张卡片',
        icon: '🃏',
        points: 150,
        unlocked: false
      },
      {
        id: 'collect_all',
        name: '完美收藏家',
        desc: '收集所有卡片',
        icon: '👑',
        points: 500,
        unlocked: false
      },
      {
        id: 'mascot_evolve',
        name: '伙伴成长',
        desc: '吉祥物进化一次',
        icon: '🐣',
        points: 100,
        unlocked: false
      },
      {
        id: 'challenge_master',
        name: '挑战大师',
        desc: '限时挑战获得S级',
        icon: '🏆',
        points: 300,
        unlocked: false
      },
      {
        id: 'wheel_lucky',
        name: '幸运之星',
        desc: '转盘抽中传说卡片',
        icon: '🎰',
        points: 200,
        unlocked: false
      }
    ];

    const unlocked_count = achievements.filter(a => a.unlocked).length;
    const total_count = achievements.length;

    res.status(200).json({
      success: true,
      achievements: achievements,
      unlocked_count: unlocked_count,
      total_count: total_count
    });
  } catch (error) {
    console.error('获取成就列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取成就列表失败: ' + error.message
    });
  }
}

