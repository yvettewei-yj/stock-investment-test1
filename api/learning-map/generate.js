// API: /api/learning-map/generate
// 生成学习地图

module.exports = async function handler(req, res) {
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
    const likedStocks = req.body || [];

    // 生成学习地图数据
    const learningMap = {
      user_id: userId,
      stocks: likedStocks,
      modules: [
        {
          id: 1,
          title: '基础入门',
          description: '了解股票投资的基本概念和原理',
          progress: 0,
          lessons: [
            { id: 1, title: '什么是股票', completed: false },
            { id: 2, title: '股票市场基础', completed: false },
            { id: 3, title: '投资风险认知', completed: false }
          ]
        },
        {
          id: 2,
          title: '行业分析',
          description: '深入理解所选股票所属行业',
          progress: 0,
          lessons: [
            { id: 4, title: '行业发展趋势', completed: false },
            { id: 5, title: '行业竞争格局', completed: false },
            { id: 6, title: '行业投资逻辑', completed: false }
          ]
        },
        {
          id: 3,
          title: '公司研究',
          description: '学习如何分析公司基本面',
          progress: 0,
          lessons: [
            { id: 7, title: '财务报表解读', completed: false },
            { id: 8, title: '盈利能力分析', completed: false },
            { id: 9, title: '估值方法', completed: false }
          ]
        }
      ],
      generated_at: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      learning_map: learningMap,
      message: '学习地图生成成功'
    });
  } catch (error) {
    console.error('生成学习地图失败:', error);
    res.status(500).json({
      success: false,
      message: '生成学习地图失败: ' + error.message
    });
  }
}

