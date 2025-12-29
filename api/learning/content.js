// API: /api/learning/content
// 返回学习内容

// 辅助函数：获取公司描述
function getCompanyDescription(stock) {
  const descriptions = {
    '白酒': '生产和销售高端白酒产品，拥有强大的品牌影响力和稳定的消费群体',
    '电池': '研发和生产新能源汽车动力电池，是新能源产业链的核心环节',
    '银行': '提供存贷款、理财等金融服务，是金融体系的重要组成部分',
    '互联网': '提供互联网社交、游戏、广告等服务，连接亿万用户',
    '保险': '提供保险保障和金融服务，帮助客户管理风险',
    '汽车': '研发和生产新能源汽车，推动汽车产业转型升级',
    '家电': '生产和销售各类家电产品，满足家庭生活需求',
    '光伏': '研发和生产光伏组件，推动清洁能源发展',
    '食品': '生产和销售调味品等食品，是日常消费必需品',
    '运营商': '提供通信服务，连接人与人、人与信息',
    'CRO': '为医药企业提供研发外包服务，是医药产业链的重要环节',
    '电子': '为消费电子提供精密制造服务，是产业链的关键环节',
    '化学': '研发和生产化工产品，服务于多个下游行业',
    '电力': '运营水电站，提供清洁电力，是能源基础设施'
  };
  return descriptions[stock.industry] || '提供优质的产品和服务';
}

// 辅助函数：获取竞争优势
function getCompetitiveAdvantage(stock) {
  const advantages = {
    '白酒': '品牌历史悠久、产品品质卓越、渠道网络完善',
    '电池': '技术领先、产能规模大、客户资源丰富',
    '银行': '网点覆盖广、风控能力强、服务专业',
    '互联网': '用户基数大、产品生态完善、技术实力强',
    '保险': '品牌信誉好、产品线丰富、服务网络广',
    '汽车': '技术研发强、产品线丰富、市场认可度高',
    '家电': '品牌知名度高、产品品质好、渠道优势明显',
    '光伏': '技术先进、成本控制好、市场地位稳固',
    '食品': '品牌影响力大、产品质量好、渠道覆盖广',
    '运营商': '网络覆盖广、服务质量好、用户基数大',
    'CRO': '技术实力强、服务经验丰富、客户资源优质',
    '电子': '技术先进、制造能力强、客户关系稳定',
    '化学': '技术领先、产品线丰富、市场地位稳固',
    '电力': '资源禀赋好、运营效率高、现金流稳定'
  };
  return advantages[stock.industry] || '技术先进、市场地位稳固';
}

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

    // 根据股票ID生成学习内容（这里使用示例数据，实际应该根据股票ID查询）
    const stockData = {
      1: { name: '贵州茅台', sector: '消费', industry: '白酒' },
      2: { name: '宁德时代', sector: '新能源', industry: '电池' },
      3: { name: '招商银行', sector: '金融', industry: '银行' },
      4: { name: '腾讯控股', sector: '科技', industry: '互联网' },
      5: { name: '中国平安', sector: '金融', industry: '保险' },
      6: { name: '比亚迪', sector: '新能源', industry: '汽车' },
      7: { name: '美的集团', sector: '消费', industry: '家电' },
      8: { name: '隆基绿能', sector: '新能源', industry: '光伏' },
      9: { name: '五粮液', sector: '消费', industry: '白酒' },
      10: { name: '中国移动', sector: '通信', industry: '运营商' },
      11: { name: '药明康德', sector: '医药', industry: 'CRO' },
      12: { name: '海天味业', sector: '消费', industry: '食品' },
      13: { name: '立讯精密', sector: '科技', industry: '电子' },
      14: { name: '万华化学', sector: '化工', industry: '化学' },
      15: { name: '长江电力', sector: '公用事业', industry: '电力' }
    };

    const stock = stockData[stockId] || stockData[1];

    // 生成针对新手的学习内容
    const learningContent = {
      company_info: {
        title: '公司基本情况',
        sections: [
          {
            title: '🏢 公司是做什么的？',
            content: `${stock.name}是一家${stock.industry}行业的${stock.sector}类公司。简单来说，这家公司的主要业务是${getCompanyDescription(stock)}。`,
            tips: [
              '💡 小贴士：了解公司主营业务是投资的第一步',
              '📊 行业地位：这家公司在${stock.industry}行业处于领先地位',
              '🎯 投资价值：${stock.sector}行业通常具有稳定的现金流'
            ]
          },
          {
            title: '📈 公司规模有多大？',
            content: `${stock.name}是一家大型上市公司，在A股市场（或港股市场）中市值排名靠前。作为${stock.industry}行业的龙头企业，公司拥有较强的市场影响力。`,
            tips: [
              '💰 市值：大型公司通常更稳定，适合新手投资',
              '🏆 行业地位：龙头企业往往有更强的竞争优势',
              '📊 市场表现：可以关注公司的股价走势和成交量'
            ]
          },
          {
            title: '🌟 公司有什么特色？',
            content: `${stock.name}的核心竞争力在于${getCompetitiveAdvantage(stock)}。这些优势使得公司在${stock.industry}行业中脱颖而出，成为投资者关注的热点。`,
            tips: [
              '🔑 核心竞争力：这是公司长期发展的基础',
              '💎 护城河：强大的竞争优势可以保护公司利润',
              '🚀 成长潜力：关注公司的创新能力和市场拓展'
            ]
          }
        ]
      },
      operation: {
        title: '公司经营情况',
        sections: [
          {
            title: '💰 公司赚钱吗？',
            content: `${stock.name}作为${stock.industry}行业的龙头企业，通常具有稳定的盈利能力。公司的营业收入和净利润在过去几年保持增长趋势，显示出良好的经营状况。`,
            tips: [
              '📊 盈利能力：关注公司的净利润率和ROE（净资产收益率）',
              '📈 增长趋势：持续增长的公司更有投资价值',
              '💵 现金流：充足的现金流是公司健康运营的保障'
            ]
          },
          {
            title: '📊 公司经营效率如何？',
            content: `公司的经营效率主要体现在资产周转率、存货周转率等指标上。${stock.name}作为行业龙头，通常具有较高的经营效率，能够有效利用资源创造价值。`,
            tips: [
              '⚡ 资产周转：高效的资产利用可以提升盈利能力',
              '📦 存货管理：合理的存货水平反映公司管理水平',
              '🎯 成本控制：优秀的成本控制能力是竞争优势'
            ]
          }
        ],
        operation_detail: {
          title: '公司经营情况（深入分析）',
          sections: [
            {
              title: '🔍 财务指标解读',
              content: `让我们深入了解一下${stock.name}的关键财务指标：`,
              metrics: [
                { name: '营业收入', value: '持续增长', meaning: '说明公司业务在扩张' },
                { name: '净利润率', value: '行业领先', meaning: '说明公司盈利能力强' },
                { name: 'ROE', value: '稳定在较高水平', meaning: '说明股东回报率高' },
                { name: '负债率', value: '合理范围', meaning: '说明财务风险可控' }
              ]
            },
            {
              title: '📈 业务发展趋势',
              content: `${stock.name}的业务发展呈现出以下特点：`,
              trends: [
                '主营业务稳定增长，市场份额持续提升',
                '新产品/服务不断推出，创新能力强',
                '市场拓展顺利，业务覆盖范围扩大',
                '客户满意度高，品牌影响力不断提升'
              ]
            }
          ]
        }
      },
      valuation: {
        title: '投资性价比',
        sections: [
          {
            title: '💎 公司值多少钱？',
            content: `评估${stock.name}的投资价值，我们需要关注几个关键指标：`,
            indicators: [
              {
                name: '市盈率（PE）',
                explanation: '反映股价相对于每股收益的倍数，越低说明越便宜',
                value: '当前PE处于合理区间'
              },
              {
                name: '市净率（PB）',
                explanation: '反映股价相对于每股净资产的倍数',
                value: 'PB值适中，投资价值合理'
              },
              {
                name: '股息率',
                explanation: '公司每年分红占股价的比例',
                value: '股息率稳定，适合长期投资'
              }
            ]
          },
          {
            title: '🎯 现在买入合适吗？',
            content: `对于新手投资者来说，${stock.name}是一个相对稳健的选择：`,
            reasons: [
              '✅ 公司基本面良好，经营稳定',
              '✅ 行业地位稳固，竞争优势明显',
              '✅ 估值合理，投资风险可控',
              '✅ 适合长期持有，可以获得稳定回报'
            ],
            warning: '⚠️ 投资有风险，建议分批买入，不要一次性投入全部资金'
          }
        ]
      },
      investment_strategy: {
        title: '投资攻略',
        sections: [
          {
            title: '📋 新手投资策略',
            content: `作为新手，投资${stock.name}可以遵循以下策略：`,
            strategies: [
              {
                title: '💰 定投策略',
                content: '每月固定投入一定金额，长期持有，可以降低投资成本，分散风险',
                icon: '📅'
              },
              {
                title: '🎯 分批买入',
                content: '不要一次性买入，可以分3-5次逐步建仓，降低买入时机的风险',
                icon: '📊'
              },
              {
                title: '⏰ 长期持有',
                content: '优质公司适合长期持有，不要频繁买卖，避免交易成本',
                icon: '🏆'
              },
              {
                title: '📈 关注基本面',
                content: '定期关注公司财报和行业动态，但不要过度关注短期波动',
                icon: '📰'
              }
            ]
          },
          {
            title: '⚠️ 风险提示',
            content: '投资股票需要注意以下风险：',
            risks: [
              '市场风险：股价可能因市场波动而下跌',
              '行业风险：行业政策变化可能影响公司业绩',
              '公司风险：公司经营可能出现问题',
              '流动性风险：可能无法及时卖出股票'
            ],
            advice: '💡 建议：新手投资者应该控制仓位，不要投入超过自己承受能力的资金'
          }
        ]
      }
    };

    // 生成答题测试
    const sectionQuizzes = {
      1: [
        {
          type: 'single',
          question: `${stock.name}属于哪个行业？`,
          options: [stock.industry, '科技', '金融', '消费'],
          correct: 0,
          explanation: `正确！${stock.name}属于${stock.industry}行业。了解公司所属行业是投资分析的第一步。`
        },
        {
          type: 'truefalse',
          question: `${stock.name}是行业龙头企业`,
          options: ['正确', '错误'],
          correct: 0,
          explanation: `正确！${stock.name}在${stock.industry}行业中处于领先地位，是行业龙头企业。`
        }
      ],
      2: [
        {
          type: 'single',
          question: '评估公司盈利能力最重要的指标是？',
          options: ['净利润率', '股价', '市值', '成交量'],
          correct: 0,
          explanation: '正确！净利润率是评估公司盈利能力的重要指标，反映公司每收入1元能赚多少钱。'
        },
        {
          type: 'multiple',
          question: '以下哪些是评估公司经营状况的指标？（可多选）',
          options: ['营业收入', '净利润', '股价涨跌', 'ROE'],
          correct: [0, 1, 3],
          explanation: '正确！营业收入、净利润和ROE都是评估公司经营状况的重要指标，而股价涨跌更多反映市场情绪。'
        }
      ],
      3: [
        {
          type: 'single',
          question: '市盈率（PE）越低，说明股票越？',
          options: ['便宜', '贵', '风险高', '不确定'],
          correct: 0,
          explanation: '正确！市盈率越低，说明股价相对于每股收益越便宜，投资价值可能更高。'
        },
        {
          type: 'sort',
          question: '请按投资风险从低到高排序：',
          options: ['大型蓝筹股', '小型成长股', 'ST股票', '新股'],
          correct: [0, 1, 3, 2],
          explanation: '正确！大型蓝筹股风险最低，其次是小型成长股和新股，ST股票风险最高。'
        }
      ],
      4: [
        {
          type: 'single',
          question: '新手最适合的投资策略是？',
          options: ['定投策略', '频繁交易', '一次性全仓', '追涨杀跌'],
          correct: 0,
          explanation: '正确！定投策略适合新手，可以降低投资成本，分散风险，长期持有获得稳定回报。'
        },
        {
          type: 'truefalse',
          question: '投资股票应该控制仓位，不要投入超过自己承受能力的资金',
          options: ['正确', '错误'],
          correct: 0,
          explanation: '正确！这是非常重要的投资原则，新手尤其要注意风险控制。'
        }
      ],
      5: [
        {
          type: 'multiple',
          question: '投资股票需要注意哪些风险？（可多选）',
          options: ['市场风险', '行业风险', '公司风险', '没有风险'],
          correct: [0, 1, 2],
          explanation: '正确！投资股票存在市场风险、行业风险和公司风险，需要充分了解并做好风险管理。'
        }
      ]
    };

    res.status(200).json({
      success: true,
      content: learningContent,
      section_quizzes: sectionQuizzes,
      question_analysis: {
        summary: `关于${stock.name}，我们将从公司基本情况、经营状况、投资价值和投资策略四个方面为你深入解读。`,
        points: [
          `${stock.name}是${stock.industry}行业的龙头企业`,
          '公司经营稳定，盈利能力较强',
          '投资价值合理，适合长期持有',
          '新手可以采用定投策略逐步建仓'
        ],
        conclusion: '通过系统学习，你将全面了解这家公司的投资价值，为投资决策打下基础。'
      }
    });
  } catch (error) {
    console.error('生成学习内容失败:', error);
    res.status(500).json({
      success: false,
      message: '生成学习内容失败: ' + error.message
    });
  }
};

// 辅助函数：获取公司描述
function getCompanyDescription(stock) {
  const descriptions = {
    '白酒': '生产和销售高端白酒产品，拥有强大的品牌影响力和稳定的消费群体',
    '电池': '研发和生产新能源汽车动力电池，是新能源产业链的核心环节',
    '银行': '提供存贷款、理财等金融服务，是金融体系的重要组成部分',
    '互联网': '提供互联网社交、游戏、广告等服务，连接亿万用户',
    '保险': '提供保险保障和金融服务，帮助客户管理风险',
    '汽车': '研发和生产新能源汽车，推动汽车产业转型升级',
    '家电': '生产和销售各类家电产品，满足家庭生活需求',
    '光伏': '研发和生产光伏组件，推动清洁能源发展',
    '食品': '生产和销售调味品等食品，是日常消费必需品',
    '运营商': '提供通信服务，连接人与人、人与信息',
    'CRO': '为医药企业提供研发外包服务，是医药产业链的重要环节',
    '电子': '为消费电子提供精密制造服务，是产业链的关键环节',
    '化学': '研发和生产化工产品，服务于多个下游行业',
    '电力': '运营水电站，提供清洁电力，是能源基础设施'
  };
  return descriptions[stock.industry] || '提供优质的产品和服务';
}

// 辅助函数：获取竞争优势
function getCompetitiveAdvantage(stock) {
  const advantages = {
    '白酒': '品牌历史悠久、产品品质卓越、渠道网络完善',
    '电池': '技术领先、产能规模大、客户资源丰富',
    '银行': '网点覆盖广、风控能力强、服务专业',
    '互联网': '用户基数大、产品生态完善、技术实力强',
    '保险': '品牌信誉好、产品线丰富、服务网络广',
    '汽车': '技术研发强、产品线丰富、市场认可度高',
    '家电': '品牌知名度高、产品品质好、渠道优势明显',
    '光伏': '技术先进、成本控制好、市场地位稳固',
    '食品': '品牌影响力大、产品质量好、渠道覆盖广',
    '运营商': '网络覆盖广、服务质量好、用户基数大',
    'CRO': '技术实力强、服务经验丰富、客户资源优质',
    '电子': '技术先进、制造能力强、客户关系稳定',
    '化学': '技术领先、产品线丰富、市场地位稳固',
    '电力': '资源禀赋好、运营效率高、现金流稳定'
  };
  return advantages[stock.industry] || '技术先进、市场地位稳固';
}

