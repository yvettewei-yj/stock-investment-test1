// API: /api/checkin/status
// 返回用户签到状态

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

  const userId = req.query.user_id || '1';

  // 生成本月签到日历
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const calendar = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isToday = day === today.getDate();
    const checked = day <= today.getDate() && Math.random() > 0.3; // 随机已签到
    
    calendar.push({
      date: date.toISOString().split('T')[0],
      day: day,
      is_today: isToday,
      checked: checked
    });
  }

  // 计算连续签到天数
  let streak = 0;
  for (let i = calendar.length - 1; i >= 0; i--) {
    if (calendar[i].checked) {
      streak++;
    } else {
      break;
    }
  }

  // 签到奖励配置
  const rewards = [
    { day: 1, points: 10, name: '10积分', claimed: streak >= 1 },
    { day: 3, points: 30, name: '30积分', claimed: streak >= 3 },
    { day: 7, points: 100, name: '100积分 + 稀有卡片', claimed: streak >= 7 },
    { day: 14, points: 200, name: '200积分 + 史诗卡片', claimed: streak >= 14 },
    { day: 30, points: 500, name: '500积分 + 传说卡片', claimed: streak >= 30 }
  ];

  res.status(200).json({
    success: true,
    user_id: userId,
    already_checked: calendar.find(d => d.is_today)?.checked || false,
    streak: streak,
    total_days: calendar.filter(d => d.checked).length,
    calendar: calendar,
    rewards: rewards
  });
}

