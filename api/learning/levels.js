// API: /api/learning/levels
// 返回关卡列表

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
    const stockId = req.query.stock_id || '1';
    const userId = req.query.user_id || '1';

    // 生成关卡列表
    const levels = [
      {
        id: 'simple',
        name: '简单模式',
        description: '适合新手，内容通俗易懂',
        icon: '🌱',
        color: 'from-green-400 to-emerald-500',
        unlocked: true,
        requiredCard: null
      },
      {
        id: 'advanced',
        name: '进阶模式',
        description: '深入分析，适合有一定基础的投资者',
        icon: '🚀',
        color: 'from-blue-400 to-cyan-500',
        unlocked: false,
        requiredCard: 'simple_complete'
      },
      {
        id: 'expert',
        name: '高级模式',
        description: '专业分析，适合经验丰富的投资者',
        icon: '💎',
        color: 'from-purple-400 to-pink-500',
        unlocked: false,
        requiredCard: 'advanced_complete'
      },
      {
        id: 'master',
        name: '大师模式',
        description: '深度研究，适合专业投资者',
        icon: '👑',
        color: 'from-yellow-400 to-orange-500',
        unlocked: false,
        requiredCard: 'expert_complete'
      }
    ];

    res.status(200).json({
      success: true,
      levels: levels
    });
  } catch (error) {
    console.error('获取关卡列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取关卡列表失败: ' + error.message
    });
  }
}

