// API: /api/user/action
// 记录用户行为

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
    const actionData = req.body || {};
    
    // 记录用户行为（这里只是模拟，实际应该保存到数据库）
    console.log('用户行为记录:', actionData);

    res.status(200).json({
      success: true,
      message: '行为记录成功'
    });
  } catch (error) {
    console.error('记录用户行为失败:', error);
    res.status(500).json({
      success: false,
      message: '记录失败: ' + error.message
    });
  }
}

