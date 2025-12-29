// API: /api/learning
// 合并的学习相关API端点

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
    // 从URL路径解析：/api/learning/questions -> questions
    // 在Vercel Serverless Functions中，动态路由参数通过req.query传递
    // 对于 api/learning/[path].js，访问 /api/learning/questions 时
    // path参数在 req.query.path 中（键名是文件名去掉方括号）
    
    let path = null;
    
    // 调试信息
    console.log('[Learning API] req.url:', req.url);
    console.log('[Learning API] req.query:', JSON.stringify(req.query));
    
    // 方法1: 尝试从req.query.path获取（Vercel标准方式）
    if (req.query && typeof req.query === 'object') {
      // Vercel会将动态路由参数放在req.query中，键名是文件名（去掉方括号）
      // 对于 [path].js，参数在 req.query.path
      path = req.query.path;
    }
    
    // 方法2: 从URL路径中解析（备用方案）
    if (!path && req.url) {
      const urlPath = req.url.split('?')[0]; // 去掉查询参数
      const parts = urlPath.split('/').filter(p => p); // 分割并过滤空字符串
      
      console.log('[Learning API] URL parts:', parts);
      
      // URL格式可能是：/api/learning/questions 或 /learning/questions
      // 查找 'learning' 的位置，下一个部分就是path
      const learningIndex = parts.indexOf('learning');
      if (learningIndex >= 0 && learningIndex < parts.length - 1) {
        path = parts[learningIndex + 1];
        console.log('[Learning API] Found path from URL:', path);
      }
    }
    
    // 方法3: 如果还是找不到，使用默认值
    if (!path) {
      path = 'questions';
      console.log('[Learning API] Using default path:', path);
    }
    
    console.log('[Learning API] Final path:', path);
    
    const stockId = (req.query && req.query.stock_id) || '1';
    const userId = (req.query && req.query.user_id) || '1';

    // 根据路径分发到不同的处理逻辑
    if (path === 'questions' || (!path && req.method === 'GET')) {
      // GET /api/learning/questions
      if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
      }

      // 根据stockId生成个性化问题（可以根据不同股票定制问题）
      const baseQuestions = [
        { id: 1, title: '这家公司是做什么的？', desc: '想了解公司的基本业务和主营业务', hot: true },
        { id: 2, title: '这家公司赚钱吗？', desc: '想了解公司的盈利能力和财务状况', hot: true },
        { id: 3, title: '现在买入合适吗？', desc: '想了解当前的投资价值和买入时机', hot: true },
        { id: 4, title: '这家公司有什么风险？', desc: '想了解投资这家公司可能面临的风险', hot: false },
        { id: 5, title: '新手应该怎么投资？', desc: '想了解适合新手的投资策略和方法', hot: true },
        { id: 6, title: '这家公司的竞争优势是什么？', desc: '想了解公司在行业中的竞争地位', hot: false },
        { id: 7, title: '这家公司未来发展前景如何？', desc: '想了解公司的成长潜力和发展空间', hot: false },
        { id: 8, title: '如何评估这家公司的投资价值？', desc: '想了解评估公司投资价值的方法和指标', hot: false }
      ];

      return res.status(200).json({ success: true, questions: baseQuestions });
    }

    if (path === 'hot-questions') {
      // GET /api/learning?path=hot-questions
      if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
      }

      const hotQuestions = [
        { id: 1, title: '这家公司是做什么的？', desc: '想了解公司的基本业务和主营业务', hot: true },
        { id: 2, title: '这家公司赚钱吗？', desc: '想了解公司的盈利能力和财务状况', hot: true },
        { id: 3, title: '现在买入合适吗？', desc: '想了解当前的投资价值和买入时机', hot: true }
      ];

      return res.status(200).json({ success: true, questions: hotQuestions });
    }

    if (path === 'select-question') {
      // POST /api/learning/select-question
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

      const { stock_id, question_id } = body;
      console.log(`User ${userId} selected question ${question_id} for stock ${stock_id}`);

      const selectedQuestion = { id: question_id, title: '示例问题', desc: '这是你选择的问题的详细描述。' };
      return res.status(200).json({ success: true, message: 'Questions selected', question: selectedQuestion });
    }

    if (path === 'levels') {
      // GET /api/learning?path=levels
      if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
      }

      const levels = [
        { id: 'simple', name: '简单模式', description: '适合新手，内容通俗易懂', icon: '🌱', color: 'from-green-400 to-emerald-500', unlocked: true, requiredCard: null },
        { id: 'advanced', name: '进阶模式', description: '深入分析，适合有一定基础的投资者', icon: '🚀', color: 'from-blue-400 to-cyan-500', unlocked: false, requiredCard: 'simple_complete' },
        { id: 'expert', name: '高级模式', description: '专业分析，适合经验丰富的投资者', icon: '💎', color: 'from-purple-400 to-pink-500', unlocked: false, requiredCard: 'advanced_complete' },
        { id: 'master', name: '大师模式', description: '深度研究，适合专业投资者', icon: '👑', color: 'from-yellow-400 to-orange-500', unlocked: false, requiredCard: 'expert_complete' }
      ];

      return res.status(200).json({ success: true, levels: levels });
    }

    // 未知路径
    return res.status(404).json({ success: false, message: 'Endpoint not found' });
  } catch (error) {
    console.error('Learning API error:', error);
    return res.status(500).json({
      success: false,
      message: 'API error: ' + error.message
    });
  }
};


