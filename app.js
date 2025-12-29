/***********************
 * 全局状态管理
 ***********************/
const AppState = {
    userId: 1,
    currentUser: null,
    currentStockIndex: 0,
    stocks: [],
    leftSwipedStocks: [],  // 左滑（不感兴趣）的股票
    rightSwipedStocks: [], // 右滑（感兴趣）的股票
    swipeCount: 0,
    totalSwipeTarget: 15,  // 需要滑动15支股票
    mbtiResult: null,
    
    // 积分系统
    points: 0,              // 当前总积分
    todayPoints: 0,         // 今日获得积分
    isSubscribed: false,    // 是否已订阅
    
    // 积分规则
    pointsConfig: {
        correctAnswer: 10,      // 答对一题 +10分
        wrongAnswer: 3,         // 答错也有 +3分（鼓励学习）
        completeLevel: 20,      // 完成一个关卡 +20分
        completeStock: 100,     // 点亮一只股票 +100分
        perfectScore: 50,       // 全对额外奖励 +50分
        dailyLogin: 10,         // 每日登录 +10分
        subscribe: 200          // 订阅奖励 +200分
    }
};

/***********************
 * 工具函数
 ***********************/
const Utils = {
    // 显示指定页面
    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }
    },

    // API请求封装
    async apiRequest(url, options = {}) {
        try {
            // 处理body参数
            const requestOptions = {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            };
            
            // 如果body是对象，转换为JSON字符串
            if (requestOptions.body && typeof requestOptions.body === 'object') {
                requestOptions.body = JSON.stringify(requestOptions.body);
            }
            
            const response = await fetch(`/api${url}`, requestOptions);
            
            if (!response.ok) {
                let errorText = '';
                try {
                    errorText = await response.text();
                } catch (e) {
                    errorText = response.statusText;
                }
                throw new Error(`API请求失败 [${response.status}]: ${errorText || response.statusText}`);
            }
            
            // 尝试解析JSON响应
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error('API请求错误:', error.message || error);
            // 只在非手动抛出的错误时显示toast
            if (!error.message || !error.message.includes('API请求失败')) {
                Utils.showToast(error.message || 'API请求失败，请重试');
            }
            throw error;
        }
    },

    // 显示提示消息
    showToast(message, duration = 2000) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

/***********************
 * 规则弹窗模块
 ***********************/
const RuleModal = {
    show() {
        const modal = document.getElementById('ruleModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.remove('hidden');
        }
    },

    hide() {
        const modal = document.getElementById('ruleModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    },

    init() {
        const closeBtn = document.getElementById('closeRuleModal');
        const startBtn = document.getElementById('startLearning');
        
        if (closeBtn) {
            closeBtn.onclick = () => this.hide();
        }
        
        if (startBtn) {
            startBtn.onclick = () => {
                this.hide();
                SwipeModule.init();
            };
        }
    }
};

/***********************
 * 滑动选股模块
 ***********************/
const SwipeModule = {
    currentCard: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,

    async init() {
        Utils.showPage('swipe-page');
        
        // 加载股票数据
        if (AppState.stocks.length === 0) {
            await this.loadStocks();
        }
        
        this.renderCurrentCard();
        this.updateProgress();
    },

    async loadStocks() {
        try {
            // 从后端API加载股票数据
            const stocks = await Utils.apiRequest('/stocks');
            
            // 为股票数据添加MBTI分析所需的字段（如果后端没有提供）
            AppState.stocks = stocks.map(stock => ({
                ...stock,
                industry: stock.industry || stock.sector || '其他',
                style: stock.style || (stock.sector === '消费' || stock.sector === '金融' ? 'value' : 
                       stock.sector === '新能源' || stock.sector === '科技' ? 'growth' : 'balanced'),
                risk: stock.risk || (stock.sector === '新能源' ? 'high' : 
                      stock.sector === '消费' || stock.sector === '金融' ? 'low' : 'medium')
            }));
        } catch (error) {
            console.error('加载股票数据失败:', error);
            // 如果API失败，使用备用数据
            AppState.stocks = [
                { id: 1, name: '贵州茅台', code: '600519', desc: '白酒龙头，现金流之王', sector: '消费', industry: '白酒', style: 'value', risk: 'low' },
                { id: 2, name: '宁德时代', code: '300750', desc: '新能源电池核心玩家', sector: '新能源', industry: '电池', style: 'growth', risk: 'high' },
                { id: 3, name: '招商银行', code: '600036', desc: '零售银行标杆', sector: '金融', industry: '银行', style: 'value', risk: 'low' },
                { id: 4, name: '腾讯控股', code: '00700', desc: '互联网社交巨头', sector: '科技', industry: '互联网', style: 'growth', risk: 'medium' },
                { id: 5, name: '中国平安', code: '601318', desc: '综合金融服务商', sector: '金融', industry: '保险', style: 'value', risk: 'low' },
                { id: 6, name: '比亚迪', code: '002594', desc: '新能源汽车领军者', sector: '新能源', industry: '汽车', style: 'growth', risk: 'high' },
                { id: 7, name: '美的集团', code: '000333', desc: '家电行业龙头', sector: '消费', industry: '家电', style: 'balanced', risk: 'medium' },
                { id: 8, name: '隆基绿能', code: '601012', desc: '光伏产业领导者', sector: '新能源', industry: '光伏', style: 'growth', risk: 'high' },
                { id: 9, name: '五粮液', code: '000858', desc: '白酒行业巨头', sector: '消费', industry: '白酒', style: 'value', risk: 'low' },
                { id: 10, name: '中国移动', code: '600941', desc: '通信运营商龙头', sector: '通信', industry: '运营商', style: 'value', risk: 'low' },
                { id: 11, name: '药明康德', code: '603259', desc: '医药研发外包领军', sector: '医药', industry: 'CRO', style: 'growth', risk: 'medium' },
                { id: 12, name: '海天味业', code: '603288', desc: '调味品行业龙头', sector: '消费', industry: '食品', style: 'value', risk: 'low' },
                { id: 13, name: '立讯精密', code: '002475', desc: '消费电子精密制造', sector: '科技', industry: '电子', style: 'growth', risk: 'medium' },
                { id: 14, name: '万华化学', code: '600309', desc: '化工行业领军者', sector: '化工', industry: '化学', style: 'balanced', risk: 'medium' },
                { id: 15, name: '长江电力', code: '600900', desc: '水电行业龙头', sector: '公用事业', industry: '电力', style: 'value', risk: 'low' }
            ];
            Utils.showToast('使用备用数据，部分功能可能受限');
        }
    },

    renderCurrentCard() {
        const container = document.getElementById('swipeCardContainer');
        if (!container) return;

        // 检查是否完成所有滑动
        if (AppState.currentStockIndex >= AppState.stocks.length || 
            AppState.swipeCount >= AppState.totalSwipeTarget) {
            this.showCompletionPrompt();
            return;
        }

        const stock = AppState.stocks[AppState.currentStockIndex];
        
        container.innerHTML = `
            <div class="stock-card" id="currentStockCard">
                <div class="swipe-indicator left" id="leftIndicator">✕</div>
                <div class="swipe-indicator right" id="rightIndicator">♥</div>
                
                <div class="p-8">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-3xl font-bold text-gray-800 mb-2">${stock.name}</h3>
                            <p class="text-gray-500 text-lg">${stock.code}</p>
                        </div>
                        <div class="text-right">
                            <span class="badge sector">${stock.sector}</span>
                            <span class="badge industry mt-2 inline-block">${stock.industry}</span>
                        </div>
                    </div>
                    
                    <p class="text-gray-600 text-xl mb-6 leading-relaxed">${stock.desc}</p>
                    
                    <div class="grid grid-cols-2 gap-4 mt-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-sm text-gray-500 mb-1">投资风格</p>
                            <p class="text-lg font-semibold text-gray-800">${this.getStyleText(stock.style)}</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-sm text-gray-500 mb-1">风险等级</p>
                            <p class="text-lg font-semibold text-gray-800">${this.getRiskText(stock.risk)}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 绑定滑动事件
        this.currentCard = document.getElementById('currentStockCard');
        this.bindSwipeEvents();
    },

    getStyleText(style) {
        const styleMap = {
            'value': '价值投资',
            'growth': '成长投资',
            'balanced': '平衡配置'
        };
        return styleMap[style] || style;
    },

    getRiskText(risk) {
        const riskMap = {
            'low': '低风险',
            'medium': '中等风险',
            'high': '高风险'
        };
        return riskMap[risk] || risk;
    },

    bindSwipeEvents() {
        if (!this.currentCard) return;

        // 鼠标/触摸事件
        this.currentCard.addEventListener('mousedown', (e) => this.handleStart(e));
        this.currentCard.addEventListener('touchstart', (e) => this.handleStart(e));
        
        document.addEventListener('mousemove', (e) => this.handleMove(e));
        document.addEventListener('touchmove', (e) => this.handleMove(e));
        
        document.addEventListener('mouseup', (e) => this.handleEnd(e));
        document.addEventListener('touchend', (e) => this.handleEnd(e));
    },

    handleStart(e) {
        this.isDragging = true;
        const touch = e.type === 'touchstart' ? e.touches[0] : e;
        this.startX = touch.clientX;
        this.startY = touch.clientY;
    },

    handleMove(e) {
        if (!this.isDragging) return;
        
        const touch = e.type === 'touchmove' ? e.touches[0] : e;
        this.currentX = touch.clientX - this.startX;
        this.currentY = touch.clientY - this.startY;
        
        // 更新卡片位置和旋转
        const rotation = this.currentX / 20;
        this.currentCard.style.transform = `translate(${this.currentX}px, ${this.currentY}px) rotate(${rotation}deg)`;
        
        // 显示滑动指示器
        const leftIndicator = document.getElementById('leftIndicator');
        const rightIndicator = document.getElementById('rightIndicator');
        
        if (this.currentX < -50) {
            leftIndicator.classList.add('show');
            rightIndicator.classList.remove('show');
            this.currentCard.classList.add('swiping-left');
            this.currentCard.classList.remove('swiping-right');
        } else if (this.currentX > 50) {
            rightIndicator.classList.add('show');
            leftIndicator.classList.remove('show');
            this.currentCard.classList.add('swiping-right');
            this.currentCard.classList.remove('swiping-left');
        } else {
            leftIndicator.classList.remove('show');
            rightIndicator.classList.remove('show');
            this.currentCard.classList.remove('swiping-left', 'swiping-right');
        }
    },

    handleEnd(e) {
        if (!this.isDragging) return;
        this.isDragging = false;
        
        const threshold = 100;
        
        if (this.currentX < -threshold) {
            // 左滑 - 不感兴趣
            this.swipeLeft();
        } else if (this.currentX > threshold) {
            // 右滑 - 感兴趣
            this.swipeRight();
        } else {
            // 回弹
            this.currentCard.style.transform = '';
            this.currentCard.classList.remove('swiping-left', 'swiping-right');
            document.getElementById('leftIndicator').classList.remove('show');
            document.getElementById('rightIndicator').classList.remove('show');
        }
        
        this.currentX = 0;
        this.currentY = 0;
    },

    swipeLeft() {
        const stock = AppState.stocks[AppState.currentStockIndex];
        
        // 添加动画
        this.currentCard.classList.add('swipe-left');
        
        // 记录左滑
        AppState.leftSwipedStocks.push(stock);
        AppState.swipeCount++;
        
        // 记录用户行为
        this.recordUserAction(stock, 'swipe_left');
        
        // 延迟后显示下一张卡片
        setTimeout(() => {
            AppState.currentStockIndex++;
            this.renderCurrentCard();
            this.updateProgress();
        }, 500);
    },

    swipeRight() {
        const stock = AppState.stocks[AppState.currentStockIndex];
        
        // 添加动画
        this.currentCard.classList.add('swipe-right');
        
        // 记录右滑
        AppState.rightSwipedStocks.push(stock);
        AppState.swipeCount++;
        
        // 记录用户行为
        this.recordUserAction(stock, 'swipe_right');
        
        // 延迟后显示下一张卡片
        setTimeout(() => {
            AppState.currentStockIndex++;
            this.renderCurrentCard();
            this.updateProgress();
        }, 500);
    },

    async recordUserAction(stock, actionType) {
        try {
            await Utils.apiRequest('/user/action', {
                method: 'POST',
                body: {
                    user_id: AppState.userId,
                    stock_id: stock.id,
                    action_type: actionType
                }
            });
        } catch (error) {
            // 静默失败，不影响用户体验
            console.error('记录用户行为失败:', error);
        }
    },

    updateProgress() {
        const progressText = document.getElementById('swipeProgress');
        const progressBar = document.getElementById('swipeProgressBar');
        
        if (progressText) {
            progressText.textContent = `${AppState.swipeCount} / ${AppState.totalSwipeTarget}`;
        }
        
        if (progressBar) {
            const percentage = (AppState.swipeCount / AppState.totalSwipeTarget) * 100;
            progressBar.style.width = `${percentage}%`;
        }
    },

    showCompletionPrompt() {
        const container = document.getElementById('swipeCardContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div class="mb-6">
                    <i class="fas fa-check-circle text-green-500 text-6xl mb-4"></i>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">完成选择！</h3>
                    <p class="text-gray-600">你已经完成了 ${AppState.swipeCount} 支股票的选择</p>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-green-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-1">感兴趣</p>
                        <p class="text-3xl font-bold text-green-600">${AppState.rightSwipedStocks.length}</p>
                    </div>
                    <div class="bg-red-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-1">不感兴趣</p>
                        <p class="text-3xl font-bold text-red-600">${AppState.leftSwipedStocks.length}</p>
                    </div>
                </div>
                
                <button onclick="ReportModule.generateReport()" 
                        class="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-bold text-lg">
                    <i class="fas fa-chart-line mr-2"></i>查看我的投资画像
                </button>
            </div>
        `;
    }
};

/***********************
 * MBTI投资风格分析模块
 ***********************/
const MBTIAnalyzer = {
    analyze() {
        const rightSwiped = AppState.rightSwipedStocks;
        
        if (rightSwiped.length === 0) {
            return {
                type: 'ISTJ',
                name: '谨慎观察者',
                desc: '你还没有选择感兴趣的股票，建议先体验滑动选股功能',
                traits: []
            };
        }

        // 分析维度
        const analysis = {
            // E/I: 外向/内向 - 基于选择的股票数量和多样性
            ei: this.analyzeEI(rightSwiped),
            // S/N: 感觉/直觉 - 基于价值股vs成长股偏好
            sn: this.analyzeSN(rightSwiped),
            // T/F: 思考/情感 - 基于风险偏好
            tf: this.analyzeTF(rightSwiped),
            // J/P: 判断/知觉 - 基于行业集中度
            jp: this.analyzeJP(rightSwiped)
        };

        const mbtiType = analysis.ei + analysis.sn + analysis.tf + analysis.jp;
        
        return this.getMBTIProfile(mbtiType, rightSwiped);
    },

    analyzeEI(stocks) {
        // E(外向): 选择多个不同板块的股票，喜欢多元化
        // I(内向): 专注于少数几个板块
        const sectors = new Set(stocks.map(s => s.sector));
        return sectors.size >= 4 ? 'E' : 'I';
    },

    analyzeSN(stocks) {
        // S(感觉): 偏好价值股，注重现实和稳定
        // N(直觉): 偏好成长股，注重未来和潜力
        const growthCount = stocks.filter(s => s.style === 'growth').length;
        const valueCount = stocks.filter(s => s.style === 'value').length;
        return growthCount > valueCount ? 'N' : 'S';
    },

    analyzeTF(stocks) {
        // T(思考): 偏好低风险，理性决策
        // F(情感): 接受高风险，跟随热点
        const highRiskCount = stocks.filter(s => s.risk === 'high').length;
        const lowRiskCount = stocks.filter(s => s.risk === 'low').length;
        return lowRiskCount > highRiskCount ? 'T' : 'F';
    },

    analyzeJP(stocks) {
        // J(判断): 行业集中，有明确偏好
        // P(知觉): 行业分散，保持开放
        const industries = new Set(stocks.map(s => s.industry));
        return industries.size <= 3 ? 'J' : 'P';
    },

    getMBTIProfile(type, stocks) {
        const profiles = {
            'ISTJ': {
                name: '稳健守护者',
                desc: '你偏好传统行业的龙头企业，注重稳定性和可预测性。像巴菲特一样，你相信时间的力量，愿意长期持有优质资产。',
                traits: ['注重基本面', '长期价值投资', '风险厌恶', '行业专注'],
                strategy: '建议关注：银行、保险、公用事业等防御性板块',
                icon: '🛡️'
            },
            'ISFJ': {
                name: '温和价值派',
                desc: '你在追求稳定的同时，也关注企业的社会价值。你喜欢那些既能带来回报，又能造福社会的公司。',
                traits: ['价值与责任并重', '中长期持有', '适度分散', '关注ESG'],
                strategy: '建议关注：消费、医药、环保等民生相关板块',
                icon: '🌱'
            },
            'INFJ': {
                name: '远见战略家',
                desc: '你能看到别人看不到的机会，偏好具有长期增长潜力的新兴产业。你相信未来，愿意为之等待。',
                traits: ['前瞻性思维', '成长股偏好', '长期布局', '主题投资'],
                strategy: '建议关注：新能源、人工智能、生物科技等创新领域',
                icon: '🔮'
            },
            'INTJ': {
                name: '理性建筑师',
                desc: '你是最理性的投资者，善于构建完整的投资体系。你相信数据和逻辑，每一个决策都经过深思熟虑。',
                traits: ['系统化投资', '数据驱动', '独立思考', '长期规划'],
                strategy: '建议关注：科技、金融科技、高端制造等需要深度研究的领域',
                icon: '🏗️'
            },
            'ISTP': {
                name: '灵活操盘手',
                desc: '你善于捕捉短期机会，在市场波动中寻找价值。你相信自己的判断，敢于在别人恐慌时出手。',
                traits: ['灵活应变', '技术分析', '波段操作', '风险控制'],
                strategy: '建议关注：周期股、题材股等波动较大的品种',
                icon: '🎯'
            },
            'ISFP': {
                name: '感性探索者',
                desc: '你跟随自己的直觉投资，喜欢那些能打动你的公司和产品。你相信好的产品终将获得市场认可。',
                traits: ['产品导向', '消费者视角', '灵活配置', '情感共鸣'],
                strategy: '建议关注：消费品牌、文化娱乐、新消费等领域',
                icon: '🎨'
            },
            'INFP': {
                name: '理想主义者',
                desc: '你希望投资能改变世界，偏好那些有使命感的创新企业。你愿意承担风险，支持你相信的未来。',
                traits: ['使命驱动', '创新偏好', '长期信念', '价值观投资'],
                strategy: '建议关注：清洁能源、教育科技、医疗创新等改变世界的领域',
                icon: '💫'
            },
            'INTP': {
                name: '逻辑分析师',
                desc: '你热衷于研究复杂的商业模式，善于发现被低估的机会。你相信深度研究能带来超额回报。',
                traits: ['深度研究', '逻辑严密', '独立判断', '反向思维'],
                strategy: '建议关注：科技、生物医药、先进制造等需要深度理解的行业',
                icon: '🔬'
            },
            'ESTP': {
                name: '行动派交易者',
                desc: '你喜欢快节奏的市场，善于把握短期机会。你相信行动胜于空想，敢于快速决策。',
                traits: ['快速反应', '短线交易', '趋势跟随', '果断执行'],
                strategy: '建议关注：热点板块、题材股、高beta品种',
                icon: '⚡'
            },
            'ESFP': {
                name: '乐观跟随者',
                desc: '你喜欢跟随市场热点，享受投资的乐趣。你相信大众的选择，愿意参与热门赛道。',
                traits: ['热点追踪', '市场情绪', '灵活进出', '社交投资'],
                strategy: '建议关注：消费升级、新兴产业、热门概念',
                icon: '🎉'
            },
            'ENFP': {
                name: '热情创新者',
                desc: '你对新事物充满热情，喜欢投资那些能改变生活的创新企业。你相信创新的力量，愿意为之冒险。',
                traits: ['创新导向', '多元配置', '成长偏好', '乐观进取'],
                strategy: '建议关注：互联网、新消费、创新科技等高成长领域',
                icon: '🚀'
            },
            'ENTP': {
                name: '挑战者',
                desc: '你喜欢挑战传统观点，善于发现市场的非共识机会。你相信独立思考能带来超额收益。',
                traits: ['反向投资', '独立思考', '敢于冒险', '创新策略'],
                strategy: '建议关注：被低估的优质资产、转型中的传统企业',
                icon: '🎲'
            },
            'ESTJ': {
                name: '执行官',
                desc: '你是最有纪律的投资者，严格执行自己的投资计划。你相信规则和秩序，注重风险管理。',
                traits: ['纪律严明', '风险管理', '价值投资', '长期持有'],
                strategy: '建议关注：蓝筹股、行业龙头、高股息品种',
                icon: '📊'
            },
            'ESFJ': {
                name: '守护者',
                desc: '你关注企业的社会责任，偏好那些能为社会创造价值的公司。你相信好的企业终将获得回报。',
                traits: ['社会责任', '稳健配置', '长期价值', 'ESG投资'],
                strategy: '建议关注：民生消费、医疗健康、公用事业',
                icon: '🤝'
            },
            'ENFJ': {
                name: '领导者',
                desc: '你善于把握大趋势，偏好那些能引领行业变革的龙头企业。你相信优秀的管理团队能创造价值。',
                traits: ['趋势把握', '龙头偏好', '管理层研究', '长期布局'],
                strategy: '建议关注：行业龙头、平台型企业、生态系统构建者',
                icon: '👑'
            },
            'ENTJ': {
                name: '统帅',
                desc: '你是最有战略眼光的投资者，善于构建完整的投资组合。你相信系统化的方法能带来持续的成功。',
                traits: ['战略规划', '组合管理', '目标导向', '执行力强'],
                strategy: '建议关注：构建多元化投资组合，平衡风险与收益',
                icon: '⚔️'
            }
        };

        const profile = profiles[type] || profiles['ISTJ'];
        
        // 添加个性化的统计数据
        profile.stats = {
            totalSelected: stocks.length,
            sectors: this.getSectorDistribution(stocks),
            styles: this.getStyleDistribution(stocks),
            risks: this.getRiskDistribution(stocks)
        };

        return { type, ...profile };
    },

    getSectorDistribution(stocks) {
        const distribution = {};
        stocks.forEach(stock => {
            distribution[stock.sector] = (distribution[stock.sector] || 0) + 1;
        });
        return distribution;
    },

    getStyleDistribution(stocks) {
        const distribution = { value: 0, growth: 0, balanced: 0 };
        stocks.forEach(stock => {
            distribution[stock.style]++;
        });
        return distribution;
    },

    getRiskDistribution(stocks) {
        const distribution = { low: 0, medium: 0, high: 0 };
        stocks.forEach(stock => {
            distribution[stock.risk]++;
        });
        return distribution;
    }
};

/***********************
 * 报告生成模块
 ***********************/
const ReportModule = {
    // 获取MBTI类型对应的颜色主题
    getMBTITheme(type) {
        // MBTI 4类颜色划分
        // 分析师 (NT) - 紫色: INTJ, INTP, ENTJ, ENTP
        // 外交官 (NF) - 绿色: INFJ, INFP, ENFJ, ENFP  
        // 哨兵 (SJ) - 蓝色: ISTJ, ISFJ, ESTJ, ESFJ
        // 探险家 (SP) - 黄色/橙色: ISTP, ISFP, ESTP, ESFP
        
        const ntTypes = ['INTJ', 'INTP', 'ENTJ', 'ENTP'];
        const nfTypes = ['INFJ', 'INFP', 'ENFJ', 'ENFP'];
        const sjTypes = ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'];
        const spTypes = ['ISTP', 'ISFP', 'ESTP', 'ESFP'];
        
        if (ntTypes.includes(type)) {
            return {
                name: '分析师',
                primary: 'purple',
                gradient: 'from-purple-600 via-violet-600 to-indigo-600',
                gradientLight: 'from-purple-50 to-violet-50',
                border: 'border-purple-500',
                text: 'text-purple-600',
                bg: 'bg-purple-50',
                progressGradient: 'from-purple-500 to-violet-500',
                buttonGradient: 'from-purple-600 to-indigo-600',
                pageBackground: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 50%, #DDD6FE 100%)',
                cardBg: 'rgba(139, 92, 246, 0.1)',
                emoji: '🧠'
            };
        } else if (nfTypes.includes(type)) {
            return {
                name: '外交官',
                primary: 'green',
                gradient: 'from-emerald-500 via-green-500 to-teal-500',
                gradientLight: 'from-emerald-50 to-green-50',
                border: 'border-emerald-500',
                text: 'text-emerald-600',
                bg: 'bg-emerald-50',
                progressGradient: 'from-emerald-500 to-teal-500',
                buttonGradient: 'from-emerald-500 to-teal-500',
                pageBackground: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 50%, #A7F3D0 100%)',
                cardBg: 'rgba(16, 185, 129, 0.1)',
                emoji: '🌱'
            };
        } else if (sjTypes.includes(type)) {
            return {
                name: '哨兵',
                primary: 'blue',
                gradient: 'from-blue-600 via-sky-500 to-cyan-500',
                gradientLight: 'from-blue-50 to-sky-50',
                border: 'border-blue-500',
                text: 'text-blue-600',
                bg: 'bg-blue-50',
                progressGradient: 'from-blue-500 to-cyan-500',
                buttonGradient: 'from-blue-600 to-cyan-500',
                pageBackground: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #BFDBFE 100%)',
                cardBg: 'rgba(59, 130, 246, 0.1)',
                emoji: '🛡️'
            };
        } else if (spTypes.includes(type)) {
            return {
                name: '探险家',
                primary: 'orange',
                gradient: 'from-orange-500 via-amber-500 to-yellow-500',
                gradientLight: 'from-orange-50 to-amber-50',
                border: 'border-orange-500',
                text: 'text-orange-600',
                bg: 'bg-orange-50',
                progressGradient: 'from-orange-500 to-amber-500',
                buttonGradient: 'from-orange-500 to-amber-500',
                pageBackground: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)',
                cardBg: 'rgba(245, 158, 11, 0.1)',
                emoji: '🔥'
            };
        }
        
        // 默认紫色
        return {
            name: '分析师',
            primary: 'purple',
            gradient: 'from-purple-600 to-pink-600',
            gradientLight: 'from-purple-50 to-pink-50',
            border: 'border-purple-500',
            text: 'text-purple-600',
            bg: 'bg-purple-50',
            progressGradient: 'from-purple-500 to-pink-500',
            buttonGradient: 'from-purple-600 to-pink-600',
            pageBackground: 'linear-gradient(135deg, #F5F3FF 0%, #FCE7F3 100%)',
            cardBg: 'rgba(139, 92, 246, 0.1)',
            emoji: '✨'
        };
    },

    generateReport() {
        // 生成MBTI分析
        AppState.mbtiResult = MBTIAnalyzer.analyze();
        
        // 显示报告页面
        Utils.showPage('report-page');
        
        // 渲染报告内容
        this.renderReport();
    },

    renderReport() {
        const result = AppState.mbtiResult;
        const reportContainer = document.getElementById('reportContainer');
        const reportPage = document.getElementById('report-page');
        
        if (!reportContainer) return;

        // 获取MBTI主题颜色
        const theme = this.getMBTITheme(result.type);
        
        // 应用页面背景色
        if (reportPage) {
            reportPage.style.background = theme.pageBackground;
            reportPage.style.minHeight = '100vh';
        }

        reportContainer.innerHTML = `
            <!-- 页面标题区 -->
            <div class="text-center mb-8 animate-fade-in-up">
                <h1 class="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent">
                    你的投资画像
                </h1>
                <p class="text-gray-500 text-lg">基于你的选择，我们为你生成了专属的投资风格分析</p>
            </div>

            <!-- MBTI类型标识 -->
            <div class="text-center mb-6 animate-fade-in-up delay-100">
                <span class="inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-xl rounded-full text-sm font-semibold shadow-lg border border-white/50">
                    <span class="text-xl">${theme.emoji}</span>
                    <span class="bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent">${theme.name}型人格</span>
                </span>
            </div>

            <!-- MBTI类型卡片 - 高级版 -->
            <div class="bg-gradient-to-br ${theme.gradient} rounded-3xl shadow-2xl p-10 mb-8 text-white relative overflow-hidden animate-fade-in-up delay-200" style="box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
                <!-- 装饰背景 -->
                <div class="absolute inset-0 overflow-hidden">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl transform translate-x-20 -translate-y-20"></div>
                    <div class="absolute bottom-0 left-0 w-48 h-48 bg-white/15 rounded-full blur-3xl transform -translate-x-16 translate-y-16"></div>
                    <div class="absolute top-1/2 left-1/2 w-32 h-32 bg-white/10 rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2"></div>
                    <!-- 网格装饰 -->
                    <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 30px 30px;"></div>
                </div>
                <div class="text-center relative z-10">
                    <div class="text-7xl mb-5 animate-float">${result.icon}</div>
                    <h2 class="text-5xl font-extrabold mb-3 tracking-tight">${result.type}</h2>
                    <h3 class="text-2xl font-medium mb-5 opacity-95">${result.name}</h3>
                    <p class="text-lg opacity-90 leading-relaxed max-w-2xl mx-auto">${result.desc}</p>
                </div>
            </div>

            <!-- 投资特征 - 玻璃拟态版 -->
            <div class="glass-card-solid p-8 mb-6 animate-fade-in-up delay-300">
                <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <span class="w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white mr-3 shadow-lg">
                        <i class="fas fa-star text-sm"></i>
                    </span>
                    你的投资特征
                </h3>
                <div class="grid grid-cols-2 gap-4">
                    ${result.traits.map((trait, i) => `
                        <div class="group relative p-5 rounded-2xl bg-gradient-to-br ${theme.gradientLight} border ${theme.border} border-opacity-30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1" style="animation: fadeInUp 0.5s ease-out ${0.1 * i}s forwards; opacity: 0;">
                            <div class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-xs ${theme.text} font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                ${i + 1}
                            </div>
                            <p class="text-gray-700 font-medium pr-8">${trait}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 投资建议 - 高级版 -->
            <div class="glass-card-solid p-8 mb-6 animate-fade-in-up delay-400">
                <h3 class="text-xl font-bold text-gray-800 mb-5 flex items-center">
                    <span class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white mr-3 shadow-lg">
                        <i class="fas fa-lightbulb text-sm"></i>
                    </span>
                    投资建议
                </h3>
                <div class="relative ${theme.bg} p-6 rounded-2xl ${theme.border} border overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${theme.gradient} opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                    <p class="text-gray-700 text-lg leading-relaxed relative z-10">${result.strategy}</p>
                </div>
            </div>

            <!-- 数据统计 - 高级版 -->
            <div class="glass-card-solid p-8 mb-6 animate-fade-in-up delay-500">
                <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <span class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white mr-3 shadow-lg">
                        <i class="fas fa-chart-pie text-sm"></i>
                    </span>
                    你的选择分析
                </h3>
                
                <!-- 板块分布 -->
                <div class="mb-8">
                    <h4 class="text-base font-semibold text-gray-600 mb-4 flex items-center">
                        <span class="w-2 h-2 rounded-full bg-gradient-to-r ${theme.progressGradient} mr-2"></span>
                        板块偏好
                    </h4>
                    <div class="space-y-3">
                        ${Object.entries(result.stats.sectors).map(([sector, count], i) => `
                            <div class="flex items-center group" style="animation: fadeInUp 0.4s ease-out ${0.1 * i}s forwards; opacity: 0;">
                                <span class="w-20 text-gray-600 font-medium text-sm">${sector}</span>
                                <div class="flex-1 bg-gray-100 rounded-full h-8 mx-3 overflow-hidden relative">
                                    <div class="bg-gradient-to-r ${theme.progressGradient} h-8 rounded-full flex items-center justify-end pr-3 transition-all duration-700 ease-out relative overflow-hidden" 
                                         style="width: ${(count / result.stats.totalSelected * 100)}%">
                                        <div class="absolute inset-0 bg-white/20 animate-shimmer"></div>
                                        <span class="text-white text-sm font-bold relative z-10">${count}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 投资风格 -->
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-gray-700 mb-3">投资风格</h4>
                    <div class="grid grid-cols-3 gap-4">
                        <div class="text-center p-4 bg-blue-50 rounded-lg">
                            <p class="text-3xl font-bold text-blue-600">${result.stats.styles.value}</p>
                            <p class="text-gray-600 mt-2">价值投资</p>
                        </div>
                        <div class="text-center p-4 bg-green-50 rounded-lg">
                            <p class="text-3xl font-bold text-green-600">${result.stats.styles.growth}</p>
                            <p class="text-gray-600 mt-2">成长投资</p>
                        </div>
                        <div class="text-center p-4 bg-purple-50 rounded-lg">
                            <p class="text-3xl font-bold text-purple-600">${result.stats.styles.balanced}</p>
                            <p class="text-gray-600 mt-2">平衡配置</p>
                        </div>
                    </div>
                </div>

                <!-- 风险偏好 -->
                <div>
                    <h4 class="text-lg font-semibold text-gray-700 mb-3">风险偏好</h4>
                    <div class="grid grid-cols-3 gap-4">
                        <div class="text-center p-4 bg-green-50 rounded-lg">
                            <p class="text-3xl font-bold text-green-600">${result.stats.risks.low}</p>
                            <p class="text-gray-600 mt-2">低风险</p>
                        </div>
                        <div class="text-center p-4 bg-yellow-50 rounded-lg">
                            <p class="text-3xl font-bold text-yellow-600">${result.stats.risks.medium}</p>
                            <p class="text-gray-600 mt-2">中等风险</p>
                        </div>
                        <div class="text-center p-4 bg-red-50 rounded-lg">
                            <p class="text-3xl font-bold text-red-600">${result.stats.risks.high}</p>
                            <p class="text-gray-600 mt-2">高风险</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 你选择的股票 - 高级版 -->
            <div class="glass-card-solid p-8 mb-6">
                <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <span class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white mr-3 shadow-lg">
                        <i class="fas fa-heart text-sm"></i>
                    </span>
                    你感兴趣的股票
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    ${AppState.rightSwipedStocks.map((stock, i) => `
                        <div class="group relative bg-white rounded-2xl p-5 border border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden" style="animation: fadeInUp 0.5s ease-out ${0.1 * i}s forwards; opacity: 0;">
                            <!-- 背景装饰 -->
                            <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${theme.gradient} opacity-0 group-hover:opacity-10 rounded-full blur-2xl transform translate-x-8 -translate-y-8 transition-opacity duration-300"></div>
                            
                            <div class="flex justify-between items-start mb-3 relative z-10">
                                <div>
                                    <h4 class="font-bold text-gray-800 text-lg">${stock.name}</h4>
                                    <p class="text-sm text-gray-400 font-mono">${stock.code}</p>
                                </div>
                                <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${theme.gradientLight} ${theme.text}">${stock.sector}</span>
                            </div>
                            <p class="text-gray-500 text-sm mb-4 relative z-10">${stock.desc}</p>
                            <button onclick="LevelModule.startLevelLearning(${JSON.stringify(stock).replace(/"/g, '&quot;')})" 
                                    class="w-full px-4 py-3 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-xl hover:shadow-lg transition-all duration-300 text-sm font-bold relative overflow-hidden group/btn">
                                <span class="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500"></span>
                                <span class="relative z-10"><i class="fas fa-gamepad mr-2"></i>开始闯关</span>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 🗺️ 开始学习之旅按钮 - 高级版 -->
            <div class="mb-8">
                <button onclick="LearningMapModule.generateAndShow()" 
                        class="group w-full px-8 py-8 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-3xl hover:shadow-2xl transition-all duration-500 font-bold text-xl transform hover:scale-[1.02] relative overflow-hidden"
                        style="box-shadow: 0 20px 40px -10px rgba(16, 185, 129, 0.4);">
                    <!-- 动态背景 -->
                    <div class="absolute inset-0 opacity-30">
                        <div class="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl transform -translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700"></div>
                        <div class="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl transform translate-x-10 translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700"></div>
                    </div>
                    <!-- 光效扫过 -->
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    
                    <div class="flex items-center justify-center gap-4 relative z-10">
                        <span class="text-4xl animate-float">🗺️</span>
                        <span class="text-2xl">开始学习之旅</span>
                        <span class="text-2xl group-hover:translate-x-2 transition-transform duration-300">→</span>
                    </div>
                    <p class="text-base opacity-80 mt-3 relative z-10">根据你选择的股票生成专属学习地图</p>
                </button>
            </div>

            <!-- 游戏中心入口 - 超大按钮 -->
            <div class="mb-6">
                <button onclick="GameCenter.show()" 
                        class="w-full px-8 py-6 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white rounded-3xl hover:shadow-2xl transition-all duration-500 font-bold text-xl transform hover:scale-[1.02] relative overflow-hidden animate-pulse"
                        style="box-shadow: 0 20px 40px -10px rgba(139, 92, 246, 0.5);">
                    <!-- 动态背景 -->
                    <div class="absolute inset-0 opacity-30">
                        <div class="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl transform -translate-x-10 -translate-y-10 hover:translate-x-0 hover:translate-y-0 transition-transform duration-700"></div>
                        <div class="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl transform translate-x-10 translate-y-10 hover:translate-x-0 hover:translate-y-0 transition-transform duration-700"></div>
                    </div>
                    
                    <div class="relative z-10 flex items-center justify-center gap-4">
                        <span class="text-4xl animate-bounce">🎮</span>
                        <div class="text-left">
                            <div class="text-2xl font-bold mb-1">游戏中心</div>
                            <div class="text-sm opacity-90">集卡、任务、成就，边学边玩！</div>
                        </div>
                        <span class="text-2xl hover:translate-x-2 transition-transform duration-300">→</span>
                    </div>
                    
                    <!-- 新功能提示 -->
                    <div class="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-bounce">
                        NEW!
                    </div>
                </button>
            </div>

            <!-- 操作按钮 - 高级版 -->
            <div class="flex gap-5">
                <button onclick="location.reload()" 
                        class="flex-1 px-8 py-4 bg-white/90 backdrop-blur-xl text-gray-700 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300 font-bold text-lg border border-gray-100 group">
                    <i class="fas fa-redo mr-2 group-hover:-rotate-180 transition-transform duration-500"></i>重新测试
                </button>
                <button onclick="ReportModule.shareReport()" 
                        class="flex-1 px-8 py-4 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-2xl hover:shadow-xl transition-all duration-300 font-bold text-lg relative overflow-hidden group"
                        style="box-shadow: 0 10px 30px -5px rgba(102, 126, 234, 0.3);">
                    <span class="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></span>
                    <span class="relative z-10"><i class="fas fa-share-alt mr-2"></i>分享结果</span>
                </button>
            </div>
        `;
    },

    shareReport() {
        const result = AppState.mbtiResult;
        const shareText = `我的投资风格是：${result.type} - ${result.name}\n${result.desc}`;
        
        // 复制到剪贴板
        navigator.clipboard.writeText(shareText).then(() => {
            Utils.showToast('已复制到剪贴板，快去分享吧！');
        }).catch(() => {
            Utils.showToast('复制失败，请手动复制');
        });
    }
};

/***********************
 * 学习模块
 ***********************/
const LearningModule = {
    currentStock: null,
    selectedQuestion: null,
    selectedQuestions: [], // 支持选择多个问题（最多2个）
    followOnQuestions: [], // follow-on问题列表
    learningContent: null,
    questionAnalysis: null, // 问题的详细解读
    currentSection: 1, // 当前显示的学习板块（1-5）
    sectionQuizzes: {}, // 每个板块对应的问答题目
    sectionQuizIndex: {}, // 每个板块的答题索引

    async startLearning(stock) {
        // 确保stock对象存在且有id属性
        if (!stock || !stock.id) {
            Utils.showToast('股票信息加载失败，请重试');
            console.error('Invalid stock object:', stock);
            return;
        }
        
        // 如果传入的stock对象不完整，从AppState中查找完整信息
        if (!stock.sector || !stock.industry) {
            const fullStock = AppState.stocks.find(s => s.id === stock.id);
            if (fullStock) {
                stock = {...fullStock};  // 创建副本避免引用问题
            } else {
                // 如果找不到完整信息，使用默认值
                stock = {
                    ...stock,
                    sector: stock.sector || '未知',
                    industry: stock.industry || '未知',
                    style: stock.style || 'balanced',
                    risk: stock.risk || 'medium'
                };
            }
        }
        
        this.currentStock = stock;
        
        // 显示学习关卡选择页面
        await this.showLevelSelection();
    },

    async showLevelSelection() {
        if (!this.currentStock || !this.currentStock.id) {
            Utils.showToast('股票信息丢失，请重新选择');
            return;
        }
        
        Utils.showPage('learning-page');
        const learningContainer = document.getElementById('learningContainer');
        if (!learningContainer) {
            console.error('learningContainer not found');
            Utils.showToast('页面元素未找到，请刷新页面重试');
            return;
        }

        // 显示加载状态
        learningContainer.innerHTML = `
            <div class="text-center py-20">
                <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mb-4"></div>
                <p class="text-gray-600 text-lg">正在加载学习关卡...</p>
            </div>
        `;

        try {
            // 获取用户的卡片收集情况
            const cardsResponse = await Utils.apiRequest(`/cards/collection?user_id=${AppState.userId}`);
            const userCards = cardsResponse?.cards || [];
            
            // 获取该股票的卡片
            const stockCards = userCards.filter(c => c.stock_id === this.currentStock.id);
            const ownedRarities = stockCards.filter(c => c.owned).map(c => c.rarity);
            
            // 定义难度等级和卡片要求
            const difficultyLevels = [
                {
                    id: 'simple',
                    name: '简单难度',
                    desc: '基础了解，适合初学者',
                    icon: '🌱',
                    color: 'from-gray-400 to-gray-500',
                    requiredCard: 'common',
                    unlocked: ownedRarities.includes('common') || ownedRarities.length === 0
                },
                {
                    id: 'advanced',
                    name: '进阶难度',
                    desc: '深入分析，需要稀有卡解锁',
                    icon: '📊',
                    color: 'from-blue-400 to-blue-600',
                    requiredCard: 'rare',
                    unlocked: ownedRarities.includes('rare')
                },
                {
                    id: 'expert',
                    name: '高级难度',
                    desc: '专业分析，需要史诗卡解锁',
                    icon: '🎓',
                    color: 'from-purple-400 to-purple-600',
                    requiredCard: 'epic',
                    unlocked: ownedRarities.includes('epic')
                },
                {
                    id: 'master',
                    name: '专家难度',
                    desc: '深度养成，需要传说卡解锁',
                    icon: '👑',
                    color: 'from-amber-400 to-amber-600',
                    requiredCard: 'legendary',
                    unlocked: ownedRarities.includes('legendary')
                }
            ];

            learningContainer.innerHTML = `
                <!-- 返回按钮 - 高级版 -->
                <div class="mb-6">
                    <button onclick="Utils.showPage('report-page'); ReportModule.renderReport();" 
                            class="group relative px-6 py-3 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center text-gray-700 hover:text-purple-600 border border-gray-100 hover:border-purple-300">
                        <i class="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i>
                        <span class="font-semibold">返回</span>
                        <div class="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 rounded-xl transition-all duration-300"></div>
                    </button>
                </div>

                <!-- 股票信息卡片 - 玻璃态高级版 -->
                <div class="relative mb-8 overflow-hidden rounded-3xl">
                    <!-- 背景渐变 -->
                    <div class="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800"></div>
                    <!-- 动态光效 -->
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
                    <!-- 玻璃态内容 -->
                    <div class="relative backdrop-blur-xl bg-white/10 p-8 border border-white/20">
                        <div class="flex items-center justify-between">
                            <div class="flex-1">
                                <div class="flex items-center gap-3 mb-3">
                                    <div class="w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
                                    <span class="text-white/80 text-sm font-medium">学习模式</span>
                                </div>
                                <h2 class="text-4xl font-bold mb-2 text-white drop-shadow-lg">${this.currentStock.name}</h2>
                                <p class="text-xl opacity-90 text-white/90 mb-1">${this.currentStock.code}</p>
                                <p class="text-lg opacity-80 text-white/80">${this.currentStock.sector}</p>
                                <p class="mt-3 text-white/70 text-sm">${this.currentStock.desc}</p>
                            </div>
                            <div class="relative">
                                <div class="text-8xl opacity-20 animate-float">📚</div>
                                <div class="absolute inset-0 bg-white/10 rounded-full blur-2xl"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 卡片收集状态 - 高级卡片式 -->
                <div class="relative mb-8 group">
                    <div class="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    <div class="relative backdrop-blur-xl bg-gradient-to-br from-blue-50/90 via-cyan-50/90 to-blue-50/90 rounded-3xl p-6 border-2 border-blue-200/50 shadow-2xl">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                <span class="relative">
                                    <span class="text-3xl">🃏</span>
                                    <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                                </span>
                                <span class="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">卡片解锁状态</span>
                            </h3>
                            <div class="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-blue-200/50">
                                <span class="text-sm font-bold text-blue-700">${ownedRarities.length}/4</span>
                            </div>
                        </div>
                        <div class="grid grid-cols-4 gap-4">
                            ${difficultyLevels.map((level, index) => {
                                const card = stockCards.find(c => c.rarity === level.requiredCard);
                                const hasCard = card?.owned || false;
                                const rarityColors = {
                                    'common': 'from-gray-400 to-gray-600',
                                    'rare': 'from-blue-400 to-blue-600',
                                    'epic': 'from-purple-400 to-purple-600',
                                    'legendary': 'from-amber-400 to-amber-600'
                                };
                                return `
                                    <div class="relative group/card">
                                        <div class="absolute inset-0 bg-gradient-to-br ${rarityColors[level.requiredCard]} rounded-2xl opacity-0 group-hover/card:opacity-20 blur-xl transition-all duration-300"></div>
                                        <div class="relative text-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 ${
                                            hasCard 
                                                ? 'border-green-400 shadow-lg shadow-green-400/30 scale-105' 
                                                : 'border-gray-200 opacity-60'
                                        } group-hover/card:scale-110 group-hover/card:shadow-xl">
                                            <div class="relative mb-3">
                                                <div class="text-4xl mb-2 transform transition-transform group-hover/card:scale-125 group-hover/card:rotate-12">
                                                    ${hasCard ? '✅' : '🔒'}
                                                </div>
                                                ${hasCard ? `
                                                    <div class="absolute inset-0 bg-green-400/20 rounded-full blur-xl animate-pulse"></div>
                                                ` : ''}
                                            </div>
                                            <p class="text-xs font-bold mb-1 ${
                                                hasCard ? 'text-green-600' : 'text-gray-400'
                                            }">
                                                ${level.name}
                                            </p>
                                            <p class="text-xs text-gray-500">
                                                ${hasCard ? '已解锁' : '未解锁'}
                                            </p>
                                            ${hasCard ? `
                                                <div class="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                                            ` : ''}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- 学习说明 - 高级信息卡片 -->
                <div class="relative mb-8 group">
                    <div class="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                    <div class="relative backdrop-blur-xl bg-gradient-to-br from-blue-50/95 to-indigo-50/95 rounded-3xl p-8 border-l-4 border-blue-500 shadow-2xl">
                        <div class="flex items-start gap-4">
                            <div class="relative">
                                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform">
                                    💡
                                </div>
                                <div class="absolute inset-0 bg-blue-400 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                            </div>
                            <div class="flex-1">
                                <h3 class="text-2xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">学习难度体系</h3>
                                <p class="text-gray-700 mb-4 text-lg leading-relaxed">通过收集不同稀有度的卡片，解锁不同难度的学习内容，从基础了解逐步进阶到深度养成：</p>
                                <div class="grid grid-cols-2 gap-3">
                                    ${difficultyLevels.map(level => `
                                        <div class="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:border-purple-300 hover:shadow-lg transition-all">
                                            <span class="text-2xl">${level.icon}</span>
                                            <div>
                                                <p class="font-bold text-gray-800 text-sm">${level.name}</p>
                                                <p class="text-xs text-gray-600">${level.desc}</p>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 难度选择 - 高级卡片式 -->
                <div class="space-y-5 mb-8">
                    <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <span class="w-1 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></span>
                        <span class="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">选择学习难度</span>
                    </h3>
                    ${difficultyLevels.map((level, index) => {
                        const card = stockCards.find(c => c.rarity === level.requiredCard);
                        const hasCard = card?.owned || false;
                        const isSimple = level.id === 'simple';
                        const glowColors = {
                            'simple': 'shadow-gray-400/30',
                            'advanced': 'shadow-blue-400/30',
                            'expert': 'shadow-purple-400/30',
                            'master': 'shadow-amber-400/30'
                        };
                        
                        return `
                            <div class="relative group/difficulty" style="animation-delay: ${index * 0.1}s">
                                <!-- 背景光效 -->
                                <div class="absolute inset-0 bg-gradient-to-r ${level.color} rounded-3xl opacity-0 group-hover/difficulty:opacity-20 blur-2xl transition-all duration-500"></div>
                                
                                <!-- 主卡片 -->
                                <button onclick="${hasCard || isSimple ? `LearningModule.startLearningWithDifficulty('${level.id}')` : `CardModule.showCardUnlockModal('${level.requiredCard}', '${level.name}')`}" 
                                        class="relative w-full p-6 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 text-left group/btn ${
                                            !hasCard && !isSimple ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02] hover:-translate-y-1'
                                        } ${hasCard ? `ring-2 ring-green-400/50 ${glowColors[level.id]}` : ''} border border-gray-200/50 hover:border-purple-300/50">
                                    
                                    <!-- 光效扫过 -->
                                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 rounded-3xl"></div>
                                    
                                    <div class="relative flex items-center gap-6">
                                        <!-- 图标区域 -->
                                        <div class="relative">
                                            <div class="w-20 h-20 rounded-2xl bg-gradient-to-br ${level.color} flex items-center justify-center text-4xl shadow-2xl group-hover/btn:scale-110 group-hover/btn:rotate-6 transition-all duration-300">
                                                ${level.icon}
                                            </div>
                                            ${hasCard ? `
                                                <div class="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                                    <i class="fas fa-check text-white text-xs"></i>
                                                </div>
                                            ` : ''}
                                            <!-- 光晕效果 -->
                                            <div class="absolute inset-0 bg-gradient-to-br ${level.color} rounded-2xl blur-xl opacity-0 group-hover/btn:opacity-50 transition-opacity duration-300"></div>
                                        </div>
                                        
                                        <!-- 内容区域 -->
                                        <div class="flex-1">
                                            <div class="flex items-center gap-3 mb-2">
                                                <h3 class="text-2xl font-bold text-gray-800 group-hover/btn:text-transparent group-hover/btn:bg-gradient-to-r group-hover/btn:from-purple-600 group-hover/btn:to-pink-600 group-hover/btn:bg-clip-text transition-all duration-300">
                                                    ${level.name}
                                                </h3>
                                                ${hasCard ? `
                                                    <span class="px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                                                        ✓ 已解锁
                                                    </span>
                                                ` : ''}
                                            </div>
                                            <p class="text-gray-600 mb-3 text-lg">${level.desc}</p>
                                            ${!hasCard && !isSimple ? `
                                                <div class="flex items-center gap-2 text-sm">
                                                    <span class="text-gray-500">需要</span>
                                                    <span class="px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-lg font-bold border border-blue-300/50">
                                                        ${card?.rarity_info?.name || '稀有'}卡片
                                                    </span>
                                                    <span class="text-gray-500">解锁</span>
                                                    <button onclick="event.stopPropagation(); ScratchCardModule.show();" 
                                                            class="ml-2 px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-lg text-xs font-bold hover:shadow-lg transition-all">
                                                        🎁 去开宝箱
                                                    </button>
                                                </div>
                                            ` : `
                                                <div class="flex items-center gap-2 text-sm text-purple-600 font-semibold">
                                                    <i class="fas fa-star text-xs"></i>
                                                    <span>点击开始学习</span>
                                                </div>
                                            `}
                                        </div>
                                        
                                        <!-- 箭头/锁图标 -->
                                        <div class="relative">
                                            ${hasCard || isSimple ? `
                                                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg group-hover/btn:translate-x-2 group-hover/btn:scale-110 transition-all duration-300">
                                                    <i class="fas fa-arrow-right"></i>
                                                </div>
                                            ` : `
                                                <div class="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 shadow-lg">
                                                    <i class="fas fa-lock"></i>
                                                </div>
                                            `}
                                        </div>
                                    </div>
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- 快速开始按钮 - 高级CTA -->
                <div class="relative group">
                    <div class="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 animate-pulse"></div>
                    <div class="relative backdrop-blur-xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-3xl p-8 shadow-2xl border border-white/20">
                        <button onclick="LearningModule.startLearningWithDifficulty('simple')" 
                                class="relative w-full px-8 py-6 bg-white/10 backdrop-blur-sm text-white rounded-2xl hover:bg-white/20 transition-all duration-300 font-bold text-xl group/btn border border-white/30 hover:border-white/50 shadow-lg hover:shadow-2xl hover:scale-[1.02]">
                            <div class="flex items-center justify-center gap-4">
                                <div class="relative">
                                    <i class="fas fa-bolt text-3xl group-hover/btn:rotate-12 transition-transform duration-300"></i>
                                    <div class="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                                </div>
                                <div class="text-left">
                                    <div class="text-2xl font-bold mb-1">快速开始 - 简单难度</div>
                                    <div class="text-sm opacity-90">3分钟快速了解核心知识点</div>
                                </div>
                                <i class="fas fa-arrow-right text-2xl group-hover/btn:translate-x-2 transition-transform"></i>
                            </div>
                            <!-- 光效扫过 -->
                            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 rounded-2xl"></div>
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('加载学习关卡失败:', error);
            learningContainer.innerHTML = `
                <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg mb-6">
                    <div class="flex items-start">
                        <div class="text-red-500 text-2xl mr-3">❌</div>
                        <div>
                            <h3 class="font-bold text-red-800 mb-2">加载失败</h3>
                            <p class="text-red-700 mb-4">${error.message || '无法加载学习关卡，请检查网络连接后重试'}</p>
                            <button onclick="LearningModule.showLevelSelection()" 
                                    class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                                重试
                            </button>
                        </div>
                    </div>
                </div>
            `;
            Utils.showToast('加载失败，请重试');
        }
    },

    async enterLevel(levelId) {
        if (!this.currentStock || !this.currentStock.id) {
            Utils.showToast('股票信息丢失，请重新选择');
            return;
        }

        // 根据关卡ID显示不同的学习内容
        if (levelId === 1) {
            // 热门问题关卡 - 显示问题选择
            await this.showQuestionSelection();
        } else {
            // 其他关卡 - 直接显示学习内容
            await this.loadLevelContent(levelId);
        }
    },

    async loadLevelContent(levelId) {
        if (!this.currentStock || !this.currentStock.id) {
            Utils.showToast('股票信息丢失，请重新选择');
            return;
        }

        try {
            // 加载完整学习内容
            const params = new URLSearchParams({
                user_id: AppState.userId,
                stock_id: this.currentStock.id
            });
            
            const response = await Utils.apiRequest(`/learning/content?${params.toString()}`);
            
            if (!response || !response.success) {
                Utils.showToast('加载学习内容失败');
                return;
            }

            this.learningContent = response.content;
            
            // 根据关卡ID显示对应的内容
            const levelMap = {
                2: 'section2',
                3: 'section3',
                4: 'section4',
                5: 'section5'
            };
            
            const sectionKey = levelMap[levelId];
            if (sectionKey && this.learningContent[sectionKey]) {
                this.renderLevelContent(levelId, this.learningContent[sectionKey]);
            } else {
                // 如果没有选择问题，先显示问题选择
                await this.showQuestionSelection();
            }
        } catch (error) {
            console.error('加载学习内容失败:', error);
            Utils.showToast('加载失败，请重试');
        }
    },

    renderLevelContent(levelId, section) {
        Utils.showPage('learning-page');
        const learningContainer = document.getElementById('learningContainer');
        if (!learningContainer) return;

        const levelInfo = {
            2: { title: '公司基本情况', icon: '🏢', color: 'from-blue-500 to-cyan-500' },
            3: { title: '公司经营情况', icon: '📈', color: 'from-green-500 to-emerald-500' },
            4: { title: '投资性价比', icon: '💰', color: 'from-yellow-500 to-orange-500' },
            5: { title: '投资攻略', icon: '🎯', color: 'from-purple-500 to-pink-500' }
        };

        const info = levelInfo[levelId] || { title: '学习内容', icon: '📚', color: 'from-purple-500 to-pink-500' };

        learningContainer.innerHTML = `
            <!-- 顶部导航 -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6 sticky top-4 z-10">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <button onclick="LearningModule.showLevelSelection()" 
                                class="mr-4 text-gray-600 hover:text-purple-600 transition">
                            <i class="fas fa-arrow-left text-xl"></i>
                        </button>
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800">${this.currentStock.name}</h2>
                            <p class="text-gray-600">${info.title}</p>
                        </div>
                    </div>
                    <div class="text-3xl">${info.icon}</div>
                </div>
            </div>

            <!-- 学习内容 -->
            ${this.renderSection(levelId, section)}

            <!-- 底部操作 -->
            <div class="bg-white rounded-xl shadow-lg p-6 mt-6">
                <div class="flex gap-4">
                    <button onclick="LearningModule.showLevelSelection()" 
                            class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-bold">
                        <i class="fas fa-list mr-2"></i>返回关卡列表
                    </button>
                    ${levelId < 5 ? `
                        <button onclick="LearningModule.enterLevel(${levelId + 1})" 
                                class="flex-1 px-6 py-3 bg-gradient-to-r ${info.color} text-white rounded-xl hover:shadow-lg transition font-bold">
                            下一关 <i class="fas fa-arrow-right ml-2"></i>
                        </button>
                    ` : `
                        <button onclick="LearningModule.completeLearning()" 
                                class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-bold">
                            <i class="fas fa-trophy mr-2"></i>完成学习
                        </button>
                    `}
                </div>
            </div>
        `;
    },

    startQuickLearn() {
        if (!this.currentStock) {
            Utils.showToast('股票信息丢失，请重新选择');
            return;
        }
        // 调用快速学习模块
        if (StockQuickLearn && StockQuickLearn.start) {
            StockQuickLearn.start(this.currentStock);
        } else {
            // 如果没有快速学习模块，显示问题选择
            this.showQuestionSelection();
        }
    },

    async completeLearning() {
        if (!this.currentStock || !this.currentStock.id) {
            Utils.showToast('股票信息丢失');
            return;
        }

        // 获取当前难度，默认为simple
        const difficulty = this.currentDifficulty || 'simple';

        try {
            // 完成学习，点亮图鉴（传递难度参数）
            const response = await Utils.apiRequest('/collection/complete', {
                method: 'POST',
                body: {
                    user_id: AppState.userId,
                    stock_id: this.currentStock.id,
                    difficulty: difficulty
                }
            });

            if (response && response.success) {
                // 检查是否解锁了新难度
                let unlockMessage = '';
                if (response.newly_unlocked && response.next_difficulty) {
                    const difficultyNames = {
                        'simple': '简单',
                        'advanced': '进阶',
                        'expert': '高级',
                        'master': '大师'
                    };
                    unlockMessage = `🎊 恭喜！你已解锁${difficultyNames[response.next_difficulty] || response.next_difficulty}难度！`;
                }
                
                Utils.showToast(unlockMessage || '🎉 恭喜完成学习！');
                
                // 显示完成页面
                Utils.showPage('learning-page');
                const learningContainer = document.getElementById('learningContainer');
                if (learningContainer) {
                    learningContainer.innerHTML = `
                        <div class="bg-white rounded-xl shadow-xl p-8 text-center">
                            <div class="mb-6">
                                <div class="text-8xl mb-4">🎉</div>
                                <h2 class="text-3xl font-bold text-gray-800 mb-2">恭喜完成学习！</h2>
                                <p class="text-gray-600 text-lg">你已经深入了解了 ${this.currentStock.name} 的投资价值</p>
                                ${response.completed_difficulty ? `
                                    <p class="text-purple-600 font-semibold mt-2">完成难度：${difficultyNames[response.completed_difficulty] || response.completed_difficulty}</p>
                                ` : ''}
                                ${response.newly_unlocked && response.next_difficulty ? `
                                    <div class="mt-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl border-2 border-purple-300">
                                        <p class="text-lg font-bold text-purple-800">🎊 解锁新难度！</p>
                                        <p class="text-purple-600 mt-1">${difficultyNames[response.next_difficulty] || response.next_difficulty}难度已解锁，可以开始挑战了！</p>
                                    </div>
                                ` : ''}
                            </div>
                            
                            ${response.new_badges && response.new_badges.length > 0 ? `
                                <div class="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
                                    <h3 class="text-xl font-bold text-gray-800 mb-4">🎖️ 获得新勋章</h3>
                                    <div class="flex justify-center gap-4">
                                        ${response.new_badges.map(badge => `
                                            <div class="text-center">
                                                <div class="text-4xl mb-2">${badge.icon || '🏆'}</div>
                                                <p class="text-sm font-bold text-gray-700">${badge.name || '新勋章'}</p>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            
                            <div class="flex gap-4">
                                <button onclick="LearningModule.showLevelSelection()" 
                                        class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-bold">
                                    <i class="fas fa-redo mr-2"></i>重新学习
                                </button>
                                ${response.next_difficulty && response.newly_unlocked ? `
                                    <button onclick="LearningModule.startLearningWithDifficulty('${response.next_difficulty}')" 
                                            class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-bold">
                                        <i class="fas fa-arrow-up mr-2"></i>挑战${difficultyNames[response.next_difficulty] || response.next_difficulty}难度
                                    </button>
                                ` : ''}
                                <button onclick="QuizModule.startQuiz(${this.currentStock.id}, 0)" 
                                        class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition font-bold">
                                    <i class="fas fa-question-circle mr-2"></i>开始答题
                                </button>
                                <button onclick="ReportModule.generateReport()" 
                                        class="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition font-bold">
                                    <i class="fas fa-chart-line mr-2"></i>查看报告
                                </button>
                            </div>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('完成学习失败:', error);
            Utils.showToast('操作失败，请重试');
        }
    },

    async showQuestionSelection() {
        // 检查currentStock是否存在
        if (!this.currentStock || !this.currentStock.id) {
            Utils.showToast('股票信息丢失，请重新选择');
            console.error('currentStock is null or invalid');
            return;
        }
        
        // 重置选择状态
        this.selectedQuestions = [];
        this.followOnQuestions = [];
        
        Utils.showPage('learning-page');
        const learningContainer = document.getElementById('learningContainer');
        
        if (!learningContainer) return;

        try {
            // 获取问题列表
            const response = await Utils.apiRequest(`/learning/questions?stock_id=${this.currentStock.id}`);
            
            if (!response || !response.success) {
                Utils.showToast(response?.message || '加载问题失败');
                return;
            }

            const questions = response.questions || [];
            const hotQuestions = questions.filter(q => q.hot !== false).slice(0, 5); // 显示前5个热门问题
            this.followOnQuestions = questions.filter(q => !hotQuestions.find(hq => hq.id === q.id)); // 剩余作为follow-on

            learningContainer.innerHTML = `
                <!-- 返回按钮 -->
                <div class="mb-4">
                    <button onclick="LearningModule.showLevelSelection()" 
                            class="text-gray-600 hover:text-purple-600 transition flex items-center">
                        <i class="fas fa-arrow-left mr-2"></i>返回关卡列表
                    </button>
                </div>

                <!-- 股票信息卡片 -->
                <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mb-6 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-2xl font-bold mb-1">${this.currentStock.name}</h2>
                            <p class="text-sm opacity-90">${this.currentStock.code} · ${this.currentStock.sector}</p>
                        </div>
                        <div class="text-4xl">🔥</div>
                    </div>
                </div>

                <!-- 问题选择说明 -->
                <div class="bg-blue-50 border-l-4 border-blue-500 p-5 mb-6 rounded-r-lg">
                    <div class="flex items-start">
                        <div class="text-xl mr-3">💡</div>
                        <div>
                            <h3 class="font-bold text-gray-800 mb-1">选择你感兴趣的问题</h3>
                            <p class="text-gray-700 text-sm">可以选择 <span class="font-bold text-blue-600">1-2个</span> 你最想了解的问题，我们将为你深入解读分析</p>
                        </div>
                    </div>
                </div>

                <!-- 问题列表 -->
                <div class="space-y-3 mb-6">
                    ${hotQuestions.map((q, index) => `
                        <div class="question-item bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${
                            this.selectedQuestions.find(sq => sq.id === q.id) ? 'border-purple-500 bg-purple-50' : 'border-transparent'
                        }">
                            <label class="flex items-start p-5 cursor-pointer group">
                                <input type="checkbox" 
                                       class="question-checkbox mt-1 w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                       value="${q.id}"
                                       ${this.selectedQuestions.find(sq => sq.id === q.id) ? 'checked' : ''}
                                       ${this.selectedQuestions.length >= 2 && !this.selectedQuestions.find(sq => sq.id === q.id) ? 'disabled' : ''}
                                       onchange="LearningModule.toggleQuestion(${q.id}, '${q.title.replace(/'/g, "\\'")}', '${q.desc.replace(/'/g, "\\'")}')">
                                <div class="flex-1 ml-4">
                                    ${q.hot ? '<span class="inline-block px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded mb-2">🔥 热门</span>' : ''}
                                    <h3 class="text-lg font-bold text-gray-800 mb-1 group-hover:text-purple-600 transition">${q.title}</h3>
                                    <p class="text-sm text-gray-600">${q.desc}</p>
                                </div>
                                ${this.selectedQuestions.find(sq => sq.id === q.id) ? 
                                    '<div class="ml-3 text-purple-600"><i class="fas fa-check-circle text-xl"></i></div>' : 
                                    '<div class="ml-3 text-gray-400 group-hover:text-purple-600 transition"><i class="fas fa-plus-circle text-xl"></i></div>'
                                }
                            </label>
                        </div>
                    `).join('')}
                </div>

                <!-- 已选择提示 -->
                <div class="selected-info bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-6" style="display: ${this.selectedQuestions.length > 0 ? 'block' : 'none'};">
                    ${this.selectedQuestions.length > 0 ? `
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-bold text-purple-800 mb-1">已选择 ${this.selectedQuestions.length}/2 个问题</p>
                                <div class="flex flex-wrap gap-2 mt-2">
                                    ${this.selectedQuestions.map(sq => `
                                        <span class="px-3 py-1 bg-purple-600 text-white text-xs rounded-full">${sq.title}</span>
                                    `).join('')}
                                </div>
                            </div>
                            ${this.selectedQuestions.length >= 2 ? 
                                '<div class="text-green-600"><i class="fas fa-check-circle text-2xl"></i></div>' : 
                                '<div class="text-purple-400"><i class="fas fa-info-circle text-xl"></i></div>'
                            }
                        </div>
                    ` : ''}
                </div>

                <!-- 继续按钮 -->
                <div class="mb-6">
                    <button onclick="LearningModule.confirmQuestions()" 
                            class="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            ${this.selectedQuestions.length === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-right mr-2"></i>
                        ${this.selectedQuestions.length === 0 ? '请至少选择1个问题' : 
                          this.selectedQuestions.length === 1 ? '开始学习这个问题' : 
                          '开始学习这2个问题'}
                    </button>
                </div>

                <!-- Follow-on 问题区域 -->
                ${this.followOnQuestions.length > 0 ? `
                    <div class="border-t border-gray-200 pt-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-ellipsis-h text-purple-600 mr-2"></i>
                            更多问题（可选）
                        </h3>
                        <div class="space-y-2">
                            ${this.followOnQuestions.map(q => `
                                <button onclick="LearningModule.showFollowOnQuestion(${q.id})" 
                                        class="w-full p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition text-left group">
                                    <div class="flex items-center justify-between">
                                        <div class="flex-1">
                                            <h4 class="text-sm font-semibold text-gray-700 group-hover:text-purple-600 transition">${q.title}</h4>
                                            <p class="text-xs text-gray-500 mt-1">${q.desc}</p>
                                        </div>
                                        <i class="fas fa-chevron-right text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition"></i>
                                    </div>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            `;
        } catch (error) {
            console.error('加载问题失败:', error.message || error);
            Utils.showToast('加载问题失败，请重试');
        }
    },

    toggleQuestion(questionId, title, desc) {
        const checkbox = document.querySelector(`input.question-checkbox[value="${questionId}"]`);
        if (!checkbox) {
            console.error('Checkbox not found for question:', questionId);
            return;
        }
        
        const isChecked = checkbox.checked;
        const alreadySelected = this.selectedQuestions.find(q => q.id === questionId);
        
        if (isChecked && !alreadySelected) {
            // 检查是否已达到最大选择数量（在添加之前检查）
            if (this.selectedQuestions.length >= 2) {
                checkbox.checked = false;
                Utils.showToast('最多只能选择2个问题，请先取消一个已选择的问题');
                return;
            }
            // 添加问题
            this.selectedQuestions.push({ id: questionId, title, desc });
            console.log('已选择问题:', this.selectedQuestions);
        } else if (!isChecked && alreadySelected) {
            // 移除问题
            this.selectedQuestions = this.selectedQuestions.filter(q => q.id !== questionId);
            console.log('已取消问题，剩余:', this.selectedQuestions);
        }
        
        // 更新UI显示（不重新渲染整个页面，只更新相关部分）
        this.updateQuestionSelectionUI();
    },

    updateQuestionSelectionUI() {
        const learningContainer = document.getElementById('learningContainer');
        if (!learningContainer) return;

        // 更新已选择提示
        const selectedInfo = learningContainer.querySelector('.selected-info');
        if (selectedInfo) {
            if (this.selectedQuestions.length > 0) {
                selectedInfo.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-bold text-purple-800 mb-1">已选择 ${this.selectedQuestions.length}/2 个问题</p>
                            <div class="flex flex-wrap gap-2 mt-2">
                                ${this.selectedQuestions.map(sq => `
                                    <span class="px-3 py-1 bg-purple-600 text-white text-xs rounded-full">${sq.title}</span>
                                `).join('')}
                            </div>
                        </div>
                        ${this.selectedQuestions.length >= 2 ? 
                            '<div class="text-green-600"><i class="fas fa-check-circle text-2xl"></i></div>' : 
                            '<div class="text-purple-400"><i class="fas fa-info-circle text-xl"></i></div>'
                        }
                    </div>
                `;
                selectedInfo.style.display = 'block';
            } else {
                selectedInfo.style.display = 'none';
            }
        }

        // 更新继续按钮
        const confirmBtn = learningContainer.querySelector('button[onclick*="confirmQuestions"]');
        if (confirmBtn) {
            if (this.selectedQuestions.length === 0) {
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<i class="fas fa-arrow-right mr-2"></i>请至少选择1个问题';
            } else if (this.selectedQuestions.length === 1) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-arrow-right mr-2"></i>开始学习这个问题';
            } else {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-arrow-right mr-2"></i>开始学习这2个问题';
            }
        }

        // 更新所有问题卡片的选中状态
        const allQuestionItems = learningContainer.querySelectorAll('.question-item');
        allQuestionItems.forEach(item => {
            const checkbox = item.querySelector('input.question-checkbox');
            if (!checkbox) return;
            
            const qId = parseInt(checkbox.value);
            const isSelected = this.selectedQuestions.find(sq => sq.id === qId);
            
            // 更新checkbox状态
            checkbox.checked = !!isSelected;
            
            // 更新禁用状态
            if (this.selectedQuestions.length >= 2 && !isSelected) {
                checkbox.disabled = true;
                item.classList.add('opacity-50');
            } else {
                checkbox.disabled = false;
                item.classList.remove('opacity-50');
            }
            
            // 更新卡片样式
            if (isSelected) {
                item.classList.add('border-purple-500', 'bg-purple-50');
                item.classList.remove('border-transparent');
                const icon = item.querySelector('.ml-3');
                if (icon) {
                    icon.innerHTML = '<div class="text-purple-600"><i class="fas fa-check-circle text-xl"></i></div>';
                }
            } else {
                item.classList.remove('border-purple-500', 'bg-purple-50');
                item.classList.add('border-transparent');
                const icon = item.querySelector('.ml-3');
                if (icon) {
                    icon.innerHTML = '<div class="text-gray-400 group-hover:text-purple-600 transition"><i class="fas fa-plus-circle text-xl"></i></div>';
                }
            }
        });
    },

    async confirmQuestions() {
        if (this.selectedQuestions.length === 0) {
            Utils.showToast('请至少选择1个问题');
            return;
        }

        if (!this.currentStock || !this.currentStock.id) {
            Utils.showToast('股票信息丢失');
            return;
        }

        try {
            // 记录用户选择的问题（使用第一个作为主要问题）
            this.selectedQuestion = this.selectedQuestions[0];
            
            // 如果有第二个问题，也记录下来
            if (this.selectedQuestions.length > 1) {
                console.log('用户选择了第二个问题:', this.selectedQuestions[1]);
            }

            // 先调用API记录用户选择（使用第一个问题）
            try {
                const response = await Utils.apiRequest('/learning/select-question', {
                    method: 'POST',
                    body: {
                        user_id: AppState.userId,
                        stock_id: this.currentStock.id,
                        question_id: this.selectedQuestion.id
                    }
                });

                if (!response || !response.success) {
                    console.warn('记录问题选择失败，但继续加载内容');
                }
            } catch (error) {
                console.warn('记录问题选择失败:', error);
                // 即使API失败也继续加载内容
            }

            // 显示学习模式选择界面
            this.showLearningModeSelection();
        } catch (error) {
            console.error('确认问题失败:', error);
            Utils.showToast('操作失败，请重试: ' + (error.message || '未知错误'));
        }
    },

    showLearningModeSelection() {
        Utils.showPage('learning-page');
        const learningContainer = document.getElementById('learningContainer');
        if (!learningContainer) return;

        learningContainer.innerHTML = `
            <!-- 返回按钮 -->
            <div class="mb-6">
                <button onclick="LearningModule.showQuestionSelection()" 
                        class="group relative px-6 py-3 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center text-gray-700 hover:text-purple-600 border border-gray-100 hover:border-purple-300">
                    <i class="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i>
                    <span class="font-semibold">返回问题选择</span>
                </button>
            </div>

            <!-- 股票信息卡片 -->
            <div class="relative mb-8 overflow-hidden rounded-3xl">
                <div class="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
                <div class="relative backdrop-blur-xl bg-white/10 p-8 border border-white/20">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <h2 class="text-4xl font-bold mb-2 text-white drop-shadow-lg">${this.currentStock.name}</h2>
                            <p class="text-xl opacity-90 text-white/90">${this.currentStock.code} · ${this.currentStock.sector}</p>
                            <p class="mt-3 text-white/70 text-sm">你选择的问题：${this.selectedQuestion.title}</p>
                        </div>
                        <div class="text-8xl opacity-20 animate-float">📚</div>
                    </div>
                </div>
            </div>

            <!-- 学习模式选择 -->
            <div class="mb-8">
                <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <span class="w-1 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></span>
                    <span class="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">选择学习模式</span>
                </h3>
                
                <div class="grid md:grid-cols-2 gap-6">
                    <!-- 快速学习模式 -->
                    <div class="relative group">
                        <div class="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <button onclick="LearningModule.startQuickLearn()" 
                                class="relative w-full p-8 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 text-left border-2 border-amber-200 hover:border-amber-400 hover:scale-[1.02] hover:-translate-y-1">
                            <div class="flex items-start gap-6">
                                <div class="relative">
                                    <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-4xl shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                        ⚡
                                    </div>
                                    <div class="absolute inset-0 bg-amber-400 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center gap-3 mb-3">
                                        <h4 class="text-2xl font-bold text-gray-800">快速学习</h4>
                                        <span class="px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold rounded-full shadow-lg">
                                            3分钟
                                        </span>
                                    </div>
                                    <p class="text-gray-600 mb-4 text-lg leading-relaxed">从热点事件出发，快速了解核心知识点</p>
                                    <ul class="space-y-2 text-sm text-gray-600">
                                        <li class="flex items-center gap-2">
                                            <i class="fas fa-check text-amber-500"></i>
                                            <span>基于最新热点事件</span>
                                        </li>
                                        <li class="flex items-center gap-2">
                                            <i class="fas fa-check text-amber-500"></i>
                                            <span>情景式学习体验</span>
                                        </li>
                                        <li class="flex items-center gap-2">
                                            <i class="fas fa-check text-amber-500"></i>
                                            <span>快速掌握核心要点</span>
                                        </li>
                                    </ul>
                                </div>
                                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white shadow-lg group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300">
                                    <i class="fas fa-arrow-right"></i>
                                </div>
                            </div>
                        </button>
                    </div>

                    <!-- 完整学习模式 -->
                    <div class="relative group">
                        <div class="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <button onclick="LearningModule.startFullLearning()" 
                                class="relative w-full p-8 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 text-left border-2 border-purple-200 hover:border-purple-400 hover:scale-[1.02] hover:-translate-y-1">
                            <div class="flex items-start gap-6">
                                <div class="relative">
                                    <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-4xl shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                        📖
                                    </div>
                                    <div class="absolute inset-0 bg-purple-400 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center gap-3 mb-3">
                                        <h4 class="text-2xl font-bold text-gray-800">完整学习</h4>
                                        <span class="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg">
                                            深度
                                        </span>
                                    </div>
                                    <p class="text-gray-600 mb-4 text-lg leading-relaxed">系统学习5个板块，全面了解公司投资价值</p>
                                    <ul class="space-y-2 text-sm text-gray-600">
                                        <li class="flex items-center gap-2">
                                            <i class="fas fa-check text-purple-500"></i>
                                            <span>5个板块系统学习</span>
                                        </li>
                                        <li class="flex items-center gap-2">
                                            <i class="fas fa-check text-purple-500"></i>
                                            <span>板块间插入问答环节</span>
                                        </li>
                                        <li class="flex items-center gap-2">
                                            <i class="fas fa-check text-purple-500"></i>
                                            <span>获得完整投资分析</span>
                                        </li>
                                    </ul>
                                </div>
                                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300">
                                    <i class="fas fa-arrow-right"></i>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    async startQuickLearn() {
        // 快速学习模式：通过答题来讲解
        if (!this.currentStock || !this.currentStock.id) {
            Utils.showToast('股票信息丢失，请重新选择');
            return;
        }

        // 显示加载状态
        Utils.showPage('learning-page');
        const learningContainer = document.getElementById('learningContainer');
        if (!learningContainer) {
            Utils.showToast('页面元素未找到');
            return;
        }

        learningContainer.innerHTML = `
            <div class="text-center py-20">
                <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-600 mb-4"></div>
                <p class="text-gray-600 text-lg">正在准备快速学习内容...</p>
            </div>
        `;

        try {
            // 获取热点事件和问题
            const hotQuestions = await Utils.apiRequest(`/learning/hot-questions?stock_id=${this.currentStock.id}`);
            
            if (!hotQuestions || !hotQuestions.success) {
                Utils.showToast('加载热点问题失败');
                return;
            }

            // 使用第一个热门问题作为起点
            const startQuestion = hotQuestions.questions && hotQuestions.questions.length > 0 
                ? hotQuestions.questions[0] 
                : this.selectedQuestion;

            // 开始快速学习流程：答题式讲解
            this.startQuickLearnFlow(startQuestion);
        } catch (error) {
            console.error('快速学习启动失败:', error);
            Utils.showToast('快速学习启动失败，请重试');
        }
    },

    async startQuickLearnFlow(startQuestion) {
        // 快速学习流程：通过答题来讲解知识点
        Utils.showPage('learning-page');
        const learningContainer = document.getElementById('learningContainer');
        if (!learningContainer) return;

        // 生成快速学习的题目序列（基于热点事件）
        const quickLearnQuizzes = this.generateQuickLearnQuizzes(startQuestion);

        // 初始化快速学习状态
        this.quickLearnState = {
            currentQuestionIndex: 0,
            quizzes: quickLearnQuizzes,
            correctCount: 0,
            totalQuestions: quickLearnQuizzes.length,
            knowledgePoints: []
        };

        // 显示第一题
        this.showQuickLearnQuestion();
    },

    generateQuickLearnQuizzes(startQuestion) {
        // 基于选择的问题生成快速学习的题目序列
        const stock = this.currentStock;
        const questionTitle = startQuestion?.title || "这家公司值得投资吗？";
        
        return [
            {
                id: 'quick_1',
                type: 'single',
                question: `关于"${questionTitle}"，我们需要从哪个角度开始分析？`,
                options: [
                    '公司的商业模式和赚钱方式',
                    '只看股价涨跌',
                    '听信市场传言',
                    '完全凭感觉'
                ],
                correct: 0,
                explanation: `正确！分析"${questionTitle}"首先要了解${stock.name}的商业模式，即它是如何赚钱的。这是投资分析的基础。`,
                knowledgePoint: `${stock.name}的商业模式是其投资价值的核心。我们需要了解：1）公司主要业务是什么；2）客户是谁；3）如何获得收入；4）成本结构如何。`
            },
            {
                id: 'quick_2',
                type: 'multiple',
                question: `分析${stock.name}的商业模式时，需要关注哪些关键要素？（多选）`,
                options: [
                    '主营业务和产品',
                    '目标客户群体',
                    '收入来源',
                    '成本结构',
                    '只看股价'
                ],
                correct: [0, 1, 2, 3],
                explanation: `很好！商业模式分析需要全面了解业务、客户、收入和成本。${stock.name}作为${stock.sector}行业的公司，其商业模式具有行业特点。`,
                knowledgePoint: `商业模式分析框架：1）业务模式：${stock.name}主要从事${stock.desc || '相关业务'}；2）客户群体：面向企业和个人消费者；3）盈利模式：通过产品销售和服务获取收入。`
            },
            {
                id: 'quick_3',
                type: 'single',
                question: `判断${stock.name}是否值得投资，最重要的财务指标是什么？`,
                options: [
                    'ROE（净资产收益率）和现金流',
                    '股价涨跌',
                    '市值大小',
                    '员工数量'
                ],
                correct: 0,
                explanation: `正确！ROE反映公司的盈利能力，现金流反映赚钱的真实性。这两个指标是判断投资价值的关键。`,
                knowledgePoint: `财务指标解读：1）ROE（净资产收益率）：反映公司用股东的钱赚钱的能力，优秀公司ROE通常>15%；2）现金流：反映公司实际收到多少钱，比利润更真实。`
            },
            {
                id: 'quick_4',
                type: 'truefalse',
                question: `投资${stock.name}时，需要关注行业发展趋势和竞争格局。`,
                options: ['正确', '错误'],
                correct: 0,
                explanation: `正确！行业趋势决定了公司的发展空间，竞争格局决定了公司的市场地位。这两个因素直接影响投资价值。`,
                knowledgePoint: `行业分析要点：1）行业发展趋势：${stock.sector}行业整体向好/调整；2）竞争格局：${stock.name}在行业中的地位；3）政策影响：相关政策对公司的影响。`
            },
            {
                id: 'quick_5',
                type: 'single',
                question: `关于"${questionTitle}"，你的初步判断是什么？`,
                options: [
                    '需要更多信息才能判断',
                    '肯定值得投资',
                    '肯定不值得投资',
                    '不需要分析'
                ],
                correct: 0,
                explanation: `很好！投资决策需要充分的信息和分析，不能盲目。通过刚才的学习，你已经掌握了分析"${questionTitle}"的基本框架。`,
                knowledgePoint: `投资决策框架：1）商业模式分析；2）财务指标评估；3）行业趋势判断；4）估值水平评估；5）风险管理。综合这些因素，才能做出明智的投资决策。`
            }
        ];
    },

    showQuickLearnQuestion() {
        const state = this.quickLearnState;
        if (!state || state.currentQuestionIndex >= state.quizzes.length) {
            // 完成所有题目，显示总结
            this.showQuickLearnSummary();
            return;
        }

        const currentQuiz = state.quizzes[state.currentQuestionIndex];
        const progress = ((state.currentQuestionIndex + 1) / state.totalQuestions * 100).toFixed(0);

        Utils.showPage('learning-page');
        const learningContainer = document.getElementById('learningContainer');
        if (!learningContainer) return;

        learningContainer.innerHTML = `
            <!-- 返回按钮 -->
            <div class="mb-6">
                <button onclick="LearningModule.showLearningModeSelection()" 
                        class="group relative px-6 py-3 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center text-gray-700 hover:text-purple-600 border border-gray-100 hover:border-purple-300">
                    <i class="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i>
                    <span class="font-semibold">返回学习模式选择</span>
                </button>
            </div>

            <!-- 进度条 -->
            <div class="mb-8">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-bold text-gray-700">快速学习进度</span>
                    <span class="text-sm font-bold text-amber-600">${state.currentQuestionIndex + 1}/${state.totalQuestions}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div class="bg-gradient-to-r from-amber-400 to-yellow-500 h-3 rounded-full transition-all duration-500" 
                         style="width: ${progress}%"></div>
                </div>
            </div>

            <!-- 股票信息卡片 -->
            <div class="relative mb-8 overflow-hidden rounded-3xl">
                <div class="absolute inset-0 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
                <div class="relative backdrop-blur-xl bg-white/10 p-6 border border-white/20">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <div class="w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
                                <span class="text-white/80 text-sm font-medium">快速学习模式</span>
                            </div>
                            <h2 class="text-3xl font-bold mb-1 text-white drop-shadow-lg">${this.currentStock.name}</h2>
                            <p class="text-lg opacity-90 text-white/90">${this.currentStock.code} · ${this.currentStock.sector}</p>
                        </div>
                        <div class="text-6xl opacity-20 animate-float">⚡</div>
                    </div>
                </div>
            </div>

            <!-- 题目卡片 -->
            <div class="bg-white rounded-3xl shadow-2xl p-8 mb-6 border-2 border-amber-200">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        ${state.currentQuestionIndex + 1}
                    </div>
                    <div class="flex-1">
                        <h3 class="text-2xl font-bold text-gray-800 mb-1">${currentQuiz.question}</h3>
                        <p class="text-sm text-gray-500">通过答题学习核心知识点</p>
                    </div>
                </div>

                <!-- 选项 -->
                <div class="space-y-3 mb-6" id="quickLearnOptions">
                    ${currentQuiz.options.map((option, index) => `
                        <button onclick="LearningModule.selectQuickLearnAnswer(${index})" 
                                class="w-full p-4 text-left bg-gray-50 hover:bg-amber-50 border-2 border-transparent hover:border-amber-300 rounded-xl transition-all duration-300 quiz-option group"
                                id="option_${index}">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg bg-white border-2 border-gray-300 group-hover:border-amber-400 flex items-center justify-center font-bold text-gray-600 group-hover:text-amber-600 transition-all">
                                    ${String.fromCharCode(65 + index)}
                                </div>
                                <span class="flex-1 text-gray-800 font-medium">${option}</span>
                            </div>
                        </button>
                    `).join('')}
                </div>

                <!-- 解释区域（初始隐藏） -->
                <div id="quickLearnExplanation" class="hidden">
                    <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-r-xl mb-4">
                        <div class="flex items-start gap-3">
                            <div class="text-2xl">${state.currentQuestionIndex < state.totalQuestions - 1 ? '💡' : '🎉'}</div>
                            <div class="flex-1">
                                <h4 class="font-bold text-green-800 mb-2">${state.currentQuestionIndex < state.totalQuestions - 1 ? '知识点讲解' : '学习完成'}</h4>
                                <p class="text-green-700 mb-3 leading-relaxed">${currentQuiz.explanation}</p>
                                ${currentQuiz.knowledgePoint ? `
                                    <div class="bg-white/60 rounded-lg p-4 mt-3">
                                        <p class="text-sm text-gray-700 leading-relaxed"><strong>核心要点：</strong>${currentQuiz.knowledgePoint}</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- 继续按钮 -->
                    <button onclick="LearningModule.nextQuickLearnQuestion()" 
                            class="w-full px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl hover:shadow-xl transition-all font-bold text-lg group">
                        <span class="flex items-center justify-center gap-2">
                            ${state.currentQuestionIndex < state.totalQuestions - 1 ? '下一题' : '查看总结'}
                            <i class="fas fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
                        </span>
                    </button>
                </div>
            </div>
        `;
    },

    selectQuickLearnAnswer(selectedIndex) {
        const state = this.quickLearnState;
        if (!state) return;

        const currentQuiz = state.quizzes[state.currentQuestionIndex];
        const isCorrect = Array.isArray(currentQuiz.correct) 
            ? currentQuiz.correct.includes(selectedIndex)
            : currentQuiz.correct === selectedIndex;

        // 禁用所有选项
        const options = document.querySelectorAll('#quickLearnOptions button');
        options.forEach((btn, index) => {
            btn.disabled = true;
            const optionEl = document.getElementById(`option_${index}`);
            if (optionEl) {
                if (isCorrect && index === selectedIndex) {
                    optionEl.classList.add('bg-green-100', 'border-green-500');
                } else if (!isCorrect && index === selectedIndex) {
                    optionEl.classList.add('bg-red-100', 'border-red-500');
                } else if (Array.isArray(currentQuiz.correct) && currentQuiz.correct.includes(index)) {
                    optionEl.classList.add('bg-green-100', 'border-green-500');
                }
            }
        });

        // 更新统计
        if (isCorrect) {
            state.correctCount++;
            // 添加知识点
            if (currentQuiz.knowledgePoint) {
                state.knowledgePoints.push(currentQuiz.knowledgePoint);
            }
            // 触发彩带效果
            if (CheckinModule && CheckinModule.triggerConfetti) {
                CheckinModule.triggerConfetti();
            }
        }

        // 显示解释
        const explanationEl = document.getElementById('quickLearnExplanation');
        if (explanationEl) {
            explanationEl.classList.remove('hidden');
            explanationEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // 更新积分
        if (isCorrect) {
            AppState.points = (AppState.points || 0) + 10;
            AppState.todayPoints = (AppState.todayPoints || 0) + 10;
            Utils.showToast(`回答正确！+10积分`, 2000);
        } else {
            Utils.showToast('回答错误，但学到了新知识！', 2000);
        }
    },

    nextQuickLearnQuestion() {
        const state = this.quickLearnState;
        if (!state) return;

        state.currentQuestionIndex++;
        this.showQuickLearnQuestion();
    },

    showQuickLearnSummary() {
        const state = this.quickLearnState;
        if (!state) return;

        Utils.showPage('learning-page');
        const learningContainer = document.getElementById('learningContainer');
        if (!learningContainer) return;

        const accuracy = ((state.correctCount / state.totalQuestions) * 100).toFixed(0);
        const pointsEarned = state.correctCount * 10;

        learningContainer.innerHTML = `
            <!-- 返回按钮 -->
            <div class="mb-6">
                <button onclick="LearningModule.showLearningModeSelection()" 
                        class="group relative px-6 py-3 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center text-gray-700 hover:text-purple-600 border border-gray-100 hover:border-purple-300">
                    <i class="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i>
                    <span class="font-semibold">返回学习模式选择</span>
                </button>
            </div>

            <!-- 完成卡片 -->
            <div class="relative mb-8 overflow-hidden rounded-3xl">
                <div class="absolute inset-0 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                <div class="relative backdrop-blur-xl bg-white/10 p-8 border border-white/20 text-center">
                    <div class="text-8xl mb-4 animate-bounce">🎉</div>
                    <h2 class="text-4xl font-bold mb-2 text-white drop-shadow-lg">快速学习完成！</h2>
                    <p class="text-xl opacity-90 text-white/90">你已经通过答题学习了${this.currentStock.name}的核心知识点</p>
                </div>
            </div>

            <!-- 学习统计 -->
            <div class="grid md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white rounded-2xl shadow-xl p-6 text-center border-2 border-green-200">
                    <div class="text-4xl mb-2">✅</div>
                    <div class="text-3xl font-bold text-green-600 mb-1">${state.correctCount}/${state.totalQuestions}</div>
                    <div class="text-sm text-gray-600">正确题数</div>
                </div>
                <div class="bg-white rounded-2xl shadow-xl p-6 text-center border-2 border-blue-200">
                    <div class="text-4xl mb-2">📊</div>
                    <div class="text-3xl font-bold text-blue-600 mb-1">${accuracy}%</div>
                    <div class="text-sm text-gray-600">正确率</div>
                </div>
                <div class="bg-white rounded-2xl shadow-xl p-6 text-center border-2 border-amber-200">
                    <div class="text-4xl mb-2">💰</div>
                    <div class="text-3xl font-bold text-amber-600 mb-1">+${pointsEarned}</div>
                    <div class="text-sm text-gray-600">获得积分</div>
                </div>
            </div>

            <!-- 知识点总结 -->
            <div class="bg-white rounded-2xl shadow-xl p-8 mb-8">
                <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <span class="w-1 h-8 bg-gradient-to-b from-amber-500 to-yellow-500 rounded-full"></span>
                    <span>📚 核心知识点总结</span>
                </h3>
                <div class="space-y-4">
                    ${state.knowledgePoints.map((point, index) => `
                        <div class="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 p-5 rounded-r-xl">
                            <div class="flex items-start gap-3">
                                <div class="w-8 h-8 rounded-lg bg-amber-400 text-white flex items-center justify-center font-bold flex-shrink-0">
                                    ${index + 1}
                                </div>
                                <p class="text-gray-700 leading-relaxed flex-1">${point}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 操作按钮 -->
            <div class="space-y-4">
                <button onclick="LearningModule.startQuickLearn()" 
                        class="w-full px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl hover:shadow-xl transition-all font-bold text-lg">
                    <i class="fas fa-redo mr-2"></i>重新学习
                </button>
                <button onclick="LearningModule.startFullLearning()" 
                        class="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-xl transition-all font-bold text-lg">
                    <i class="fas fa-book mr-2"></i>开始完整学习（5个板块）
                </button>
                <button onclick="LearningModule.showLearningModeSelection()" 
                        class="w-full px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-bold text-lg">
                    <i class="fas fa-arrow-left mr-2"></i>返回学习模式选择
                </button>
            </div>
        `;

        // 触发庆祝效果
        if (CheckinModule && CheckinModule.triggerConfetti) {
            setTimeout(() => {
                CheckinModule.triggerConfetti();
            }, 500);
        }
    },

    async startFullLearning() {
        // 开始完整学习模式：5个板块 + 问答
        const difficulty = this.currentDifficulty || 'simple';
        
        // 显示加载状态
        Utils.showPage('learning-page');
        const learningContainer = document.getElementById('learningContainer');
        if (learningContainer) {
            learningContainer.innerHTML = `
                <div class="text-center py-20">
                    <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mb-4"></div>
                    <p class="text-gray-600 text-lg">正在加载学习内容...</p>
                </div>
            `;
        }
        
        // 加载完整学习内容
        await this.loadLearningContent(difficulty);
    },

    async showFollowOnQuestion(questionId) {
        // 显示follow-on问题的详细内容
        const question = this.followOnQuestions.find(q => q.id === questionId);
        if (!question) {
            Utils.showToast('问题不存在');
            return;
        }

        // 可以在这里显示问题的详细解读，或者添加到已选择列表
        Utils.showToast(`查看问题：${question.title}`);
        
        // 如果用户想学习这个问题，可以添加到选择列表
        if (this.selectedQuestions.length < 2) {
            this.toggleQuestion(questionId, question.title, question.desc);
            const checkbox = document.querySelector(`input[value="${questionId}"]`);
            if (checkbox) checkbox.checked = true;
        } else {
            Utils.showToast('最多只能选择2个问题，请先取消一个已选择的问题');
        }
    },

    async selectQuestion(questionId) {
        // 检查currentStock是否存在
        if (!this.currentStock || !this.currentStock.id) {
            Utils.showToast('股票信息丢失，请重新选择');
            console.error('currentStock is null or invalid in selectQuestion');
            return;
        }
        
        try {
            // 记录用户选择
            const response = await Utils.apiRequest('/learning/select-question', {
                method: 'POST',
                body: {
                    user_id: AppState.userId,
                    stock_id: this.currentStock.id,
                    question_id: questionId
                }
            });

            if (!response || !response.success) {
                Utils.showToast(response?.message || '选择问题失败');
                return;
            }

            this.selectedQuestion = response.question;
            
            // 加载完整学习内容
            await this.loadLearningContent();
        } catch (error) {
            console.error('选择问题失败:', error.message || error);
            // 错误已经在 apiRequest 中显示了，这里不需要重复显示
        }
    },

    async startLearningWithDifficulty(difficulty) {
        if (!this.currentStock || !this.currentStock.id) {
            Utils.showToast('股票信息丢失，请重新选择');
            return;
        }

        // 设置当前难度
        this.currentDifficulty = difficulty;
        
        // 显示加载状态
        Utils.showPage('learning-page');
        const learningContainer = document.getElementById('learningContainer');
        if (learningContainer) {
            learningContainer.innerHTML = `
                <div class="text-center py-20">
                    <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mb-4"></div>
                    <p class="text-gray-600 text-lg">正在加载学习内容...</p>
                </div>
            `;
        }
        
        // 先显示问题选择界面
        await this.showQuestionSelection();
    },

    async loadLearningContent(difficulty = 'simple') {
        // 检查currentStock是否存在
        if (!this.currentStock || !this.currentStock.id) {
            Utils.showToast('股票信息丢失，请重新选择');
            console.error('currentStock is null or invalid in loadLearningContent');
            return;
        }
        
        try {
            const params = new URLSearchParams({
                user_id: AppState.userId,
                stock_id: this.currentStock.id,
                difficulty: difficulty
            });
            const response = await Utils.apiRequest(`/learning/content?${params.toString()}`);
            
            if (!response || !response.success) {
                Utils.showToast(response?.message || '加载学习内容失败');
                return;
            }

            this.learningContent = response.content;
            this.questionAnalysis = response.question_analysis || null;
            this.currentDifficulty = difficulty;
            this.unlockedDifficulties = response.unlocked_difficulties || ['simple'];
            
            // 确保 selectedQuestion 被设置（从API响应中获取）
            if (response.selected_question) {
                this.selectedQuestion = response.selected_question;
            }
            
            // 检查内容是否存在
            if (!this.learningContent) {
                console.error('API返回的学习内容为空:', response);
                const learningContainer = document.getElementById('learningContainer');
                if (learningContainer) {
                    learningContainer.innerHTML = `
                        <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
                            <h3 class="font-bold text-red-800 mb-2">学习内容加载失败</h3>
                            <p class="text-red-700">API返回的学习内容为空，请重试</p>
                            <button onclick="LearningModule.showLevelSelection()" 
                                    class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                                返回难度选择
                            </button>
                        </div>
                    `;
                }
                return;
            }
            
            // 使用后端返回的板块题目
            this.sectionQuizzes = response.section_quizzes || {};
            
            // 初始化每个板块的答题索引
            this.sectionQuizIndex = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
            this.sectionQuizAnswered = {1: false, 2: false, 3: false, 4: false, 5: false};
            
            // 显示完整学习流程：问题解读 + 5个板块 + 问答
            this.currentSection = 0; // 0表示问题解读，1-5表示5个板块
            this.renderFullLearningFlow();
        } catch (error) {
            console.error('加载学习内容失败:', error.message || error);
            // 错误已经在 apiRequest 中显示了，这里不需要重复显示
        }
    },

    initSectionQuizzes(difficulty = 'simple') {
        // 为每个板块生成对应难度的问答题目
        if (!this.currentStock) return;
        
        this.sectionQuizzes = {
            1: this.generateSectionQuiz(1, "问题理解", difficulty),
            2: this.generateSectionQuiz(2, "公司基本情况", difficulty),
            3: this.generateSectionQuiz(3, "公司经营情况", difficulty),
            4: this.generateSectionQuiz(4, "投资性价比", difficulty),
            5: this.generateSectionQuiz(5, "投资攻略", difficulty)
        };
        
        // 初始化每个板块的答题索引
        this.sectionQuizIndex = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    },

    generateSectionQuiz(sectionNum, sectionName, difficulty = 'simple') {
        // 根据难度生成不同深度的问答题目
        const stock = this.currentStock;
        const quizzes = [];
        
        // 难度配置
        const difficultyConfigs = {
            simple: {
                questionPrefix: "关于",
                detailLevel: 1,
                complexity: "基础"
            },
            advanced: {
                questionPrefix: "深入分析",
                detailLevel: 2,
                complexity: "进阶"
            },
            expert: {
                questionPrefix: "专业评估",
                detailLevel: 3,
                complexity: "高级"
            },
            master: {
                questionPrefix: "大师级分析",
                detailLevel: 4,
                complexity: "专家"
            }
        };
        
        const config = difficultyConfigs[difficulty] || difficultyConfigs.simple;
        
        if (sectionNum === 1) {
            // 问题理解相关
            if (difficulty === 'simple') {
                quizzes.push({
                    id: `s${sectionNum}_q1`,
                    type: "single",
                    question: `关于"${this.selectedQuestion?.title || '这个问题'}"，以下哪个说法最准确？`,
                    options: [
                        "需要从多个维度综合分析",
                        "只看股价就能判断",
                        "完全不需要考虑风险",
                        "投资决策很简单"
                    ],
                    correct: 0,
                    explanation: "投资分析需要从多个维度综合考虑，不能只看单一指标。"
                });
            } else if (difficulty === 'advanced') {
                quizzes.push({
                    id: `s${sectionNum}_q1`,
                    type: "multiple",
                    question: `分析"${this.selectedQuestion?.title || '这个问题'}"时，需要关注哪些关键因素？（多选）`,
                    options: [
                        "行业发展趋势",
                        "公司竞争优势",
                        "财务状况",
                        "估值水平",
                        "只看股价"
                    ],
                    correct: [0, 1, 2, 3],
                    explanation: "深入分析需要关注行业趋势、竞争优势、财务状况和估值水平等多个关键因素。"
                });
            } else {
                quizzes.push({
                    id: `s${sectionNum}_q1`,
                    type: "single",
                    question: `从专业角度分析"${this.selectedQuestion?.title || '这个问题'}"，最核心的判断标准是什么？`,
                    options: [
                        "商业模式本质和长期价值",
                        "短期股价波动",
                        "市场情绪",
                        "技术指标"
                    ],
                    correct: 0,
                    explanation: "专业分析应该关注商业模式本质和长期价值，而不是短期波动。"
                });
            }
        } else if (sectionNum === 2) {
            // 公司基本情况
            if (difficulty === 'simple') {
                quizzes.push({
                    id: `s${sectionNum}_q1`,
                    type: "single",
                    question: `${stock.name}的主要业务是什么？`,
                    options: [
                        stock.desc || "主营业务",
                        "房地产开发",
                        "金融投资",
                        "贸易进出口"
                    ],
                    correct: 0,
                    explanation: `${stock.name}的主要业务是${stock.desc || "主营业务"}。`
                });
            } else {
                quizzes.push({
                    id: `s${sectionNum}_q1`,
                    type: "multiple",
                    question: `${stock.name}的核心竞争力体现在哪些方面？（多选）`,
                    options: [
                        "技术优势",
                        "品牌价值",
                        "渠道优势",
                        "成本控制",
                        "没有竞争力"
                    ],
                    correct: [0, 1, 2, 3],
                    explanation: `${stock.name}作为行业龙头，在技术、品牌、渠道和成本控制等方面都具有竞争优势。`
                });
            }
        } else if (sectionNum === 3) {
            // 公司经营情况
            if (difficulty === 'simple') {
                quizzes.push({
                    id: `s${sectionNum}_q1`,
                    type: "truefalse",
                    question: `优秀的公司通常具有稳定的盈利能力和良好的财务状况。`,
                    options: ["正确", "错误"],
                    correct: 0,
                    explanation: "正确！优秀的公司应该具备稳定的盈利能力和良好的财务状况。"
                });
            } else {
                quizzes.push({
                    id: `s${sectionNum}_q1`,
                    type: "single",
                    question: "评估公司经营质量时，最重要的财务指标是什么？",
                    options: [
                        "ROE（净资产收益率）和现金流",
                        "股价涨跌",
                        "市值大小",
                        "员工数量"
                    ],
                    correct: 0,
                    explanation: "ROE和现金流是评估公司经营质量的核心指标，反映盈利能力和财务健康度。"
                });
            }
        } else if (sectionNum === 4) {
            // 投资性价比
            if (difficulty === 'simple') {
                quizzes.push({
                    id: `s${sectionNum}_q1`,
                    type: "single",
                    question: "评估投资性价比时，主要考虑哪些因素？",
                    options: [
                        "估值水平、成长性、盈利能力",
                        "只看股价高低",
                        "只看公司名称",
                        "只看股票代码"
                    ],
                    correct: 0,
                    explanation: "评估投资性价比需要综合考虑估值水平、成长性和盈利能力等多个因素。"
                });
            } else {
                quizzes.push({
                    id: `s${sectionNum}_q1`,
                    type: "multiple",
                    question: "专业估值分析需要考虑哪些因素？（多选）",
                    options: [
                        "PE、PB等估值指标",
                        "与历史估值对比",
                        "与同行业对比",
                        "DCF模型分析",
                        "只看当前股价"
                    ],
                    correct: [0, 1, 2, 3],
                    explanation: "专业估值需要综合使用多种估值方法和对比分析，不能只看单一指标。"
                });
            }
        } else if (sectionNum === 5) {
            // 投资攻略
            if (difficulty === 'simple') {
                quizzes.push({
                    id: `s${sectionNum}_q1`,
                    type: "multiple",
                    question: "投资决策时需要注意哪些方面？（多选）",
                    options: [
                        "充分了解公司基本面",
                        "评估投资风险",
                        "控制仓位",
                        "盲目跟风"
                    ],
                    correct: [0, 1, 2],
                    explanation: "投资决策需要充分了解公司基本面、评估风险并控制仓位，不应该盲目跟风。"
                });
            } else {
                quizzes.push({
                    id: `s${sectionNum}_q1`,
                    type: "single",
                    question: "制定投资策略时，最重要的是什么？",
                    options: [
                        "长期价值投资和风险管理",
                        "频繁交易",
                        "追涨杀跌",
                        "听信小道消息"
                    ],
                    correct: 0,
                    explanation: "专业的投资策略应该基于长期价值投资和严格的风险管理。"
                });
            }
        }
        
        return quizzes;
    },

    renderFullLearningFlow() {
        // 显示完整学习流程：问题解读 + 5个板块 + 板块间答题测试
        Utils.showPage('learning-page');
        const learningContainer = document.getElementById('learningContainer');
        if (!learningContainer) return;

        // 如果当前是问题解读阶段（currentSection = 0）
        if (this.currentSection === 0) {
            this.renderQuestionAnalysis();
        } 
        // 如果当前是答题阶段（currentSection = 1.5, 2.5, 3.5, 4.5, 5.5）
        else if (this.currentSection % 1 !== 0) {
            const sectionNum = Math.floor(this.currentSection);
            this.renderSectionQuiz(sectionNum);
        }
        // 如果当前是板块内容阶段（currentSection = 1-5）
        else {
            this.renderSectionContent(this.currentSection);
        }
    },

    renderQuestionAnalysis() {
        // 显示问题解读
        Utils.showPage('learning-page');
        const learningContainer = document.getElementById('learningContainer');
        if (!learningContainer) return;

        const question = this.selectedQuestion;
        const analysis = this.questionAnalysis || {};

        learningContainer.innerHTML = `
            <!-- 返回按钮 -->
            <div class="mb-6">
                <button onclick="LearningModule.showLearningModeSelection()" 
                        class="group relative px-6 py-3 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center text-gray-700 hover:text-purple-600 border border-gray-100 hover:border-purple-300">
                    <i class="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i>
                    <span class="font-semibold">返回学习模式选择</span>
                </button>
            </div>

            <!-- 进度指示 -->
            <div class="mb-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-bold text-gray-700">学习进度</span>
                    <span class="text-sm font-bold text-purple-600">问题解读 / 共6部分</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500" style="width: 16.67%"></div>
                </div>
            </div>

            <!-- 股票信息卡片 -->
            <div class="relative mb-8 overflow-hidden rounded-3xl">
                <div class="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800"></div>
                <div class="relative backdrop-blur-xl bg-white/10 p-8 border border-white/20">
                    <h2 class="text-3xl font-bold mb-2 text-white drop-shadow-lg">${this.currentStock.name}</h2>
                    <p class="text-xl opacity-90 text-white/90">${this.currentStock.code} · ${this.currentStock.sector}</p>
                </div>
            </div>

            <!-- 问题解读内容 -->
            <div class="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <h3 class="text-2xl font-bold text-gray-800 mb-4">📋 问题解读</h3>
                <h4 class="text-xl font-semibold text-purple-600 mb-4">${question?.title || '问题'}</h4>
                ${analysis.summary ? `<p class="text-lg text-gray-700 mb-4">${analysis.summary}</p>` : ''}
                ${analysis.points && analysis.points.length > 0 ? `
                    <div class="space-y-3 mb-4">
                        ${analysis.points.map(point => `
                            <div class="flex items-start">
                                <i class="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                                <p class="text-gray-700 flex-1">${point}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                ${analysis.conclusion ? `<p class="text-gray-700 font-medium mt-4">${analysis.conclusion}</p>` : ''}
            </div>

            <!-- 继续按钮 -->
            <button onclick="LearningModule.nextSection()" 
                    class="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-xl transition-all font-bold text-lg">
                <span class="flex items-center justify-center gap-2">
                    开始学习板块1
                    <i class="fas fa-arrow-right"></i>
                </span>
            </button>
        `;
    },

    renderSectionContent(sectionNum) {
        // 显示板块内容
        Utils.showPage('learning-page');
        const learningContainer = document.getElementById('learningContainer');
        if (!learningContainer) return;

        const content = this.learningContent;
        if (!content) return;

        const sections = [
            { num: 1, key: 'company_info', title: '公司基本情况' },
            { num: 2, key: 'operation', title: '公司经营情况' },
            { num: 3, key: 'operation', title: '公司经营情况（深入分析）', detailKey: 'operation_detail' },
            { num: 4, key: 'valuation', title: '投资性价比' },
            { num: 5, key: 'investment_strategy', title: '投资攻略' }
        ];

        const section = sections[sectionNum - 1];
        let sectionData = content[section.key] || {};
        
        // 如果是板块3，使用operation_detail
        if (sectionNum === 3 && section.detailKey && sectionData[section.detailKey]) {
            sectionData = sectionData[section.detailKey];
        }

        const progress = ((sectionNum + 1) / 6 * 100).toFixed(0);

        learningContainer.innerHTML = `
            <!-- 返回按钮 -->
            <div class="mb-6">
                <button onclick="LearningModule.previousSection()" 
                        class="group relative px-6 py-3 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center text-gray-700 hover:text-purple-600 border border-gray-100 hover:border-purple-300">
                    <i class="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i>
                    <span class="font-semibold">上一部分</span>
                </button>
            </div>

            <!-- 进度指示 -->
            <div class="mb-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-bold text-gray-700">学习进度</span>
                    <span class="text-sm font-bold text-purple-600">板块${sectionNum} / 共5个板块</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                </div>
            </div>

            <!-- 板块内容 -->
            ${this.renderSection(sectionNum, { title: section.title, data: sectionData })}

            <!-- 继续按钮 -->
            <button onclick="LearningModule.nextSection()" 
                    class="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-xl transition-all font-bold text-lg mt-6">
                <span class="flex items-center justify-center gap-2">
                    ${sectionNum < 5 ? '完成板块，开始答题测试' : '完成学习'}
                    <i class="fas fa-arrow-right"></i>
                </span>
            </button>
        `;
    },

    renderSectionQuiz(sectionNum) {
        // 显示板块答题测试
        Utils.showPage('learning-page');
        const learningContainer = document.getElementById('learningContainer');
        if (!learningContainer) return;

        const quizzes = this.sectionQuizzes[sectionNum] || [];
        const quizIndex = this.sectionQuizIndex[sectionNum] || 0;

        if (quizIndex >= quizzes.length) {
            // 该板块的题目已完成，进入下一板块
            this.sectionQuizAnswered[sectionNum] = true;
            this.currentSection = sectionNum + 1;
            this.renderFullLearningFlow();
            return;
        }

        const quiz = quizzes[quizIndex];
        const progress = ((quizIndex + 1) / quizzes.length * 100).toFixed(0);

        learningContainer.innerHTML = `
            <!-- 返回按钮 -->
            <div class="mb-6">
                <button onclick="LearningModule.previousSection()" 
                        class="group relative px-6 py-3 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center text-gray-700 hover:text-purple-600 border border-gray-100 hover:border-purple-300">
                    <i class="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i>
                    <span class="font-semibold">返回板块${sectionNum}</span>
                </button>
            </div>

            <!-- 进度指示 -->
            <div class="mb-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-bold text-gray-700">答题进度</span>
                    <span class="text-sm font-bold text-blue-600">板块${sectionNum} - 第${quizIndex + 1}/${quizzes.length}题</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                </div>
            </div>

            <!-- 答题卡片 -->
            ${this.renderQuizCard(quiz, sectionNum, quizIndex)}

            <!-- 解释区域（初始隐藏） -->
            <div id="quizExplanation_${sectionNum}_${quizIndex}" class="hidden mt-6">
                <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-r-xl mb-4">
                    <h4 class="font-bold text-green-800 mb-2">💡 解析</h4>
                    <p class="text-green-700 leading-relaxed">${quiz.explanation || '很好！'}</p>
                </div>

                <!-- 继续按钮 -->
                <button onclick="LearningModule.nextQuiz(${sectionNum})" 
                        class="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-xl transition-all font-bold text-lg">
                    <span class="flex items-center justify-center gap-2">
                        ${quizIndex < quizzes.length - 1 ? '下一题' : '完成答题，继续学习'}
                        <i class="fas fa-arrow-right"></i>
                    </span>
                </button>
            </div>
        `;
    },

    renderQuizCard(quiz, sectionNum, quizIndex) {
        // 根据题目类型渲染不同的答题界面
        const quizId = `quiz_${sectionNum}_${quizIndex}`;
        
        if (quiz.type === 'single') {
            // 单选题
            return `
                <div class="bg-white rounded-2xl shadow-xl p-8 mb-6 border-2 border-blue-200">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            ${quizIndex + 1}
                        </div>
                        <div class="flex-1">
                            <h3 class="text-2xl font-bold text-gray-800 mb-1">${quiz.question}</h3>
                            <p class="text-sm text-gray-500">单选题</p>
                        </div>
                    </div>

                    <div class="space-y-3" id="${quizId}_options">
                        ${quiz.options.map((option, index) => `
                            <button onclick="LearningModule.submitQuizAnswer(${sectionNum}, ${quizIndex}, ${index}, 'single')" 
                                    class="w-full p-4 text-left bg-gray-50 hover:bg-blue-50 border-2 border-transparent hover:border-blue-300 rounded-xl transition-all duration-300 quiz-option group"
                                    id="${quizId}_option_${index}">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-white border-2 border-gray-300 group-hover:border-blue-400 flex items-center justify-center font-bold text-gray-600 group-hover:text-blue-600 transition-all">
                                        ${String.fromCharCode(65 + index)}
                                    </div>
                                    <span class="flex-1 text-gray-800 font-medium">${option}</span>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (quiz.type === 'multiple') {
            // 多选题
            return `
                <div class="bg-white rounded-2xl shadow-xl p-8 mb-6 border-2 border-blue-200">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            ${quizIndex + 1}
                        </div>
                        <div class="flex-1">
                            <h3 class="text-2xl font-bold text-gray-800 mb-1">${quiz.question}</h3>
                            <p class="text-sm text-gray-500">多选题 ${quiz.hint || '（可多选）'}</p>
                        </div>
                    </div>

                    <div class="space-y-3 mb-6" id="${quizId}_options">
                        ${quiz.options.map((option, index) => `
                            <button onclick="LearningModule.toggleMultipleAnswer(${sectionNum}, ${quizIndex}, ${index})" 
                                    class="w-full p-4 text-left bg-gray-50 hover:bg-blue-50 border-2 border-transparent hover:border-blue-300 rounded-xl transition-all duration-300 quiz-option group"
                                    id="${quizId}_option_${index}">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-white border-2 border-gray-300 group-hover:border-blue-400 flex items-center justify-center font-bold text-gray-600 group-hover:text-blue-600 transition-all checkbox-icon">
                                        ${String.fromCharCode(65 + index)}
                                    </div>
                                    <span class="flex-1 text-gray-800 font-medium">${option}</span>
                                </div>
                            </button>
                        `).join('')}
                    </div>

                    <button onclick="LearningModule.submitQuizAnswer(${sectionNum}, ${quizIndex}, null, 'multiple')" 
                            class="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-xl transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            id="${quizId}_submit">
                        提交答案
                    </button>
                </div>
            `;
        } else if (quiz.type === 'truefalse') {
            // 判断题
            return `
                <div class="bg-white rounded-2xl shadow-xl p-8 mb-6 border-2 border-blue-200">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            ${quizIndex + 1}
                        </div>
                        <div class="flex-1">
                            <h3 class="text-2xl font-bold text-gray-800 mb-1">${quiz.question}</h3>
                            <p class="text-sm text-gray-500">判断题</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4" id="${quizId}_options">
                        ${quiz.options.map((option, index) => `
                            <button onclick="LearningModule.submitQuizAnswer(${sectionNum}, ${quizIndex}, ${index}, 'truefalse')" 
                                    class="p-6 text-center bg-gray-50 hover:bg-blue-50 border-2 border-transparent hover:border-blue-300 rounded-xl transition-all duration-300 quiz-option group"
                                    id="${quizId}_option_${index}">
                                <div class="text-4xl mb-2">${index === 0 ? '✅' : '❌'}</div>
                                <span class="text-lg font-bold text-gray-800">${option}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (quiz.type === 'sort') {
            // 排序题
            return `
                <div class="bg-white rounded-2xl shadow-xl p-8 mb-6 border-2 border-blue-200">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            ${quizIndex + 1}
                        </div>
                        <div class="flex-1">
                            <h3 class="text-2xl font-bold text-gray-800 mb-1">${quiz.question}</h3>
                            <p class="text-sm text-gray-500">排序题 ${quiz.hint || '（拖拽调整顺序）'}</p>
                        </div>
                    </div>

                    <div class="space-y-3 mb-6" id="${quizId}_sort_list">
                        ${quiz.options.map((option, index) => `
                            <div class="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-move hover:bg-blue-50 hover:border-blue-300 transition-all sort-item"
                                 data-index="${index}"
                                 draggable="true"
                                 ondragstart="LearningModule.handleDragStart(event)"
                                 ondragover="LearningModule.handleDragOver(event)"
                                 ondrop="LearningModule.handleDrop(event)">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold">
                                        ${index + 1}
                                    </div>
                                    <span class="flex-1 text-gray-800 font-medium">${option}</span>
                                    <i class="fas fa-grip-vertical text-gray-400"></i>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <button onclick="LearningModule.submitSortAnswer(${sectionNum}, ${quizIndex})" 
                            class="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-xl transition-all font-bold text-lg">
                        提交答案
                    </button>
                </div>
            `;
        }
        
        return '<div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">未知题目类型</div>';
    },

    // 导航函数
    nextSection() {
        if (this.currentSection === 0) {
            // 从问题解读进入板块1
            this.currentSection = 1;
        } else if (this.currentSection >= 1 && this.currentSection < 5) {
            // 完成板块后，进入答题测试（sectionNum.5）
            this.currentSection = this.currentSection + 0.5;
        } else if (this.currentSection === 5) {
            // 最后一个板块完成，进入完成页面
            this.completeLearning();
            return;
        }
        this.renderFullLearningFlow();
    },

    previousSection() {
        if (this.currentSection > 1) {
            if (this.currentSection % 1 !== 0) {
                // 如果在答题阶段，返回上一板块
                this.currentSection = Math.floor(this.currentSection);
            } else {
                // 如果在板块阶段，返回上一部分
                const prevSection = this.currentSection - 1;
                if (prevSection === 0) {
                    this.currentSection = 0;
                } else {
                    // 返回上一板块的答题
                    this.currentSection = prevSection + 0.5;
                }
            }
            this.renderFullLearningFlow();
        } else if (this.currentSection === 1) {
            // 返回问题解读
            this.currentSection = 0;
            this.renderFullLearningFlow();
        }
    },

    nextQuiz(sectionNum) {
        // 进入下一题或下一板块
        this.sectionQuizIndex[sectionNum] = (this.sectionQuizIndex[sectionNum] || 0) + 1;
        const quizzes = this.sectionQuizzes[sectionNum] || [];
        
        if (this.sectionQuizIndex[sectionNum] >= quizzes.length) {
            // 该板块答题完成，进入下一板块
            this.sectionQuizAnswered[sectionNum] = true;
            this.currentSection = sectionNum + 1;
        } else {
            // 继续下一题
            this.currentSection = sectionNum + 0.5;
        }
        this.renderFullLearningFlow();
    },

    // 答题函数
    submitQuizAnswer(sectionNum, quizIndex, answerIndex, quizType) {
        const quizzes = this.sectionQuizzes[sectionNum] || [];
        const quiz = quizzes[quizIndex];
        if (!quiz) return;

        let isCorrect = false;
        const quizId = `quiz_${sectionNum}_${quizIndex}`;

        if (quizType === 'single' || quizType === 'truefalse') {
            isCorrect = quiz.correct === answerIndex;
            
            // 禁用所有选项并显示结果
            quiz.options.forEach((option, index) => {
                const optionEl = document.getElementById(`${quizId}_option_${index}`);
                if (optionEl) {
                    optionEl.disabled = true;
                    if (index === answerIndex) {
                        if (isCorrect) {
                            optionEl.classList.add('bg-green-100', 'border-green-500');
                        } else {
                            optionEl.classList.add('bg-red-100', 'border-red-500');
                        }
                    }
                    if (index === quiz.correct && !isCorrect) {
                        optionEl.classList.add('bg-green-100', 'border-green-500');
                    }
                }
            });
        }

        // 显示解释
        const explanationEl = document.getElementById(`quizExplanation_${sectionNum}_${quizIndex}`);
        if (explanationEl) {
            explanationEl.classList.remove('hidden');
            explanationEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // 更新积分和触发效果
        if (isCorrect) {
            AppState.points = (AppState.points || 0) + 10;
            AppState.todayPoints = (AppState.todayPoints || 0) + 10;
            Utils.showToast('回答正确！+10积分', 2000);
            if (CheckinModule && CheckinModule.triggerConfetti) {
                CheckinModule.triggerConfetti();
            }
        } else {
            Utils.showToast('回答错误，但学到了新知识！', 2000);
        }
    },

    toggleMultipleAnswer(sectionNum, quizIndex, answerIndex) {
        // 多选题：切换选项选中状态
        const quizId = `quiz_${sectionNum}_${quizIndex}`;
        const optionEl = document.getElementById(`${quizId}_option_${answerIndex}`);
        if (!optionEl) return;

        const isSelected = optionEl.classList.contains('bg-blue-100');
        if (isSelected) {
            optionEl.classList.remove('bg-blue-100', 'border-blue-500');
        } else {
            optionEl.classList.add('bg-blue-100', 'border-blue-500');
        }
    },

    submitSortAnswer(sectionNum, quizIndex) {
        // 排序题：获取当前顺序并判断
        const quizId = `quiz_${sectionNum}_${quizIndex}`;
        const sortList = document.getElementById(`${quizId}_sort_list`);
        if (!sortList) return;

        const items = Array.from(sortList.querySelectorAll('.sort-item'));
        const currentOrder = items.map(item => parseInt(item.dataset.index));

        const quizzes = this.sectionQuizzes[sectionNum] || [];
        const quiz = quizzes[quizIndex];
        const isCorrect = JSON.stringify(currentOrder) === JSON.stringify(quiz.correct);

        // 显示结果
        items.forEach((item, index) => {
            const originalIndex = parseInt(item.dataset.index);
            if (originalIndex === quiz.correct[index]) {
                item.classList.add('bg-green-100', 'border-green-500');
            } else {
                item.classList.add('bg-red-100', 'border-red-500');
            }
        });

        // 显示解释
        const explanationEl = document.getElementById(`quizExplanation_${sectionNum}_${quizIndex}`);
        if (explanationEl) {
            explanationEl.classList.remove('hidden');
            explanationEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // 更新积分
        if (isCorrect) {
            AppState.points = (AppState.points || 0) + 10;
            AppState.todayPoints = (AppState.todayPoints || 0) + 10;
            Utils.showToast('排序正确！+10积分', 2000);
            if (CheckinModule && CheckinModule.triggerConfetti) {
                CheckinModule.triggerConfetti();
            }
        } else {
            Utils.showToast('排序有误，但学到了新知识！', 2000);
        }
    },

    // 排序题拖拽处理
    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.index);
        e.target.style.opacity = '0.5';
    },

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    },

    handleDrop(e) {
        e.preventDefault();
        const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const targetIndex = parseInt(e.target.closest('.sort-item').dataset.index);
        
        if (draggedIndex !== targetIndex) {
            const quizId = e.target.closest('[id$="_sort_list"]').id.replace('_sort_list', '');
            const sortList = document.getElementById(`${quizId}_sort_list`);
            const items = Array.from(sortList.querySelectorAll('.sort-item'));
            
            const draggedItem = items[draggedIndex];
            const targetItem = items[targetIndex];
            
            if (draggedIndex < targetIndex) {
                targetItem.after(draggedItem);
            } else {
                targetItem.before(draggedItem);
            }
            
            // 更新索引
            items.forEach((item, index) => {
                item.dataset.index = index;
                const numberEl = item.querySelector('.w-8');
                if (numberEl) numberEl.textContent = index + 1;
            });
        }
        
        e.target.style.opacity = '1';
    },

    renderLearningContent() {
        Utils.showPage('learning-page');
        const learningContainer = document.getElementById('learningContainer');
        if (!learningContainer) {
            console.error('learningContainer not found');
            return;
        }

        const content = this.learningContent;
        
        // 检查必要的数据是否存在
        if (!content) {
            console.error('learningContent is missing:', this.learningContent);
            learningContainer.innerHTML = `
                <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
                    <h3 class="font-bold text-red-800 mb-2">学习内容加载失败</h3>
                    <p class="text-red-700">学习内容数据缺失，请返回重新选择</p>
                    <button onclick="LearningModule.showLevelSelection()" 
                            class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                        返回难度选择
                    </button>
                </div>
            `;
            return;
        }
        
        if (!this.currentStock) {
            console.error('currentStock is missing:', this.currentStock);
            learningContainer.innerHTML = `
                <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
                    <h3 class="font-bold text-red-800 mb-2">股票信息丢失</h3>
                    <p class="text-red-700">请返回重新选择股票</p>
                    <button onclick="Utils.showPage('report-page'); ReportModule.renderReport();" 
                            class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                        返回报告页面
                    </button>
                </div>
            `;
            return;
        }
        
        // 确保 selectedQuestion 存在
        if (!this.selectedQuestion && content.selected_question) {
            this.selectedQuestion = content.selected_question;
        }
        
        // 如果没有selectedQuestion，使用默认值
        if (!this.selectedQuestion) {
            this.selectedQuestion = {
                title: "这家公司值得投资吗？",
                desc: "深入分析这家公司的投资价值"
            };
        }
        
        // 调试信息
        console.log('渲染学习内容 - 数据检查:', {
            hasContent: !!content,
            hasStock: !!this.currentStock,
            hasSelectedQuestion: !!this.selectedQuestion,
            contentStructure: content ? {
                hasSection1: !!content.section1,
                hasSection2: !!content.section2,
                hasSection3: !!content.section3,
                hasSection4: !!content.section4,
                hasSection5: !!content.section5,
                sectionKeys: Object.keys(content)
            } : 'content is null/undefined',
            stockInfo: this.currentStock ? {
                name: this.currentStock.name,
                code: this.currentStock.code
            } : 'stock is null'
        });

        learningContainer.innerHTML = `
            <!-- 返回按钮 -->
            <div class="mb-4">
                <button onclick="LearningModule.showLevelSelection()" 
                        class="text-gray-600 hover:text-purple-600 transition flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>返回关卡列表
                </button>
            </div>

            <!-- 顶部导航 -->
            <div class="bg-white rounded-2xl shadow-xl p-6 mb-6 sticky top-4 z-10">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">${this.currentStock.name}</h2>
                        <p class="text-gray-600">${this.currentStock.code}</p>
                    </div>
                    <button onclick="ReportModule.generateReport()" 
                            class="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-bold">
                        <i class="fas fa-chart-line mr-2"></i>查看投资画像
                    </button>
                </div>
            </div>

            <!-- 板块1：你选择的问题 -->
            ${this.selectedQuestion ? `
            <div class="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 mb-6 text-white">
                <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                        <span class="text-2xl font-bold">1</span>
                    </div>
                    <h3 class="text-2xl font-bold">你选择的问题</h3>
                </div>
                <div class="bg-white bg-opacity-10 rounded-xl p-6 mb-4">
                    <h4 class="text-xl font-bold mb-2">${this.selectedQuestion.title}</h4>
                    <p class="text-lg opacity-90">${this.selectedQuestion.desc}</p>
                </div>
            </div>
            ` : ''}

            <!-- 板块2：公司基本情况 -->
            ${content.section2 ? this.renderSection(2, content.section2) : '<div class="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg mb-6"><p class="text-yellow-800">板块2数据加载中...</p></div>'}

            <!-- 板块3：公司经营情况 -->
            ${content.section3 ? this.renderSection(3, content.section3) : '<div class="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg mb-6"><p class="text-yellow-800">板块3数据加载中...</p></div>'}

            <!-- 板块4：投资性价比情况 -->
            ${content.section4 ? this.renderSection(4, content.section4) : '<div class="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg mb-6"><p class="text-yellow-800">板块4数据加载中...</p></div>'}

            <!-- 板块5：后续投资攻略 -->
            ${content.section5 ? this.renderSection(5, content.section5) : '<div class="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg mb-6"><p class="text-yellow-800">板块5数据加载中...</p></div>'}

            <!-- 底部操作 -->
            <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div class="mb-6">
                    <i class="fas fa-check-circle text-green-500 text-6xl mb-4"></i>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">恭喜完成学习！</h3>
                    <p class="text-gray-600">你已经深入了解了 ${this.currentStock.name} 的投资价值</p>
                </div>
                <div class="flex gap-4">
                    <button onclick="LearningModule.showLevelSelection()" 
                            class="flex-1 px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-bold text-lg">
                        <i class="fas fa-list mr-2"></i>返回关卡列表
                    </button>
                    <button onclick="QuizModule.startQuiz(${this.currentStock.id}, 0)" 
                            class="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition font-bold text-lg">
                        <i class="fas fa-question-circle mr-2"></i>开始答题测试
                    </button>
                    <button onclick="LearningModule.completeLearning()" 
                            class="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-bold text-lg">
                        <i class="fas fa-trophy mr-2"></i>完成学习
                    </button>
                </div>
            </div>
        `;
    },

    renderSection(number, section) {
        // 检查 section 是否存在
        if (!section) {
            console.warn(`Section ${number} is missing`);
            return `<div class="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg mb-6">
                <p class="text-yellow-800 font-bold">板块${number}数据缺失</p>
                <p class="text-yellow-700 text-sm mt-2">请刷新页面重试</p>
            </div>`;
        }
        
        // 检查 section.data 是否存在
        if (!section.data) {
            console.warn(`Section ${number} data is missing`, section);
            // 即使没有data，也显示标题
            return `<div class="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <div class="flex items-center mb-6">
                    <div class="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mr-4">
                        <span class="text-2xl font-bold text-white">${number}</span>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold text-gray-800">${section.title || '未知标题'}</h3>
                        ${section.subtitle ? `<p class="text-gray-600">${section.subtitle}</p>` : ''}
                    </div>
                </div>
                <div class="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg">
                    <p class="text-yellow-800">该板块数据正在加载中，请稍候...</p>
                </div>
            </div>`;
        }
        
        const data = section.data;
        
        // 如果板块有markdown内容，直接渲染markdown（板块1、2、3、4、5都支持）
        if (data.markdown_content) {
            return `<div class="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <div class="flex items-center mb-6">
                    <div class="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mr-4">
                        <span class="text-2xl font-bold text-white">${number}</span>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold text-gray-800">${section.title || '未知标题'}</h3>
                        ${section.subtitle ? `<p class="text-gray-600">${section.subtitle}</p>` : ''}
                    </div>
                </div>
                <div class="prose prose-lg max-w-none markdown-content">
                    ${this.renderMarkdown(data.markdown_content)}
                </div>
            </div>`;
        }
        
        const subsections = Object.keys(data);
        
        // 如果subsections为空，显示提示
        if (subsections.length === 0) {
            return `<div class="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <div class="flex items-center mb-6">
                    <div class="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mr-4">
                        <span class="text-2xl font-bold text-white">${number}</span>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold text-gray-800">${section.title || '未知标题'}</h3>
                        ${section.subtitle ? `<p class="text-gray-600">${section.subtitle}</p>` : ''}
                    </div>
                </div>
                <div class="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                    <p class="text-blue-800">该板块内容正在准备中...</p>
                </div>
            </div>`;
        }

        return `
            <div class="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <div class="flex items-center mb-6">
                    <div class="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mr-4">
                        <span class="text-2xl font-bold text-white">${number}</span>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold text-gray-800">${section.title || '未知标题'}</h3>
                        ${section.subtitle ? `<p class="text-gray-600">${section.subtitle}</p>` : ''}
                    </div>
                </div>

                ${subsections.map((key, index) => {
                    const subsection = data[key];
                    // 检查 subsection 是否存在
                    if (!subsection) {
                        return '';
                    }
                    return `
                        <div class="mb-8 last:mb-0">
                            <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-4">
                                <h4 class="text-xl font-bold text-gray-800 mb-3 flex items-center">
                                    <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
                                    ${this.getSubsectionTitle(key)}
                                </h4>
                                <p class="text-lg text-gray-700 leading-relaxed">${subsection.summary || '暂无摘要'}</p>
                            </div>

                            ${subsection.points && subsection.points.length > 0 ? `
                            <div class="space-y-3 mb-4">
                                ${subsection.points.map(point => `
                                    <div class="flex items-start">
                                        <i class="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                                        <p class="text-gray-700 flex-1">${point}</p>
                                    </div>
                                `).join('')}
                            </div>
                            ` : ''}

                            ${subsection.chart ? this.renderChart(subsection.chart) : ''}
                        </div>
                    `;
                }).join('<div class="border-t border-gray-200 my-6"></div>')}
            </div>
        `;
    },

    renderMarkdown(markdown) {
        // 简单的markdown到HTML转换
        if (!markdown) return '';
        
        let html = markdown;
        
        // 标题转换
        html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-gray-800 mt-6 mb-3">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-gray-800 mt-8 mb-4">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-gray-800 mt-8 mb-4">$1</h1>');
        
        // 粗体
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-800">$1</strong>');
        
        // 列表项
        html = html.replace(/^- (.*$)/gim, '<li class="ml-4 mb-2 text-gray-700">$1</li>');
        html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 mb-2 text-gray-700">$1</li>');
        
        // 包装列表
        html = html.replace(/(<li.*<\/li>)/gs, '<ul class="list-disc list-inside space-y-2 mb-4">$1</ul>');
        
        // 段落
        html = html.split('\n\n').map(para => {
            if (para.trim() && !para.match(/^<[hul]/)) {
                return `<p class="text-gray-700 leading-relaxed mb-4">${para.trim()}</p>`;
            }
            return para;
        }).join('\n');
        
        // 分隔线
        html = html.replace(/^---$/gim, '<hr class="my-6 border-gray-300">');
        
        // 代码块（简单处理）
        html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>');
        
        return html;
    },

    getSubsectionTitle(key) {
        const titles = {
            'business_model': '赚钱门道（商业模式）',
            'moat': '护城河（核心壁垒）',
            'market_position': '江湖地位（竞争格局）',
            'growth': '成长速度（营收/利润增速）',
            'profitability': '盈利能力（ROE与毛利率）',
            'cash_flow': '赚钱真假（现金流与含金量）',
            'pe': '回本年限（PE市盈率）',
            'historical': '历史比价（估值分位点）',
            'dividend': '股东回报（分红与回购）',
            'catalysts': '催化剂（上涨理由）',
            'risks': '排雷针（潜在风险）',
            'recommendation': '最终建议（操作思路）'
        };
        return titles[key] || key;
    },

    renderChart(chart) {
        if (!chart || !chart.type) return '';

        const chartId = `chart_${Math.random().toString(36).substr(2, 9)}`;

        // 简化的图表展示（使用CSS实现）
        if (chart.type === 'pie') {
            if (!chart.labels || !chart.values || chart.labels.length === 0) {
                return '';
            }
            return `
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center justify-around">
                        ${chart.labels.map((label, i) => `
                            <div class="text-center">
                                <div class="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-2" 
                                     style="opacity: ${1 - i * 0.3}">
                                    <span class="text-white font-bold text-xl">${chart.values[i] || 0}%</span>
                                </div>
                                <p class="text-sm text-gray-600">${label}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (chart.type === 'bar') {
            if (!chart.labels || !chart.values || chart.labels.length === 0) {
                return '';
            }
            return `
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="space-y-3">
                        ${chart.labels.map((label, i) => `
                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <span class="text-sm text-gray-600">${label}</span>
                                    <span class="text-sm font-bold text-purple-600">${chart.values[i] || 0}%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-4">
                                    <div class="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500" 
                                         style="width: ${chart.values[i] || 0}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (chart.type === 'line') {
            if (!chart.labels || chart.labels.length === 0) {
                return '';
            }
            const values = chart.revenue || chart.values || [];
            if (values.length === 0) {
                return '';
            }
            const maxValue = Math.max(...values);
            return `
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-end justify-around h-40">
                        ${chart.labels.map((label, i) => {
                            const value = values[i] || 0;
                            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                            return `
                                <div class="flex flex-col items-center flex-1">
                                    <div class="w-full flex items-end justify-center mb-2" style="height: 120px;">
                                        <div class="w-12 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg transition-all duration-500" 
                                             style="height: ${height}%"></div>
                                    </div>
                                    <p class="text-xs text-gray-600">${label}</p>
                                    <p class="text-sm font-bold text-purple-600">${value}</p>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        return '';
    }
};

/***********************
 * 🚀 股票快速学习模块（3分钟版）
 * 从热点事件出发，情景式学习
 ***********************/
const StockQuickLearn = {
    currentStock: null,
    currentQuestionIndex: 0,
    correctCount: 0,
    knowledgeCards: [],
    
    // 每支股票的热点事件学习内容
    stockHotTopics: {
        '贵州茅台': {
            emoji: '🍷',
            hotEvent: '茅台年报发布：净利润747亿，分红545亿，股息率创新高！',
            color: 'from-amber-500 to-red-600',
            bgColor: 'from-amber-50 to-red-50',
            scenario: {
                role: '你是一位资深价值投资者',
                situation: '茅台股价1700元，PE 25倍，ROE 33%。朋友说"太贵了"，你怎么用数据说服他？'
            },
            questions: [
                {
                    situation: '📊 **数据盘点**：茅台2023年报显示——营收1476亿，净利润747亿，毛利率91.9%，净利率50.6%',
                    question: '茅台净利率50%意味着什么？（A股平均净利率约8%）',
                    options: [
                        { text: '卖100元，赚50元；普通公司只赚8元', value: 'A', feedback: '完全正确！这就是"印钞机"的含义', correct: true },
                        { text: '茅台员工工资很低，省出来的', value: 'B', feedback: '错！茅台人均薪酬超30万，远高于行业' },
                        { text: '茅台偷税漏税', value: 'C', feedback: '大错特错！茅台是纳税大户，一年税费超500亿' },
                        { text: '不太清楚，需要更多数据', value: 'D', feedback: '净利率=净利润÷营收，50%确实是印钞机级别' }
                    ],
                    knowledge: '💡 **净利率解读**：净利率=净利润÷营收。茅台50%净利率意味着每卖100元酒，纯赚50元。对比：苹果净利率25%，腾讯净利率25%，茅台是它们的2倍！'
                },
                {
                    situation: '🧮 **估值计算**：茅台股价1700元，总市值约2.1万亿，2023年净利润747亿',
                    question: '请估算茅台的市盈率PE（PE=市值÷净利润）',
                    options: [
                        { text: '约15倍（2.1万亿÷747亿≈28，但我算错了）', value: 'A', feedback: '计算有误，再想想' },
                        { text: '约28倍（21000亿÷747亿≈28）', value: 'B', feedback: '计算正确！28倍PE对于茅台这种确定性公司合理', correct: true },
                        { text: '约50倍', value: 'C', feedback: '算多了，21000÷747≈28' },
                        { text: '不会算，跳过', value: 'D', feedback: 'PE=市值÷利润，这是最基础的估值方法，必须掌握！' }
                    ],
                    knowledge: '💡 **PE计算实战**：PE(市盈率)=市值÷年利润。茅台2.1万亿÷747亿≈28倍。意思是：如果利润不增长，28年回本。但茅台利润年增15%，实际回本更快！'
                },
                {
                    situation: '📈 **ROE分析**：茅台ROE常年30%以上，而招行12%，万科8%，格力15%',
                    question: 'ROE 30%意味着什么？（假设你投入100万本金）',
                    options: [
                        { text: '每年能赚30万的利息', value: 'A', feedback: '不是利息，是资本回报率的概念' },
                        { text: '公司每年能用你的100万创造30万利润', value: 'B', feedback: '完美理解！这就是巴菲特最看重的指标', correct: true },
                        { text: '股价每年涨30%', value: 'C', feedback: '不一定，股价短期看情绪，长期才趋近ROE' },
                        { text: '分红率30%', value: 'D', feedback: '不对，ROE和分红率是不同概念' }
                    ],
                    knowledge: '💡 **ROE的魔力**：ROE=净利润÷净资产。茅台ROE 33%，假设10年复利：100万×1.33^10=**1745万**！难怪巴菲特说："如果只看一个指标，那就看ROE"'
                },
                {
                    situation: '💰 **分红决策**：茅台宣布2023年分红545亿，股息率约2.6%（当前股价）',
                    question: '2.6%股息率不如银行存款3%，为什么还值得买？',
                    options: [
                        { text: '确实不划算，不如存银行', value: 'A', feedback: '只看当前股息率太短视了' },
                        { text: '存款利率会降，茅台分红会涨', value: 'B', feedback: '说对了一半！' },
                        { text: '茅台分红连续20年增长，10年前买入按成本算股息率超15%', value: 'C', feedback: '满分！这就是"股息增长投资法"的精髓', correct: true },
                        { text: '茅台还有股价上涨空间', value: 'D', feedback: '对，但从分红角度看，增长率更关键' }
                    ],
                    knowledge: '💡 **股息增长的威力**：2014年买茅台成本约150元，当年分红约6元（股息率4%）。2024年分红约44元，按150元成本算股息率=**29%**！这就是长期持有优质股的回报。'
                },
                {
                    situation: '⚠️ **风险评估**：你朋友说"茅台年轻人都不喝，迟早完蛋"',
                    question: '这个观点对吗？茅台最大的风险是什么？',
                    options: [
                        { text: '对，年轻人消费习惯变了，茅台会衰落', value: 'A', feedback: '茅台卖的不是饮料，是社交货币和投资品' },
                        { text: '不对，茅台的消费场景是商务应酬，不是年轻人市场', value: 'B', feedback: '正确理解了茅台的核心用户场景！' },
                        { text: '真正风险是政策（反腐/限酒）和经济下行影响商务消费', value: 'C', feedback: '深度分析！这才是茅台的核心风险', correct: true },
                        { text: '没有风险，茅台永远涨', value: 'D', feedback: '任何投资都有风险，过度自信很危险' }
                    ],
                    knowledge: '💡 **风险识别**：茅台三大风险：①政策风险（反腐/限制三公消费）②经济下行压制商务消费 ③高端白酒产能增加稀释稀缺性。但短期内护城河仍然坚固，风险可控。'
                }
            ],
            summaryCards: [
                { icon: '📊', title: '净利率50%', content: '卖100元赚50元，A股平均只有8%' },
                { icon: '🧮', title: 'PE估值法', content: 'PE=市值÷利润，28倍PE需28年回本（不考虑增长）' },
                { icon: '💰', title: 'ROE复利', content: 'ROE 33%，100万10年变1745万' },
                { icon: '📈', title: '股息增长', content: '10年前买入，按成本算股息率超15%' },
                { icon: '⚠️', title: '核心风险', content: '政策+经济+产能，但短期护城河坚固' }
            ]
        },
        '比亚迪': {
            emoji: '🚗',
            hotEvent: '比亚迪2024年销量目标450万辆！秦Plus降到7.98万，价格战进入决战阶段',
            color: 'from-emerald-500 to-green-600',
            bgColor: 'from-emerald-50 to-green-50',
            scenario: {
                role: '你是一位汽车行业研究员',
                situation: '老板让你写一份比亚迪投资报告：销量302万辆（2023年），净利润300亿，股价却在200-270区间震荡。买入还是观望？'
            },
            questions: [
                {
                    situation: '📊 **销量数据**：比亚迪2023年卖了302万辆，同比+62%。其中海外24万辆，国内278万辆',
                    question: '302万辆是什么概念？',
                    options: [
                        { text: '和特斯拉差不多', value: 'A', feedback: '特斯拉2023年约181万辆，比亚迪是它的1.7倍！' },
                        { text: '超过特斯拉，成为全球新能源销量第一', value: 'B', feedback: '完全正确！而且是纯电+混动双线作战', correct: true },
                        { text: '还是比丰田少', value: 'C', feedback: '丰田是燃油车为主，新能源赛道比亚迪已登顶' },
                        { text: '不太清楚行业格局', value: 'D', feedback: '比亚迪已超越特斯拉成为全球新能源第一！' }
                    ],
                    knowledge: '💡 **全球格局**：2023年新能源销量TOP3：①比亚迪302万 ②特斯拉181万 ③上汽通用五菱93万。比亚迪用3年时间从第三冲到第一，这就是中国制造的速度！'
                },
                {
                    situation: '🧮 **单车利润**：比亚迪2023年净利润300亿，销量302万辆',
                    question: '请估算比亚迪单车净利润（每卖一辆车赚多少钱）',
                    options: [
                        { text: '约1万元/辆（300亿÷302万）', value: 'A', feedback: '计算正确！但对比特斯拉约5万/辆，还有提升空间', correct: true },
                        { text: '约3万元/辆', value: 'B', feedback: '算多了，300亿÷302万≈1万' },
                        { text: '约5000元/辆', value: 'C', feedback: '算少了，实际是1万左右' },
                        { text: '不赚钱，靠补贴活着', value: 'D', feedback: '大错特错！比亚迪早已盈利且补贴占比很小' }
                    ],
                    knowledge: '💡 **单车利润对比**：比亚迪约1万/辆，特斯拉约5万/辆，理想约3万/辆，蔚来亏3万/辆。比亚迪走的是"薄利多销"路线，靠规模取胜。利润率还有提升空间！'
                },
                {
                    situation: '⚔️ **价格战**：秦Plus从13万降到7.98万，降幅38%。行业哀嚎"卷死了"',
                    question: '比亚迪为什么敢降价这么狠？',
                    options: [
                        { text: '亏本赚吆喝，不可持续', value: 'A', feedback: '错！7.98万的秦Plus仍有利润' },
                        { text: '自研电池+芯片，成本比对手低20%以上', value: 'B', feedback: '核心原因！垂直整合带来的成本护城河', correct: true },
                        { text: '政府补贴撑着', value: 'C', feedback: '新能源补贴2023年已全面退坡' },
                        { text: '清库存，资金链紧张', value: 'D', feedback: '比亚迪账上现金超1000亿，不缺钱' }
                    ],
                    knowledge: '💡 **成本优势**：比亚迪自研刀片电池（成本比外购低30%）、自研芯片（IGBT自供）、自有产线。7.98万的秦Plus，毛利率仍有约15%，这就是"规模+垂直整合"的威力！'
                },
                {
                    situation: '🌍 **出海数据**：2023年出口24万辆，2024年目标翻倍。海外单车售价比国内高50%+',
                    question: '海外售价高50%，这对利润意味着什么？',
                    options: [
                        { text: '海外利润更高，是利润增长新引擎', value: 'A', feedback: '正确！海外可能贡献30%以上的利润增量', correct: true },
                        { text: '运费贵，实际利润差不多', value: 'B', feedback: '运费成本约5%，售价高50%，利润还是大增' },
                        { text: '海外销量小，影响有限', value: 'C', feedback: '24万辆已不小，且增速超100%' },
                        { text: '政治风险大，不看好', value: 'D', feedback: '风险存在，但东南亚、欧洲机会巨大' }
                    ],
                    knowledge: '💡 **出海算账**：假设国内单车利润1万，海外售价高50%，扣除运费关税，海外单车利润约2-2.5万。50万辆出口×2万利润=**100亿增量利润**，这就是出海的价值！'
                },
                {
                    situation: '📉 **股价困惑**：比亚迪2023年利润增长80%+，股价却在200-270震荡',
                    question: '利润大增股价不涨，为什么？应该买入吗？',
                    options: [
                        { text: '市场错了，坚决买入', value: 'A', feedback: '市场不一定错，要分析原因' },
                        { text: '担心价格战压缩利润率，增收不增利', value: 'B', feedback: '这是市场担忧之一' },
                        { text: '担心行业内卷+产能过剩，龙头也难独善其身', value: 'C', feedback: '正确识别风险！这是当前市场的核心担忧', correct: true },
                        { text: '新能源泡沫破了，不能投', value: 'D', feedback: '过于悲观，比亚迪基本面仍然强劲' }
                    ],
                    knowledge: '💡 **投资决策**：利润增长≠股价必涨。市场担心：①价格战持续压利润 ②行业产能过剩 ③经济下行抑制消费。但比亚迪成本优势+出海增量，长期仍是新能源最优标的。分批建仓为宜！'
                }
            ],
            summaryCards: [
                { icon: '🏆', title: '全球第一', content: '302万辆销量超特斯拉，新能源全球登顶' },
                { icon: '🧮', title: '单车利润', content: '约1万/辆，比特斯拉低但靠规模取胜' },
                { icon: '⚔️', title: '成本护城河', content: '自研电池芯片，成本低20%，价格战降维打击' },
                { icon: '🌍', title: '出海增量', content: '海外单车利润翻倍，50万辆=100亿增量' },
                { icon: '⚠️', title: '核心风险', content: '价格战+产能过剩，但龙头优势仍在' }
            ]
        },
        '宁德时代': {
            emoji: '🔋',
            hotEvent: '宁德时代发布神行电池：充电10分钟续航400公里！',
            color: 'from-blue-500 to-cyan-600',
            bgColor: 'from-blue-50 to-cyan-50',
            scenario: {
                role: '你是一位研究动力电池的投资者',
                situation: '宁德时代市占率35%，但比亚迪自供、车企去宁德化，还能投吗？'
            },
            questions: [
                {
                    situation: '📊 数据显示：宁德时代全球市占率35%，是第二名的2倍以上',
                    question: '这种龙头地位稳固吗？',
                    options: [
                        { text: '🏰 很稳，护城河很深', value: 'A', feedback: '有一定道理，但要警惕技术颠覆' },
                        { text: '⚠️ 有风险，车企在"去宁德化"', value: 'B', feedback: '正确！大客户分散供应商是趋势，但短期难替代', correct: true },
                        { text: '❌ 不稳，比亚迪会超越', value: 'C', feedback: '比亚迪电池主要自用，第三方市场宁德仍是老大' }
                    ],
                    knowledge: '💡 **去宁德化**：车企不想被一家供应商绑定，特斯拉、大众都在扶持二供。但电池技术壁垒高，短期内宁德仍是最优选，只是议价权会下降。'
                },
                {
                    situation: '🔬 你了解到：宁德时代研发费用一年180亿，是竞争对手的5倍',
                    question: '巨额研发投入意味着什么？',
                    options: [
                        { text: '💸 烧钱太多，不赚钱', value: 'A', feedback: '研发投入是投资未来，不是浪费' },
                        { text: '🚀 技术领先，拉开差距', value: 'B', feedback: '正确！麒麟电池、神行电池都是研发成果', correct: true },
                        { text: '📉 研发效率低，投入产出比差', value: 'C', feedback: '看成果，宁德专利数量和技术代际都领先' }
                    ],
                    knowledge: '💡 **研发护城河**：电池行业技术迭代快，研发是护城河。宁德时代专利数量超1万件，麒麟电池、神行电池保持技术代差，这就是180亿研发费的价值！'
                },
                {
                    situation: '🌐 宁德时代在德国、匈牙利、美国都建了工厂',
                    question: '海外建厂对宁德意味着什么？',
                    options: [
                        { text: '💰 成本增加，不划算', value: 'A', feedback: '短期成本高，但长期是必须的' },
                        { text: '🌍 绑定海外车企，稳住市场份额', value: 'B', feedback: '正确！本地化生产才能拿到宝马、大众等订单', correct: true },
                        { text: '⚠️ 政治风险大', value: 'C', feedback: '确实有风险，但不出海风险更大' }
                    ],
                    knowledge: '💡 **本地化策略**：欧美对中国电池有戒心，本地建厂是"门票"。宁德时代德国工厂供宝马，匈牙利工厂供奔驰，这些订单必须本地生产才能拿到！'
                }
            ],
            summaryCards: [
                { icon: '⚠️', title: '去宁德化风险', content: '车企分散供应商，但短期难以替代' },
                { icon: '🔬', title: '研发护城河', content: '180亿研发投入，专利1万+，保持技术代差' },
                { icon: '🌍', title: '本地化必须', content: '海外建厂是拿订单的"门票"' }
            ]
        },
        '腾讯控股': {
            emoji: '🎮',
            hotEvent: '腾讯2024年Q1：净利润419亿，同比+62%！回购超1000亿港币创纪录',
            color: 'from-blue-600 to-indigo-600',
            bgColor: 'from-blue-50 to-indigo-50',
            scenario: {
                role: '你是一位港股投资老手',
                situation: '腾讯从750港币跌到280后反弹到380。2021年你在600买入被套，现在该加仓摊平还是割肉离场？'
            },
            questions: [
                {
                    situation: '📊 **财报解读**：腾讯2024Q1营收1595亿，净利润419亿。2021年巅峰时季度利润约400亿',
                    question: '利润恢复到2021年水平，股价却只有巅峰的一半（380 vs 750），说明什么？',
                    options: [
                        { text: '市场情绪悲观，股价严重低估', value: 'A', feedback: '这是一种判断' },
                        { text: '2021年是泡沫，现在才是正常估值', value: 'B', feedback: '也有道理，当时PE超40倍' },
                        { text: '利润质量变了：游戏占比下降，视频号/小程序增长但不确定', value: 'C', feedback: '深度分析！利润结构变化影响估值', correct: true },
                        { text: '中美关系导致外资不敢买港股', value: 'D', feedback: '这是外因之一，但不是根本原因' }
                    ],
                    knowledge: '💡 **估值重构**：2021年腾讯PE超40倍（游戏高增长预期），现在PE约15倍（增速放缓+监管阴影）。不是股价错了，是市场对腾讯的"定价逻辑"变了：从成长股变成价值股。'
                },
                {
                    situation: '💰 **回购计算**：腾讯2023年回购1000亿港币，2024年继续每天回购3-4亿',
                    question: '1000亿回购相当于什么？',
                    options: [
                        { text: '相当于分红，但不用交税', value: 'A', feedback: '对，但还有更重要的意义' },
                        { text: '回购注销后，每股对应的利润/资产增加', value: 'B', feedback: '正确！这就是"提高股东价值"', correct: true },
                        { text: '托住股价，防止继续下跌', value: 'C', feedback: '有这个作用，但不是主要目的' },
                        { text: '公司钱太多，没地方投资', value: 'D', feedback: '侧面说明好项目变少了，这是隐忧' }
                    ],
                    knowledge: '💡 **回购数学**：腾讯总股本约94亿股，1000亿回购约注销3亿股（3%）。假设利润1600亿不变，每股利润从17元变成17.5元。连续回购5年，每股利润累计提升15%+！'
                },
                {
                    situation: '📱 **视频号数据**：MAU 8亿，日活4亿，用户时长同比+80%，广告收入仅占腾讯2%',
                    question: '视频号广告收入占比仅2%，意味着什么？',
                    options: [
                        { text: '视频号不赚钱，不值一提', value: 'A', feedback: '恰恰相反，占比低意味着增长空间大！' },
                        { text: '增量空间巨大，是腾讯最大的增长引擎', value: 'B', feedback: '正确！4亿日活只变现2%，想象空间巨大', correct: true },
                        { text: '说明腾讯不会做广告', value: 'C', feedback: '微信广告收入其实很高，只是视频号刚开始' },
                        { text: '抖音更强，视频号追不上', value: 'D', feedback: '不用追，视频号和抖音是差异化竞争' }
                    ],
                    knowledge: '💡 **视频号估值**：对标抖音（广告收入约3000亿），视频号当前仅约300亿。如果视频号广告做到1000亿，按15倍PE估值=**1.5万亿港币增量市值**！现在的腾讯相当于白送一个视频号。'
                },
                {
                    situation: '🎮 **游戏业务**：《王者荣耀》月流水仍超20亿，但增速放缓。海外游戏增长15%',
                    question: '游戏业务对腾讯意味着什么？',
                    options: [
                        { text: '核心现金牛，但增长乏力', value: 'A', feedback: '准确！游戏是基本盘，但不是增长点' },
                        { text: '版号放开后会大增', value: 'B', feedback: '版号已常态化，大增不太可能' },
                        { text: '游戏不重要了，关注视频号就行', value: 'C', feedback: '游戏贡献40%利润，非常重要' },
                        { text: '海外游戏是增长点，国内维稳就行', value: 'D', feedback: '正确理解！国内存量+海外增量', correct: true }
                    ],
                    knowledge: '💡 **游戏战略**：国内游戏进入存量竞争（增速0-5%），海外游戏是增量（增速15%+）。腾讯投资了Supercell、Epic Games、Riot Games，海外游戏收入已超500亿，占比持续提升。'
                },
                {
                    situation: '🧮 **投资决策**：你在600港币买入，现在380。有人说"止损"，有人说"加仓摊平"',
                    question: '从价值投资角度，现在应该？',
                    options: [
                        { text: '止损离场，承认错误', value: 'A', feedback: '如果基本面恶化可以，但腾讯基本面在改善' },
                        { text: '死扛不动，等回本', value: 'B', feedback: '这是最差的选择，既不加仓也不离场' },
                        { text: '用新的钱去买其他机会更大的股票', value: 'C', feedback: '如果有更好的选择，这也合理' },
                        { text: '如果相信腾讯长期价值，分批加仓摊平成本', value: 'D', feedback: '价值投资的做法！前提是对基本面有信心', correct: true }
                    ],
                    knowledge: '💡 **被套后怎么办**：①止损：承认错误，把钱用到更好的地方 ②死扛：最差选择，资金效率低 ③加仓：必须建立在"基本面改善"的判断上。腾讯PE 15倍、利润增长20%、疯狂回购，基本面在改善，加仓逻辑成立！'
                }
            ],
            summaryCards: [
                { icon: '📊', title: '估值重构', content: 'PE从40倍降到15倍，从成长股变价值股' },
                { icon: '💰', title: '回购数学', content: '年回购3%股份，5年提升每股利润15%+' },
                { icon: '📱', title: '视频号估值', content: '如做到1000亿广告=1.5万亿增量市值' },
                { icon: '🎮', title: '游戏战略', content: '国内存量+海外增量，海外收入超500亿' },
                { icon: '⚖️', title: '被套策略', content: '基本面改善则分批加仓，否则止损' }
            ]
        },
        '招商银行': {
            emoji: '🏦',
            hotEvent: '银行股集体暴跌！净息差收窄，招行股息率却超5%',
            color: 'from-red-500 to-rose-600',
            bgColor: 'from-red-50 to-rose-50',
            scenario: {
                role: '你是一位想要稳健收息的投资者',
                situation: '招行PE只有5倍，股息率5%+，比存款高多了。该买吗？'
            },
            questions: [
                {
                    situation: '📊 招行PE只有5倍，茅台是30倍，腾讯是20倍',
                    question: '为什么银行股估值这么低？',
                    options: [
                        { text: '📉 银行不赚钱', value: 'A', feedback: '银行很赚钱，招行一年利润1400亿' },
                        { text: '🏠 担心房地产坏账', value: 'B', feedback: '正确！市场担心房贷坏账，给了低估值', correct: true },
                        { text: '📈 银行股已经涨够了', value: 'C', feedback: '银行股这几年是跌的' }
                    ],
                    knowledge: '💡 **银行低估值之谜**：市场担心房地产风险传导到银行。但招行房贷占比低、不良率0.9%远好于同行。低估值反映的是"担忧"而非"现实"。'
                },
                {
                    situation: '💰 招行股息率5.2%，银行存款利率只有2%',
                    question: '买银行股收息vs存银行，哪个好？',
                    options: [
                        { text: '🏦 存银行更安全', value: 'A', feedback: '确实更安全，但收益差2倍多' },
                        { text: '📈 买银行股，收益更高', value: 'B', feedback: '对，但要承担股价波动风险', correct: true },
                        { text: '🤷 差不多', value: 'C', feedback: '收益差2.5倍，差很多' }
                    ],
                    knowledge: '💡 **股息投资法**：招行股息率5%+，是存款的2.5倍。如果长期持有不在乎股价涨跌，纯靠分红收入也很可观。这就是"类债券"投资法！'
                },
                {
                    situation: '🔍 你对比了几家银行：招行不良率0.9%，某银行2.5%',
                    question: '招行为什么比其他银行更值得投？',
                    options: [
                        { text: '📊 不良率低，资产质量好', value: 'A', feedback: '对！但还有更重要的原因' },
                        { text: '💳 零售业务占比高，更稳定', value: 'B', feedback: '完全正确！招行被称为"零售之王"', correct: true },
                        { text: '🏢 网点多，规模大', value: 'C', feedback: '招行网点其实不多，靠的不是规模' }
                    ],
                    knowledge: '💡 **零售银行优势**：招行50%以上收入来自零售（个人业务），而不是对公贷款。零售更分散、更稳定、不良率更低。这就是招行被叫"零售之王"的原因！'
                }
            ],
            summaryCards: [
                { icon: '🏠', title: '低估值原因', content: '市场担心房贷坏账，但招行不良率仅0.9%' },
                { icon: '💰', title: '股息投资', content: '5%股息率是存款2.5倍，适合收息策略' },
                { icon: '👑', title: '零售之王', content: '50%+零售收入，更稳定分散' }
            ]
        },
        '中芯国际': {
            emoji: '💻',
            hotEvent: '美国芯片禁令升级！中芯国际能否扛起国产替代大旗？',
            color: 'from-purple-500 to-violet-600',
            bgColor: 'from-purple-50 to-violet-50',
            scenario: {
                role: '你是一位关注科技自主的投资者',
                situation: '中芯是国内最先进的芯片制造商，但被制裁限制发展。投不投？'
            },
            questions: [
                {
                    situation: '🚫 美国禁止向中芯出售先进设备，7nm以下被卡脖子',
                    question: '制裁对中芯意味着什么？',
                    options: [
                        { text: '💀 发展彻底没戏了', value: 'A', feedback: '过于悲观，成熟制程仍有巨大市场' },
                        { text: '⚔️ 短期受限，长期国产替代受益', value: 'B', feedback: '正确！危与机并存，国产替代是大趋势', correct: true },
                        { text: '🤷 影响不大', value: 'C', feedback: '影响很大，但不是致命的' }
                    ],
                    knowledge: '💡 **国产替代逻辑**：制裁是危也是机。短期中芯先进制程受限，但国内28nm及以上需求巨大，且客户更愿意用国产。国产替代不是口号，是真金白银的订单！'
                },
                {
                    situation: '📊 你发现：中芯28nm及以上产能利用率接近满载',
                    question: '成熟制程（28nm+）有前途吗？',
                    options: [
                        { text: '❌ 落后了，不值钱', value: 'A', feedback: '大错特错！90%的芯片需求是成熟制程' },
                        { text: '✅ 够用了，汽车/家电/工业都需要', value: 'B', feedback: '正确！手机要先进制程，但大部分场景28nm就够', correct: true },
                        { text: '🤔 能活但赚不了大钱', value: 'C', feedback: '成熟制程利润也不低，中芯毛利率30%+' }
                    ],
                    knowledge: '💡 **成熟制程价值**：别被"先进制程"洗脑！汽车芯片、物联网、家电、工业控制，90%用28nm及以上就够了。中芯在这个市场是龙头，产能满载说明需求旺盛！'
                },
                {
                    situation: '⚠️ 中芯股价波动大，一条消息就能涨跌10%',
                    question: '投资中芯最需要注意什么？',
                    options: [
                        { text: '📉 股价太贵了', value: 'A', feedback: '估值不是最大问题' },
                        { text: '🎢 波动大，要控制仓位', value: 'B', feedback: '正确！政策敏感型股票，仓位不宜过重', correct: true },
                        { text: '📰 不要看新闻', value: 'C', feedback: '新闻还是要关注的' }
                    ],
                    knowledge: '💡 **政策敏感股投资**：中芯受地缘政治影响大，一条禁令消息就能暴涨暴跌。投资建议：①控制仓位5-10% ②长期持有不做波段 ③做好大幅波动心理准备。'
                }
            ],
            summaryCards: [
                { icon: '⚔️', title: '国产替代', content: '制裁是危也是机，国产替代订单是真金白银' },
                { icon: '🔧', title: '成熟制程', content: '90%芯片需求用28nm就够，中芯是这个市场龙头' },
                { icon: '⚠️', title: '仓位控制', content: '政策敏感股，仓位控制5-10%，做好波动准备' }
            ]
        }
    },
    
    // 获取默认学习内容
    getDefaultContent(stock) {
        return {
            emoji: '📈',
            hotEvent: `${stock.name}最新动态：行业龙头的投资价值分析`,
            color: 'from-purple-500 to-pink-600',
            bgColor: 'from-purple-50 to-pink-50',
            scenario: {
                role: '你是一位想了解这家公司的投资者',
                situation: `${stock.name}是${stock.sector}领域的重要公司，让我们一起来分析它的投资价值`
            },
            questions: [
                {
                    situation: `📊 你正在研究${stock.name}的财务数据`,
                    question: '投资一家公司前，最重要的是看什么？',
                    options: [
                        { text: '📈 股价走势', value: 'A', feedback: '股价反映的是过去，不是未来' },
                        { text: '💰 公司赚钱能力（盈利能力）', value: 'B', feedback: '正确！ROE、毛利率、净利率是核心指标', correct: true },
                        { text: '📰 新闻热度', value: 'C', feedback: '新闻热度不等于投资价值' }
                    ],
                    knowledge: '💡 **盈利能力指标**：ROE（净资产收益率）>15%是优秀，毛利率反映定价能力，净利率反映经营效率。三个指标结合看，就能判断公司赚钱能力！'
                },
                {
                    situation: `🔍 你想知道${stock.name}值不值这个价`,
                    question: '判断股票贵不贵，该看什么指标？',
                    options: [
                        { text: '📊 市盈率PE', value: 'A', feedback: '对，但要和同行业比较' },
                        { text: '⚖️ PEG（市盈率/增长率）', value: 'B', feedback: '完美！PEG<1可能被低估', correct: true },
                        { text: '💵 股价高低', value: 'C', feedback: '股价高低没意义，要看估值' }
                    ],
                    knowledge: '💡 **估值方法**：PE适合成熟企业，PEG适合成长企业。PEG=PE÷盈利增长率，小于1说明增速能支撑估值。记住：不同行业PE标准不同，不能跨行业比！'
                },
                {
                    situation: `🎯 你决定买入${stock.name}，但不知道买多少`,
                    question: '单只股票应该配置多少仓位？',
                    options: [
                        { text: '💰 看好就全仓梭哈', value: 'A', feedback: '风险太大！永远不要把鸡蛋放一个篮子' },
                        { text: '📊 5-15%，分散投资', value: 'B', feedback: '正确！单票仓位控制在15%以内是专业做法', correct: true },
                        { text: '🎲 随便买点', value: 'C', feedback: '投资要有计划，不能随意' }
                    ],
                    knowledge: '💡 **仓位管理**：专业投资者单票仓位一般不超过15%。高波动股票控制在10%以内。分散投资3-10只股票，既不过于集中，也不过于分散。'
                }
            ],
            summaryCards: [
                { icon: '💰', title: '看盈利能力', content: 'ROE>15%是优秀，结合毛利率和净利率判断' },
                { icon: '⚖️', title: 'PEG估值', content: 'PEG<1可能被低估，记得和同行业对比' },
                { icon: '📊', title: '仓位控制', content: '单票5-15%，分散投资3-10只' }
            ]
        };
    },
    
    // 开始学习
    start(stock) {
        if (!stock || !stock.name) {
            Utils.showToast('股票信息加载失败');
            return;
        }
        
        this.currentStock = stock;
        this.currentQuestionIndex = 0;
        this.correctCount = 0;
        this.knowledgeCards = [];
        
        // 获取该股票的学习内容
        const content = this.stockHotTopics[stock.name] || this.getDefaultContent(stock);
        this.currentContent = content;
        
        // 使用 learning-page 而不是 quick-learn-page（如果不存在）
        Utils.showPage('learning-page');
        this.showIntro();
    },
    
    // 显示介绍页
    showIntro() {
        const content = this.currentContent;
        const stock = this.currentStock;
        // 使用 learningContainer 而不是 quickLearnContainer
        const container = document.getElementById('learningContainer') || document.getElementById('quickLearnContainer');
        
        // 检查容器是否存在
        if (!container) {
            console.error('learningContainer not found');
            Utils.showToast('页面元素未找到，请刷新页面重试');
            // 如果容器不存在，使用 LearningModule 显示问题选择
            if (LearningModule && LearningModule.showQuestionSelection) {
                LearningModule.showQuestionSelection();
            }
            return;
        }
        
        container.innerHTML = `
            <div class="animate-fade-in-up">
                <!-- 热点事件卡片 -->
                <div class="bg-gradient-to-br ${content.color} rounded-3xl p-8 text-white relative overflow-hidden mb-6">
                    <div class="absolute inset-0 opacity-20">
                        <div class="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-20 -translate-y-20"></div>
                    </div>
                    <div class="relative z-10">
                        <div class="flex items-center gap-2 mb-4">
                            <span class="px-3 py-1 bg-white/20 rounded-full text-sm">🔥 热点事件</span>
                            <span class="px-3 py-1 bg-white/20 rounded-full text-sm">${stock.name}</span>
                        </div>
                        <div class="text-5xl mb-4">${content.emoji}</div>
                        <h2 class="text-2xl font-bold mb-2">${content.hotEvent}</h2>
                    </div>
                </div>

                <!-- 角色设定 -->
                <div class="bg-gradient-to-r ${content.bgColor} rounded-2xl p-6 mb-6 border border-white/50">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-14 h-14 rounded-full bg-gradient-to-br ${content.color} flex items-center justify-center text-white text-2xl shadow-lg">
                            🎭
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">你的身份</p>
                            <p class="font-bold text-gray-800 text-lg">${content.scenario.role}</p>
                        </div>
                    </div>
                    <p class="text-gray-600 text-lg">${content.scenario.situation}</p>
                </div>

                <!-- 学习目标 -->
                <div class="glass-card-solid p-6 mb-6">
                    <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span class="text-xl">🎯</span>
                        <span>3分钟后你将学会</span>
                    </h3>
                    <div class="space-y-2">
                        ${content.summaryCards.map(card => `
                            <div class="flex items-center gap-3 text-gray-600">
                                <span class="text-xl">${card.icon}</span>
                                <span>${card.title}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 开始按钮 -->
                <button onclick="StockQuickLearn.startQuestions()" 
                        class="group w-full py-5 bg-gradient-to-r ${content.color} text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                    <span class="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                    <span class="relative z-10 flex items-center justify-center gap-3">
                        <span>开始学习 ${stock.name}</span>
                        <i class="fas fa-play"></i>
                    </span>
                </button>
                
                <button onclick="Utils.showPage('report-page'); ReportModule.renderReport();" 
                        class="w-full mt-3 py-3 text-gray-500 hover:text-gray-700 transition">
                    ← 返回
                </button>
            </div>
        `;
    },
    
    // 开始问题
    startQuestions() {
        this.currentQuestionIndex = 0;
        this.showQuestion();
    },
    
    // 显示问题
    showQuestion() {
        const content = this.currentContent;
        const question = content.questions[this.currentQuestionIndex];
        const container = document.getElementById('learningContainer') || document.getElementById('quickLearnContainer');
        if (!container) {
            console.error('Container not found');
            Utils.showToast('页面元素未找到');
            return;
        }
        const progress = ((this.currentQuestionIndex + 1) / content.questions.length) * 100;
        
        container.innerHTML = `
            <div class="animate-fade-in-up">
                <!-- 进度条 -->
                <div class="mb-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-gray-500">问题 ${this.currentQuestionIndex + 1} / ${content.questions.length}</span>
                        <span class="text-sm font-medium text-gray-600">
                            <i class="fas fa-check-circle text-green-500 mr-1"></i>${this.correctCount} 答对
                        </span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div class="bg-gradient-to-r ${content.color} h-2 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                    </div>
                </div>

                <!-- 情景 -->
                <div class="bg-gradient-to-r ${content.bgColor} rounded-2xl p-5 mb-6 border border-white/50">
                    <p class="text-gray-700 text-lg">${question.situation}</p>
                </div>

                <!-- 问题 -->
                <div class="glass-card-solid p-6 mb-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-6">${question.question}</h3>
                    <div class="space-y-3">
                        ${question.options.map((opt, idx) => `
                            <button onclick="StockQuickLearn.answerQuestion('${opt.value}', ${opt.correct || false})" 
                                    class="w-full p-4 text-left rounded-xl border-2 border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 group"
                                    id="option-${opt.value}">
                                <div class="flex items-center gap-3">
                                    <span class="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-purple-200 flex items-center justify-center font-bold text-gray-500 group-hover:text-purple-600 transition-all">
                                        ${String.fromCharCode(65 + idx)}
                                    </span>
                                    <span class="text-gray-700 group-hover:text-gray-900">${opt.text}</span>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },
    
    // 回答问题
    answerQuestion(value, isCorrect) {
        const content = this.currentContent;
        const question = content.questions[this.currentQuestionIndex];
        const selectedOption = question.options.find(o => o.value === value);
        
        if (isCorrect) this.correctCount++;
        
        this.knowledgeCards.push({
            question: question.question,
            knowledge: question.knowledge,
            correct: isCorrect
        });
        
        this.showFeedback(selectedOption, isCorrect, question.knowledge);
    },
    
    // 显示反馈
    showFeedback(selectedOption, isCorrect, knowledge) {
        const content = this.currentContent;
        const container = document.getElementById('learningContainer') || document.getElementById('quickLearnContainer');
        if (!container) {
            console.error('Container not found');
            Utils.showToast('页面元素未找到');
            return;
        }
        
        container.innerHTML = `
            <div class="animate-fade-in-up">
                <div class="text-center mb-6">
                    <div class="inline-flex items-center justify-center w-20 h-20 rounded-full ${isCorrect ? 'bg-green-100' : 'bg-amber-100'} mb-4">
                        <span class="text-4xl">${isCorrect ? '🎉' : '💡'}</span>
                    </div>
                    <h2 class="text-2xl font-bold ${isCorrect ? 'text-green-600' : 'text-amber-600'}">
                        ${isCorrect ? '回答正确！' : '学到新知识！'}
                    </h2>
                </div>

                <div class="glass-card-solid p-5 mb-6">
                    <div class="flex items-start gap-3">
                        <span class="text-xl">${isCorrect ? '✅' : '📝'}</span>
                        <p class="text-gray-700">${selectedOption.feedback}</p>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-8 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div class="relative z-10">
                        <div class="flex items-center gap-2 mb-3">
                            <span class="text-xl">📚</span>
                            <span class="font-bold">知识点解锁</span>
                        </div>
                        <div class="text-white/90 leading-relaxed">${knowledge.replace(/\*\*(.*?)\*\*/g, '<strong class="text-yellow-300">$1</strong>')}</div>
                    </div>
                </div>

                <button onclick="StockQuickLearn.nextQuestion()" 
                        class="group w-full py-5 bg-gradient-to-r ${content.color} text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                    <span class="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                    <span class="relative z-10">
                        ${this.currentQuestionIndex < content.questions.length - 1 ? '下一题 →' : '查看学习成果 🎁'}
                    </span>
                </button>
            </div>
        `;
        
        // 播放音效
        QuickLearnModule.playSound && QuickLearnModule.playSound(isCorrect ? 'success' : 'learn');
    },
    
    // 下一题
    nextQuestion() {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.currentContent.questions.length) {
            this.showQuestion();
        } else {
            this.showSummary();
        }
    },
    
    // 显示总结
    showSummary() {
        const content = this.currentContent;
        const stock = this.currentStock;
        const container = document.getElementById('learningContainer') || document.getElementById('quickLearnContainer');
        const score = Math.round((this.correctCount / content.questions.length) * 100);
        const stars = score >= 90 ? 3 : score >= 60 ? 2 : 1;
        
        container.innerHTML = `
            <div class="animate-fade-in-up">
                <!-- 成就 -->
                <div class="text-center mb-8">
                    <div class="inline-block relative">
                        <div class="w-28 h-28 rounded-full bg-gradient-to-br ${content.color} flex items-center justify-center mx-auto mb-4 shadow-2xl">
                            <span class="text-5xl">${content.emoji}</span>
                        </div>
                        <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                            ${[0,1,2].map(i => `
                                <span class="text-2xl ${i < stars ? '' : 'opacity-30'}" style="animation: ${i < stars ? 'starPop 0.5s ease-out forwards' : 'none'}; animation-delay: ${i * 0.2}s">
                                    ${i < stars ? '⭐' : '☆'}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                    
                    <h2 class="text-3xl font-bold mt-6 mb-2">
                        <span class="bg-gradient-to-r ${content.color} bg-clip-text text-transparent">
                            ${stock.name} 学习完成！
                        </span>
                    </h2>
                    <p class="text-gray-500">获得 ${stars} 颗星</p>
                    
                    <div class="flex justify-center gap-6 mt-4">
                        <div class="text-center">
                            <p class="text-3xl font-bold text-green-500">${this.correctCount}</p>
                            <p class="text-sm text-gray-400">答对题目</p>
                        </div>
                        <div class="text-center">
                            <p class="text-3xl font-bold text-purple-500">${content.questions.length}</p>
                            <p class="text-sm text-gray-400">知识解锁</p>
                        </div>
                        <div class="text-center">
                            <p class="text-3xl font-bold text-amber-500">+${score}</p>
                            <p class="text-sm text-gray-400">积分获得</p>
                        </div>
                    </div>
                </div>

                <!-- 知识卡片 -->
                <div class="mb-8">
                    <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>📚</span>
                        <span>关于${stock.name}，你学到了</span>
                    </h3>
                    <div class="space-y-3">
                        ${content.summaryCards.map((card, idx) => `
                            <div class="glass-card-solid p-5 hover:shadow-lg transition-all" style="animation: fadeInUp 0.5s ease-out ${idx * 0.15}s forwards; opacity: 0;">
                                <div class="flex items-start gap-4">
                                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${content.color} flex items-center justify-center text-2xl shadow-lg">
                                        ${card.icon}
                                    </div>
                                    <div class="flex-1">
                                        <h4 class="font-bold text-gray-800 mb-1">${card.title}</h4>
                                        <p class="text-gray-500 text-sm">${card.content}</p>
                                    </div>
                                    <span class="text-green-500 text-sm">✓</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 操作按钮 -->
                <div class="space-y-3">
                    <!-- 游戏中心入口 - 超大按钮 -->
                    <button onclick="GameCenter.show()" 
                            class="w-full py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 relative overflow-hidden animate-pulse">
                        <div class="absolute inset-0 bg-white/20 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <div class="relative z-10 flex items-center justify-center gap-3">
                            <span class="text-3xl animate-bounce">🎮</span>
                            <span>进入游戏中心</span>
                            <span class="text-xl">→</span>
                        </div>
                        <div class="absolute top-2 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                            NEW!
                        </div>
                    </button>
                    
                    <button onclick="Utils.showPage('report-page'); ReportModule.renderReport();" 
                            class="w-full py-4 bg-gradient-to-r ${content.color} text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all">
                        🎉 继续探索其他股票
                    </button>
                    <button onclick="QuickLearnModule.start()" 
                            class="w-full py-4 bg-white text-gray-700 rounded-2xl font-bold text-lg shadow-lg border border-gray-100">
                        🔥 学习其他热点话题
                    </button>
                </div>
            </div>
        `;
        
        // 庆祝效果
        if (stars >= 2) {
            setTimeout(() => {
                CheckinModule.triggerConfetti && CheckinModule.triggerConfetti();
            }, 500);
        }
        
        // 更新学习地图
        if (LearningMapModule && LearningMapModule.completeStock) {
            LearningMapModule.completeStock(stock.name, stars);
        }
    }
};

// 暴露到全局
window.StockQuickLearn = StockQuickLearn;

/***********************
 * 关卡学习模块（保留兼容，但跳转到快速学习）
 ***********************/
const LevelModule = {
    currentStock: null,
    currentLevel: 0,
    levels: [],
    
    async startLevelLearning(stock) {
        // 使用学习模块
        if (LearningModule && LearningModule.startLearning) {
            await LearningModule.startLearning(stock);
        } else {
            Utils.showToast('学习模块未加载，请刷新页面重试');
            console.error('LearningModule not available');
        }
    },
    
    async loadLevels() {
        try {
            const response = await Utils.apiRequest(`/learning/levels?stock_id=${this.currentStock.id}`);
            if (response && response.success) {
                this.levels = response.levels;
            }
        } catch (error) {
            console.error('加载关卡失败:', error);
        }
    },
    
    showLevelMap() {
        Utils.showPage('report-page');
        const reportContainer = document.getElementById('reportContainer');
        
        if (!reportContainer) return;
        
        reportContainer.innerHTML = `
            <div class="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <div class="text-center mb-8">
                    <div class="text-6xl mb-4">🎮</div>
                    <h2 class="text-3xl font-bold text-gray-800 mb-2">学习关卡</h2>
                    <h3 class="text-2xl text-purple-600 mb-4">${this.currentStock.name}</h3>
                    <p class="text-gray-600 text-lg">完成5个关卡，深入了解这家公司</p>
                </div>
                
                <!-- 关卡地图 -->
                <div class="space-y-4">
                    ${this.levels.map((level, index) => `
                        <div class="relative">
                            ${index > 0 ? `
                                <div class="absolute left-1/2 -top-4 w-1 h-4 bg-gradient-to-b from-purple-300 to-transparent transform -translate-x-1/2"></div>
                            ` : ''}
                            
                            <button onclick="LevelModule.enterLevel(${index})" 
                                    class="w-full p-6 rounded-2xl transition-all duration-300 ${
                                        level.locked 
                                        ? 'bg-gray-100 cursor-not-allowed opacity-50' 
                                        : 'bg-gradient-to-r from-purple-50 to-pink-50 hover:shadow-xl hover:scale-105 cursor-pointer'
                                    }"
                                    ${level.locked ? 'disabled' : ''}>
                                <div class="flex items-center">
                                    <div class="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-3xl mr-4 shadow-lg">
                                        ${level.locked ? '🔒' : level.icon}
                                    </div>
                                    <div class="flex-1 text-left">
                                        <h3 class="text-xl font-bold text-gray-800 mb-1">关卡 ${index + 1}: ${level.title}</h3>
                                        <p class="text-gray-600">${level.desc}</p>
                                    </div>
                                    ${!level.locked ? `
                                        <i class="fas fa-chevron-right text-purple-600 text-2xl"></i>
                                    ` : ''}
                                </div>
                            </button>
                        </div>
                    `).join('')}
                </div>
                
                <!-- 底部按钮 -->
                <div class="mt-8 flex gap-4">
                    <button onclick="ReportModule.generateReport()" 
                            class="flex-1 px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-bold text-lg">
                        <i class="fas fa-arrow-left mr-2"></i>返回画像
                    </button>
                    <button onclick="CollectionModule.showCollection()" 
                            class="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-bold text-lg">
                        <i class="fas fa-trophy mr-2"></i>查看图鉴
                    </button>
                </div>
            </div>
        `;
    },
    
    selectedQuestion: null, // 用户选择的问题
    
    async enterLevel(levelIndex) {
        this.currentLevel = levelIndex;
        const level = this.levels[levelIndex];
        
        // 确保 LearningModule.currentStock 也被设置
        if (this.currentStock) {
            LearningModule.currentStock = this.currentStock;
        }
        
        // 第一个关卡（热门问题）需要先让用户选择问题
        if (levelIndex === 0 && !this.selectedQuestion) {
            await this.showQuestionSelection();
            return;
        }
        
        // 加载该关卡的学习内容
        await LearningModule.loadLearningContent();
        
        // 渲染关卡内容
        this.renderLevelContent(level);
    },
    
    // 显示问题选择界面
    async showQuestionSelection() {
        Utils.showPage('report-page');
        const reportContainer = document.getElementById('reportContainer');
        if (!reportContainer) return;
        
        // 获取问题列表
        try {
            const response = await Utils.apiRequest(`/learning/questions?stock_id=${this.currentStock.id}`);
            
            if (!response || !response.success) {
                Utils.showToast('加载问题失败');
                return;
            }
            
            const questions = response.questions;
            
            reportContainer.innerHTML = `
                <div class="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto pop-in">
                    <div class="text-center mb-8">
                        <div class="text-6xl mb-4">🤔</div>
                        <h2 class="text-3xl font-bold text-gray-800 mb-2">选择你最感兴趣的问题</h2>
                        <p class="text-gray-600 text-lg">关于 <span class="text-purple-600 font-bold">${this.currentStock.name}</span>，你最想了解什么？</p>
                    </div>
                    
                    <div class="space-y-4 mb-6">
                        ${questions.map((q, index) => `
                            <button onclick="LevelModule.selectQuestion(${q.id}, '${q.title.replace(/'/g, "\\'")}', '${q.desc.replace(/'/g, "\\'")}')" 
                                    class="w-full p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-transparent hover:border-purple-500 hover:shadow-lg transition-all duration-300 text-left group transform hover:scale-102">
                                <div class="flex items-start">
                                    <div class="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">
                                        ${index + 1}
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition">${q.title}</h3>
                                        <p class="text-gray-600">${q.desc}</p>
                                    </div>
                                    <div class="text-purple-400 group-hover:text-purple-600 transition ml-4">
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                        </svg>
                                    </div>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                    
                    <div class="text-center text-gray-500 text-sm">
                        💡 选择后，我们将围绕这个问题为你解读 ${this.currentStock.name}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('加载问题失败:', error);
            Utils.showToast('加载问题失败，请重试');
        }
    },
    
    // 用户选择问题
    async selectQuestion(questionId, title, desc) {
        this.selectedQuestion = {
            id: questionId,
            title: title,
            desc: desc
        };
        
        // 调用API记录用户选择
        try {
            await Utils.apiRequest('/learning/select-question', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: AppState.userId,
                    stock_id: this.currentStock.id,
                    question_id: questionId
                })
            });
        } catch (error) {
            console.error('记录选择失败:', error);
        }
        
        // 显示选择确认动画
        this.showSelectionConfirmation();
    },
    
    // 显示选择确认
    showSelectionConfirmation() {
        const reportContainer = document.getElementById('reportContainer');
        if (!reportContainer) return;
        
        reportContainer.innerHTML = `
            <div class="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto pop-in">
                <div class="text-center mb-8">
                    <div class="text-6xl mb-4 pop-in">✅</div>
                    <h2 class="text-3xl font-bold text-gray-800 mb-4">好问题！</h2>
                    <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6 border-2 border-purple-200">
                        <p class="text-xl text-purple-700 font-medium">"${this.selectedQuestion.title}"</p>
                    </div>
                    <p class="text-gray-600 text-lg mb-8">接下来，让我们一起找到答案！</p>
                    
                    <button onclick="LevelModule.continueAfterSelection()" 
                            class="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-bold text-xl transform hover:scale-105">
                        开始学习 →
                    </button>
                </div>
            </div>
        `;
    },
    
    // 选择后继续学习
    async continueAfterSelection() {
        // 加载学习内容
        await LearningModule.loadLearningContent();
        
        // 渲染第一关内容（包含用户选择的问题）
        this.renderLevelContentWithQuestion();
    },
    
    // 渲染包含用户选择问题的关卡内容
    renderLevelContentWithQuestion() {
        const reportContainer = document.getElementById('reportContainer');
        if (!reportContainer || !LearningModule.learningContent) return;
        
        const content = LearningModule.learningContent;
        const level = this.levels[0];
        const section = content.section1;
        
        if (!section) {
            Utils.showToast('关卡内容加载失败');
            return;
        }
        
        reportContainer.innerHTML = `
            <div class="bg-white rounded-2xl shadow-xl p-8 mb-6 pop-in">
                <!-- 关卡头部 -->
                <div class="flex items-center justify-between mb-6">
                    <button onclick="LevelModule.showLevelMap()" 
                            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                        ← 返回关卡地图
                    </button>
                    <div class="text-center">
                        <div class="text-4xl mb-2">${level.icon}</div>
                        <h3 class="text-xl font-bold text-gray-800">关卡 1</h3>
                    </div>
                    <div class="w-24"></div>
                </div>
                
                <!-- 用户选择的问题 -->
                <div class="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 mb-6 border-l-4 border-amber-500">
                    <div class="flex items-start">
                        <div class="text-3xl mr-4">🎯</div>
                        <div>
                            <p class="text-sm text-amber-600 font-medium mb-1">你选择的问题</p>
                            <h3 class="text-xl font-bold text-gray-800">${this.selectedQuestion.title}</h3>
                            <p class="text-gray-600 mt-1">${this.selectedQuestion.desc}</p>
                        </div>
                    </div>
                </div>
                
                <!-- 关卡内容 -->
                <div class="mb-8">
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">📊 让我们来解答这个问题</h2>
                    <p class="text-gray-600 mb-6">以下是关于 ${this.currentStock.name} 的核心信息</p>
                    
                    ${LearningModule.renderSection(1, section)}
                </div>
                
                <!-- 完成按钮 -->
                <div class="text-center">
                    <button onclick="QuizModule.startQuiz(${this.currentStock.id}, 0)" 
                            class="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-bold text-lg transform hover:scale-105">
                        ✓ 完成学习，开始答题
                    </button>
                </div>
            </div>
        `;
    },
    
    renderLevelContent(level) {
        const reportContainer = document.getElementById('reportContainer');
        if (!reportContainer || !LearningModule.learningContent) return;
        
        const content = LearningModule.learningContent;
        const sectionKey = `section${this.currentLevel + 1}`;
        const section = content[sectionKey];
        
        if (!section) {
            Utils.showToast('关卡内容加载失败');
            return;
        }
        
        reportContainer.innerHTML = `
            <div class="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <!-- 关卡头部 -->
                <div class="flex items-center justify-between mb-6">
                    <button onclick="LevelModule.showLevelMap()" 
                            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                        <i class="fas fa-arrow-left mr-2"></i>返回关卡地图
                    </button>
                    <div class="text-center">
                        <div class="text-4xl mb-2">${level.icon}</div>
                        <h3 class="text-xl font-bold text-gray-800">关卡 ${this.currentLevel + 1}</h3>
                    </div>
                    <div class="w-24"></div>
                </div>
                
                <!-- 关卡内容 -->
                <div class="mb-8">
                    <h2 class="text-3xl font-bold text-gray-800 mb-2">${section.title}</h2>
                    ${section.subtitle ? `<p class="text-gray-600 text-lg mb-6">${section.subtitle}</p>` : ''}
                    
                    ${LearningModule.renderSection(this.currentLevel + 1, section)}
                </div>
                
                <!-- 完成按钮 -->
                <div class="text-center">
                    <button onclick="QuizModule.startQuiz(${this.currentStock.id}, ${this.currentLevel})" 
                            class="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-bold text-lg">
                        <i class="fas fa-check-circle mr-2"></i>完成学习，开始答题
                    </button>
                </div>
            </div>
        `;
    }
};

/***********************
 * 答题模块
 ***********************/
const QuizModule = {
    currentStock: null,
    currentLevel: 0,
    quizzes: [],
    currentQuizIndex: 0,
    correctCount: 0,
    
    async startQuiz(stockId, levelIndex) {
        this.currentStock = AppState.stocks.find(s => s.id === stockId);
        this.currentLevel = levelIndex;
        this.currentQuizIndex = 0;
        this.correctCount = 0;
        
        // 加载题目
        await this.loadQuizzes(stockId);
        
        // 显示第一题
        this.showQuiz();
    },
    
    async loadQuizzes(stockId) {
        try {
            const response = await Utils.apiRequest(`/quiz/list?stock_id=${stockId}`);
            if (response && response.success) {
                this.quizzes = response.quizzes;
            }
        } catch (error) {
            console.error('加载题目失败:', error);
            Utils.showToast('加载题目失败，请重试');
        }
    },
    
    selectedMultiple: [], // 多选题已选答案
    dragItems: [], // 拖拽排序项
    
    showQuiz() {
        if (this.currentQuizIndex >= this.quizzes.length) {
            this.showQuizResult();
            return;
        }
        
        const quiz = this.quizzes[this.currentQuizIndex];
        const reportContainer = document.getElementById('reportContainer');
        
        if (!reportContainer) return;
        
        // 重置选择状态
        this.selectedMultiple = [];
        
        // 根据题目类型渲染不同的交互
        let quizContent = '';
        const quizType = quiz.type || 'single';
        
        switch (quizType) {
            case 'multiple':
                quizContent = this.renderMultipleChoice(quiz);
                break;
            case 'sort':
                quizContent = this.renderSortQuestion(quiz);
                break;
            case 'truefalse':
                quizContent = this.renderTrueFalse(quiz);
                break;
            case 'match':
                quizContent = this.renderMatchQuestion(quiz);
                break;
            default:
                quizContent = this.renderSingleChoice(quiz);
        }
        
        // 题目类型图标和标签
        const typeInfo = {
            'single': { icon: '🎯', label: '单选题' },
            'multiple': { icon: '✅', label: '多选题' },
            'sort': { icon: '📊', label: '排序题' },
            'truefalse': { icon: '⚖️', label: '判断题' },
            'match': { icon: '🔗', label: '连线题' }
        };
        const { icon: typeIcon, label: typeLabel } = typeInfo[quizType] || typeInfo['single'];
        
        reportContainer.innerHTML = `
            <div class="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto pop-in">
                <!-- 进度条 -->
                <div class="mb-6">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm text-gray-600">答题进度</span>
                        <span class="text-sm font-bold text-purple-600">${this.currentQuizIndex + 1} / ${this.quizzes.length}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                        <div class="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500" 
                             style="width: ${((this.currentQuizIndex + 1) / this.quizzes.length) * 100}%"></div>
                    </div>
                </div>
                
                <!-- 题目类型标签 -->
                <div class="flex justify-center mb-4">
                    <span class="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium">
                        ${typeIcon} ${typeLabel}
                    </span>
                </div>
                
                <!-- 题目 -->
                <div class="text-center mb-8">
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">${quiz.question}</h3>
                    ${quiz.hint ? `<p class="text-gray-500 text-sm">💡 ${quiz.hint}</p>` : ''}
                </div>
                
                <!-- 答题区域 -->
                ${quizContent}
            </div>
        `;
        
        // 初始化拖拽排序（如果是排序题）
        if (quizType === 'sort') {
            this.initSortable();
        }
    },
    
    // 渲染单选题
    renderSingleChoice(quiz) {
        return `
            <div class="space-y-3">
                ${quiz.options.map((option, index) => `
                    <button onclick="QuizModule.submitAnswer(${quiz.id}, ${index})" 
                            class="quiz-option w-full p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-transparent hover:border-purple-500 hover:shadow-md transition-all duration-300 text-left group">
                        <div class="flex items-center">
                            <span class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center font-bold mr-4 group-hover:scale-110 transition">
                                ${String.fromCharCode(65 + index)}
                            </span>
                            <span class="text-lg text-gray-800 group-hover:text-purple-700 transition">${option}</span>
                        </div>
                    </button>
                `).join('')}
            </div>
        `;
    },
    
    // 渲染多选题
    renderMultipleChoice(quiz) {
        return `
            <div class="space-y-3 mb-6" id="multiple-options">
                ${quiz.options.map((option, index) => `
                    <button onclick="QuizModule.toggleMultipleOption(${index}, this)" 
                            data-index="${index}"
                            class="quiz-option w-full p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-purple-400 transition-all duration-300 text-left group">
                        <div class="flex items-center">
                            <div class="w-8 h-8 border-2 border-gray-300 rounded-lg mr-4 flex items-center justify-center transition group-hover:border-purple-500" id="checkbox-${index}">
                                <svg class="w-5 h-5 text-white hidden" id="check-${index}" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                                </svg>
                            </div>
                            <span class="text-lg text-gray-800">${option}</span>
                        </div>
                    </button>
                `).join('')}
            </div>
            <div class="text-center">
                <p class="text-gray-500 text-sm mb-4">请选择所有正确的选项</p>
                <button onclick="QuizModule.submitMultipleAnswer(${quiz.id})" 
                        class="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-bold text-lg transform hover:scale-105">
                    确认提交
                </button>
            </div>
        `;
    },
    
    // 切换多选选项
    toggleMultipleOption(index, btn) {
        const checkbox = document.getElementById(`checkbox-${index}`);
        const check = document.getElementById(`check-${index}`);
        
        if (this.selectedMultiple.includes(index)) {
            // 取消选择
            this.selectedMultiple = this.selectedMultiple.filter(i => i !== index);
            checkbox.classList.remove('bg-purple-500', 'border-purple-500');
            checkbox.classList.add('border-gray-300');
            check.classList.add('hidden');
            btn.classList.remove('border-purple-500', 'bg-purple-50');
            btn.classList.add('border-gray-200', 'bg-white');
        } else {
            // 添加选择
            this.selectedMultiple.push(index);
            checkbox.classList.add('bg-purple-500', 'border-purple-500');
            checkbox.classList.remove('border-gray-300');
            check.classList.remove('hidden');
            btn.classList.add('border-purple-500', 'bg-purple-50');
            btn.classList.remove('border-gray-200', 'bg-white');
        }
    },
    
    // 渲染排序题
    renderSortQuestion(quiz) {
        // 打乱选项顺序
        const shuffled = [...quiz.options].map((opt, i) => ({ text: opt, originalIndex: i }));
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        this.dragItems = shuffled;
        
        return `
            <div class="mb-6">
                <p class="text-center text-gray-600 mb-4">🖐️ 拖拽下方选项，按正确顺序排列</p>
                <div id="sortable-list" class="space-y-3">
                    ${shuffled.map((item, index) => `
                        <div class="sort-item p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 cursor-move hover:shadow-lg transition-all duration-300 select-none"
                             data-index="${index}" draggable="true">
                            <div class="flex items-center">
                                <div class="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full flex items-center justify-center mr-4">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/>
                                    </svg>
                                </div>
                                <span class="text-lg text-gray-800 flex-1">${item.text}</span>
                                <div class="text-amber-400">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="text-center">
                <button onclick="QuizModule.submitSortAnswer(${quiz.id})" 
                        class="px-12 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:shadow-lg transition font-bold text-lg transform hover:scale-105">
                    确认顺序
                </button>
            </div>
        `;
    },
    
    // 初始化拖拽排序
    initSortable() {
        const list = document.getElementById('sortable-list');
        if (!list) return;
        
        let draggedItem = null;
        
        list.querySelectorAll('.sort-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                item.classList.add('opacity-50', 'scale-105');
                e.dataTransfer.effectAllowed = 'move';
            });
            
            item.addEventListener('dragend', () => {
                item.classList.remove('opacity-50', 'scale-105');
                draggedItem = null;
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });
            
            item.addEventListener('dragenter', (e) => {
                e.preventDefault();
                if (item !== draggedItem) {
                    item.classList.add('border-purple-500', 'bg-purple-50');
                }
            });
            
            item.addEventListener('dragleave', () => {
                item.classList.remove('border-purple-500', 'bg-purple-50');
            });
            
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('border-purple-500', 'bg-purple-50');
                
                if (item !== draggedItem && draggedItem) {
                    const allItems = [...list.querySelectorAll('.sort-item')];
                    const draggedIdx = allItems.indexOf(draggedItem);
                    const targetIdx = allItems.indexOf(item);
                    
                    if (draggedIdx < targetIdx) {
                        item.after(draggedItem);
                    } else {
                        item.before(draggedItem);
                    }
                    
                    // 更新顺序记录
                    this.updateDragOrder();
                }
            });
        });
    },
    
    // 更新拖拽顺序
    updateDragOrder() {
        const list = document.getElementById('sortable-list');
        const items = list.querySelectorAll('.sort-item');
        const newOrder = [];
        items.forEach((item, idx) => {
            const originalIdx = parseInt(item.dataset.index);
            newOrder.push(this.dragItems[originalIdx]);
            item.dataset.index = idx;
        });
        this.dragItems = newOrder;
    },
    
    // 渲染判断题
    renderTrueFalse(quiz) {
        return `
            <div class="grid grid-cols-2 gap-6">
                <button onclick="QuizModule.submitAnswer(${quiz.id}, 0)" 
                        class="p-8 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border-3 border-transparent hover:border-green-500 hover:shadow-xl transition-all duration-300 group">
                    <div class="text-center">
                        <div class="text-6xl mb-4 group-hover:scale-125 transition">✅</div>
                        <span class="text-2xl font-bold text-green-700">正确</span>
                    </div>
                </button>
                <button onclick="QuizModule.submitAnswer(${quiz.id}, 1)" 
                        class="p-8 bg-gradient-to-br from-red-50 to-rose-100 rounded-2xl border-3 border-transparent hover:border-red-500 hover:shadow-xl transition-all duration-300 group">
                    <div class="text-center">
                        <div class="text-6xl mb-4 group-hover:scale-125 transition">❌</div>
                        <span class="text-2xl font-bold text-red-700">错误</span>
                    </div>
                </button>
            </div>
        `;
    },
    
    // 渲染连线题（简化版：选择匹配项）
    renderMatchQuestion(quiz) {
        return `
            <div class="grid grid-cols-2 gap-6 mb-6">
                <!-- 左侧：题目项 -->
                <div class="space-y-3">
                    <p class="text-center text-gray-600 font-medium mb-2">概念</p>
                    ${quiz.leftItems.map((item, index) => `
                        <div class="p-4 bg-purple-100 rounded-xl text-center font-medium text-purple-800" id="left-${index}">
                            ${item}
                        </div>
                    `).join('')}
                </div>
                <!-- 右侧：匹配项（可点击） -->
                <div class="space-y-3">
                    <p class="text-center text-gray-600 font-medium mb-2">释义</p>
                    ${quiz.rightItems.map((item, index) => `
                        <button onclick="QuizModule.selectMatchItem(${index}, this)"
                                class="match-option w-full p-4 bg-pink-50 rounded-xl text-center font-medium text-pink-800 border-2 border-transparent hover:border-pink-500 transition"
                                data-index="${index}">
                            ${item}
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="text-center">
                <p class="text-gray-500 text-sm mb-4">点击右侧选项，选择与左侧第一项匹配的答案</p>
            </div>
        `;
    },
    
    // 选择连线匹配项
    selectMatchItem(index, btn) {
        const quiz = this.quizzes[this.currentQuizIndex];
        this.submitAnswer(quiz.id, index);
    },
    
    async submitAnswer(quizId, answer) {
        const quiz = this.quizzes[this.currentQuizIndex];
        const isCorrect = answer === quiz.correct;
        
        if (isCorrect) {
            this.correctCount++;
        }
        
        const correctAnswer = quiz.options ? quiz.options[quiz.correct] : (quiz.correct === 0 ? '正确' : '错误');
        this.showAnswerFeedback(isCorrect, quiz.explanation, correctAnswer);
    },
    
    // 提交多选题答案
    submitMultipleAnswer(quizId) {
        if (this.selectedMultiple.length === 0) {
            Utils.showToast('请至少选择一个选项');
            return;
        }
        
        const quiz = this.quizzes[this.currentQuizIndex];
        const correctAnswers = quiz.correct; // 数组
        
        // 检查是否完全匹配
        const sortedSelected = [...this.selectedMultiple].sort();
        const sortedCorrect = [...correctAnswers].sort();
        const isCorrect = sortedSelected.length === sortedCorrect.length && 
                          sortedSelected.every((val, idx) => val === sortedCorrect[idx]);
        
        if (isCorrect) {
            this.correctCount++;
        }
        
        const correctAnswer = correctAnswers.map(i => quiz.options[i]).join('、');
        this.showAnswerFeedback(isCorrect, quiz.explanation, correctAnswer);
    },
    
    // 提交排序题答案
    submitSortAnswer(quizId) {
        const quiz = this.quizzes[this.currentQuizIndex];
        
        // 获取当前顺序
        const list = document.getElementById('sortable-list');
        const items = list.querySelectorAll('.sort-item');
        const currentOrder = [];
        items.forEach(item => {
            const text = item.querySelector('span').textContent.trim();
            const originalIndex = quiz.options.indexOf(text);
            currentOrder.push(originalIndex);
        });
        
        // 正确顺序是 [0, 1, 2, 3...]
        const correctOrder = quiz.options.map((_, i) => i);
        const isCorrect = currentOrder.every((val, idx) => val === correctOrder[idx]);
        
        if (isCorrect) {
            this.correctCount++;
        }
        
        const correctAnswer = quiz.options.join(' → ');
        this.showAnswerFeedback(isCorrect, quiz.explanation, '正确顺序：' + correctAnswer);
    },
    
    showAnswerFeedback(isCorrect, explanation, correctAnswer) {
        const reportContainer = document.getElementById('reportContainer');
        if (!reportContainer) return;
        
        // 计算本题获得的积分
        const pointsEarned = isCorrect 
            ? AppState.pointsConfig.correctAnswer 
            : AppState.pointsConfig.wrongAnswer;
        
        // 更新积分
        AppState.points += pointsEarned;
        AppState.todayPoints += pointsEarned;
        
        // 触发动画效果 - 答对庆祝，答错也给予正向鼓励
        if (isCorrect) {
            this.triggerCelebration();
        } else {
            this.triggerEncouragement();
        }
        
        const bgColor = isCorrect ? 'from-green-500 to-emerald-500' : 'from-blue-500 to-indigo-500';
        const icon = isCorrect ? '🎉' : '💡';
        const title = isCorrect ? '回答正确！' : '学到新知识！';
        const encouragement = isCorrect 
            ? ['干得漂亮！', '你离巴菲特又近了一步', '完美！', '太棒了！', '🔥 学霸就是你！', '✨ 闪闪发光！'][Math.floor(Math.random() * 6)]
            : ['记住这个知识点！', '学习就是这样积累的', '每一次错误都是进步', '这题下次肯定会！', '积少成多，越来越强！', '又掌握了一个考点！'][Math.floor(Math.random() * 6)];
        
        const feedbackId = isCorrect ? 'success-feedback' : 'learn-feedback';
        const animationClass = 'pop-in';
        
        reportContainer.innerHTML = `
            <div id="${feedbackId}" class="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto ${animationClass}">
                <div class="text-center mb-6 relative">
                    ${isCorrect ? '<div class="rainbow-ring"></div>' : ''}
                    <div class="w-28 h-28 mx-auto mb-4 rounded-full bg-gradient-to-r ${bgColor} flex items-center justify-center text-5xl pop-in relative z-10">
                        ${icon}
                    </div>
                    <h2 class="text-3xl font-bold text-gray-800 mb-2">${title}</h2>
                    <p class="text-xl text-gray-600">${encouragement}</p>
                </div>
                
                <!-- 积分显示 -->
                <div class="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 mb-6 border border-amber-200">
                    <div class="flex items-center justify-center">
                        <span class="text-3xl mr-2">🪙</span>
                        <span class="text-2xl font-bold text-amber-600">+${pointsEarned}</span>
                        <span class="text-gray-600 ml-2">积分</span>
                    </div>
                    <p class="text-center text-gray-500 text-sm mt-1">当前累计：${AppState.points} 积分</p>
                </div>
                
                ${!isCorrect ? `
                    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 mb-5 border-l-4 border-blue-400">
                        <h4 class="font-bold text-blue-700 mb-2">📝 正确答案：</h4>
                        <p class="text-gray-700 text-lg font-medium">${correctAnswer}</p>
                    </div>
                ` : ''}
                
                <div class="bg-purple-50 rounded-xl p-5 mb-6 border-l-4 border-purple-500">
                    <h4 class="font-bold text-gray-800 mb-2">💡 解析：</h4>
                    <p class="text-gray-700 leading-relaxed">${explanation}</p>
                </div>
                
                <button onclick="QuizModule.nextQuiz()" 
                        class="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-bold text-lg transform hover:scale-105">
                    ${this.currentQuizIndex + 1 < this.quizzes.length ? '下一题 →' : '🏆 查看结果'}
                </button>
            </div>
        `;
    },
    
    // 🎉 庆祝动画：彩带 + 烟花 + 星星
    triggerCelebration() {
        // 创建彩带
        this.createConfetti();
        // 创建烟花
        this.createFireworks();
        // 播放音效（可选）
        this.playSound('success');
    },
    
    // 创建彩带效果
    createConfetti() {
        const container = document.createElement('div');
        container.className = 'confetti-container';
        container.id = 'confetti-container';
        document.body.appendChild(container);
        
        const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#8b00ff', '#ff69b4', '#ffd700'];
        const shapes = ['square', 'rectangle', 'circle'];
        
        // 创建100个彩带
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            
            // 随机形状
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            if (shape === 'circle') {
                confetti.style.borderRadius = '50%';
                confetti.style.width = '10px';
                confetti.style.height = '10px';
            } else if (shape === 'rectangle') {
                confetti.style.width = '8px';
                confetti.style.height = '16px';
            }
            
            container.appendChild(confetti);
        }
        
        // 3秒后移除彩带容器
        setTimeout(() => {
            container.remove();
        }, 5000);
    },
    
    // 创建烟花效果
    createFireworks() {
        const colors = ['#ff0000', '#ffd700', '#00ff00', '#00ffff', '#ff00ff', '#ff69b4'];
        
        // 创建3个烟花
        for (let f = 0; f < 3; f++) {
            setTimeout(() => {
                const firework = document.createElement('div');
                firework.className = 'firework';
                firework.style.left = (20 + Math.random() * 60) + '%';
                firework.style.top = (20 + Math.random() * 40) + '%';
                document.body.appendChild(firework);
                
                // 每个烟花有20个粒子
                for (let i = 0; i < 20; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'firework-particle';
                    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                    
                    const angle = (i / 20) * Math.PI * 2;
                    const distance = 50 + Math.random() * 50;
                    particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
                    particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
                    
                    firework.appendChild(particle);
                }
                
                // 1秒后移除烟花
                setTimeout(() => firework.remove(), 1000);
            }, f * 300);
        }
    },
    
    // 💡 正向鼓励效果：温和的动画提示学习
    triggerEncouragement() {
        // 创建学习提示气泡
        const bubble = document.createElement('div');
        bubble.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 80px;
            z-index: 9999;
            pointer-events: none;
            animation: encourageBubble 1.5s ease-out forwards;
        `;
        bubble.textContent = '💡';
        document.body.appendChild(bubble);
        
        // 添加一些小星星飘落
        const colors = ['#60a5fa', '#818cf8', '#a78bfa', '#c4b5fd'];
        for (let i = 0; i < 15; i++) {
            const star = document.createElement('div');
            star.style.cssText = `
                position: fixed;
                left: ${30 + Math.random() * 40}%;
                top: ${20 + Math.random() * 30}%;
                font-size: ${16 + Math.random() * 16}px;
                z-index: 9998;
                pointer-events: none;
                opacity: 0;
                animation: starFloat 2s ease-out ${i * 0.1}s forwards;
            `;
            star.textContent = ['✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 4)];
            document.body.appendChild(star);
            
            setTimeout(() => star.remove(), 2500);
        }
        
        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes encourageBubble {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                30% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
                60% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                100% { transform: translate(-50%, -100%) scale(0.8); opacity: 0; }
            }
            @keyframes starFloat {
                0% { opacity: 0; transform: translateY(0) scale(0); }
                30% { opacity: 1; transform: translateY(-20px) scale(1); }
                100% { opacity: 0; transform: translateY(-60px) scale(0.5); }
            }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => {
            bubble.remove();
            style.remove();
        }, 2000);
        
        // 播放柔和的提示音
        this.playSound('learn');
    },
    
    // 播放音效（使用 Web Audio API 生成简单音效）
    playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            if (type === 'success') {
                // 成功音效：欢快上升的音调
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
                oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
                oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);
            } else if (type === 'learn') {
                // 学习提示音效：柔和的叮咚声
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.15);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            } else {
                // 默认提示音
                oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
            }
        } catch (e) {
            // 音效播放失败，静默处理
            console.log('Audio not supported');
        }
    },
    
    nextQuiz() {
        this.currentQuizIndex++;
        this.showQuiz();
    },
    
    async showQuizResult() {
        const percentage = Math.round((this.correctCount / this.quizzes.length) * 100);
        const isPerfect = this.correctCount === this.quizzes.length;
        const isGood = percentage >= 60;
        
        // 检查是否有下一关
        const currentLevelIndex = LevelModule.currentLevel;
        const hasNextLevel = currentLevelIndex < LevelModule.levels.length - 1;
        const nextLevel = hasNextLevel ? LevelModule.levels[currentLevelIndex + 1] : null;
        const isAllLevelsComplete = !hasNextLevel; // 是否完成所有5个关卡
        
        // 计算本关卡获得的积分
        let levelPoints = AppState.pointsConfig.completeLevel; // 完成关卡基础分
        let bonusPoints = 0;
        let pointsBreakdown = [
            { label: '完成关卡', points: AppState.pointsConfig.completeLevel }
        ];
        
        if (isPerfect) {
            bonusPoints = AppState.pointsConfig.perfectScore;
            pointsBreakdown.push({ label: '全对奖励', points: bonusPoints });
        }
        
        // 点亮图鉴奖励
        let stockPoints = 0;
        if (isAllLevelsComplete) {
            stockPoints = AppState.pointsConfig.completeStock;
            pointsBreakdown.push({ label: '点亮图鉴', points: stockPoints });
        }
        
        const totalLevelPoints = levelPoints + bonusPoints + stockPoints;
        AppState.points += totalLevelPoints;
        AppState.todayPoints += totalLevelPoints;
        
        // 根据成绩触发不同的动画效果
        if (isPerfect) {
            this.triggerCelebration();
            setTimeout(() => this.triggerCelebration(), 500);
            setTimeout(() => this.createConfetti(), 1000);
        } else if (isGood) {
            this.triggerCelebration();
        }
        
        // 只有完成所有5个关卡才点亮图鉴
        let response = null;
        if (isAllLevelsComplete) {
            try {
                response = await Utils.apiRequest('/collection/complete', {
                    method: 'POST',
                    body: JSON.stringify({
                        user_id: AppState.userId,
                        stock_id: this.currentStock.id
                    })
                });
                
                // 🗺️ 更新学习地图 - 完成这只股票（带星级）
                // 计算星级：100% = 3星, 80%+ = 2星, 60%+ = 1星, <60% = 0星
                const stars = percentage >= 100 ? 3 : (percentage >= 80 ? 2 : (percentage >= 60 ? 1 : 0));
                if (this.currentStock && this.currentStock.name) {
                    await LearningMapModule.completeStock(this.currentStock.name, stars);
                }
                
                // 保存星级用于显示
                this.earnedStars = stars;
                
                this.triggerCelebration();
                setTimeout(() => this.triggerCelebration(), 300);
                setTimeout(() => this.createConfetti(), 200);
            } catch (error) {
                console.error('点亮图鉴失败:', error);
            }
        } else {
            // 完成单个关卡时更新学习地图进度
            if (this.currentStock && this.currentStock.name) {
                await LearningMapModule.updateProgress(this.currentStock.name, currentLevelIndex + 1);
            }
        }
        
        try {
            const reportContainer = document.getElementById('reportContainer');
            if (!reportContainer) return;
            
            // 根据成绩显示不同的评价
            let gradeEmoji, gradeText, gradeColor;
            if (isPerfect) {
                gradeEmoji = '🏆';
                gradeText = '完美通关！';
                gradeColor = 'from-yellow-400 to-orange-500';
            } else if (percentage >= 80) {
                gradeEmoji = '🌟';
                gradeText = '优秀！';
                gradeColor = 'from-green-400 to-emerald-500';
            } else if (percentage >= 60) {
                gradeEmoji = '🎯';
                gradeText = '通关成功！';
                gradeColor = 'from-blue-400 to-indigo-500';
            } else {
                gradeEmoji = '💪';
                gradeText = '继续努力！';
                gradeColor = 'from-gray-400 to-gray-500';
            }
            
            // 积分展示区
            const pointsSection = `
                <div class="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-5 mb-6 border border-amber-200">
                    <h4 class="text-lg font-bold text-amber-800 mb-3 flex items-center justify-center">
                        <span class="text-2xl mr-2">🪙</span> 本关获得积分
                    </h4>
                    <div class="space-y-2 mb-3">
                        ${pointsBreakdown.map(item => `
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-600">${item.label}</span>
                                <span class="font-bold text-amber-600">+${item.points}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="border-t border-amber-200 pt-3 flex justify-between items-center">
                        <span class="font-bold text-gray-800">本关合计</span>
                        <span class="text-2xl font-bold text-amber-600">+${totalLevelPoints}</span>
                    </div>
                    <div class="mt-3 pt-3 border-t border-amber-200 text-center">
                        <p class="text-gray-500 text-sm">累计积分</p>
                        <p class="text-3xl font-bold text-amber-700">${AppState.points}</p>
                    </div>
                </div>
            `;
            
            // 订阅引导区
            const subscribeSection = !AppState.isSubscribed ? `
                <div class="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-5 mb-6 text-white">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <h4 class="font-bold text-lg mb-1">🔔 订阅每日投资课堂</h4>
                            <p class="text-purple-100 text-sm">每天推送一只股票分析，持续进步</p>
                            <p class="text-yellow-300 text-sm mt-1">🎁 订阅即送 ${AppState.pointsConfig.subscribe} 积分！</p>
                        </div>
                        <button onclick="QuizModule.showSubscribeModal()" 
                                class="px-5 py-3 bg-white text-purple-600 rounded-lg font-bold hover:bg-purple-50 transition transform hover:scale-105">
                            立即订阅
                        </button>
                    </div>
                </div>
            ` : `
                <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-200">
                    <div class="flex items-center justify-center text-green-700">
                        <span class="text-xl mr-2">✅</span>
                        <span class="font-medium">已订阅每日投资课堂</span>
                    </div>
                </div>
            `;
            
            // 积分兑换提示
            const redeemHint = `
                <div class="bg-gray-50 rounded-xl p-4 mb-6 text-center">
                    <p class="text-gray-600 text-sm">
                        💡 积分可兑换：<span class="text-purple-600 font-medium">专属报告</span> · 
                        <span class="text-purple-600 font-medium">VIP课程</span> · 
                        <span class="text-purple-600 font-medium">实战训练营</span>
                    </p>
                    <button onclick="QuizModule.showRedeemModal()" 
                            class="mt-2 text-purple-600 text-sm font-medium hover:text-purple-800 transition">
                        查看积分商城 →
                    </button>
                </div>
            `;
            
            // 生成操作按钮
            let actionButtons = '';
            if (hasNextLevel) {
                actionButtons = `
                    <div class="mb-4">
                        <button onclick="QuizModule.goToNextLevel()" 
                                class="w-full px-8 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-bold text-xl transform hover:scale-105 animate-pulse">
                            ▶️ 进入下一关：${nextLevel.title}
                        </button>
                    </div>
                    <div class="grid grid-cols-3 gap-3">
                        <button onclick="LevelModule.showLevelMap()" 
                                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">
                            📋 关卡地图
                        </button>
                        <button onclick="LearningMapModule.show()" 
                                class="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-lg hover:from-green-200 hover:to-emerald-200 transition text-sm font-medium">
                            🗺️ 学习地图
                        </button>
                        <button onclick="CollectionModule.showCollection()" 
                                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">
                            🏆 查看图鉴
                        </button>
                    </div>
                `;
            } else {
                actionButtons = `
                    <div class="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-5 mb-4 border-2 border-yellow-400 pop-in">
                        <div class="text-4xl mb-2">🌟</div>
                        <p class="text-xl font-bold text-amber-700">恭喜点亮图鉴！</p>
                        <p class="text-gray-600 mt-1">${this.currentStock.name} 已加入收藏</p>
                    </div>
                    ${response && response.new_badges && response.new_badges.length > 0 ? `
                        <div class="bg-purple-50 rounded-xl p-4 mb-4 border border-purple-200">
                            <h3 class="text-lg font-bold text-gray-800 mb-3">🎖️ 获得新勋章</h3>
                            <div class="flex justify-center gap-3 flex-wrap">
                                ${response.new_badges.map((badge, i) => `
                                    <div class="bg-white rounded-lg p-3 shadow text-center">
                                        <div class="text-3xl mb-1">${badge.icon}</div>
                                        <p class="font-bold text-gray-800 text-sm">${badge.name}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <div class="mb-4">
                        <button onclick="LearningMapModule.show()" 
                                class="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition font-bold transform hover:scale-105">
                            🗺️ 查看学习地图 - 继续下一只股票
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="SwipeModule.init()" 
                                class="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-bold transform hover:scale-105">
                            🔄 学习新股票
                        </button>
                        <button onclick="CollectionModule.showCollection()" 
                                class="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:shadow-lg transition font-bold transform hover:scale-105">
                            🏆 查看图鉴
                        </button>
                    </div>
                `;
            }
            
            reportContainer.innerHTML = `
                <div class="bg-white rounded-2xl shadow-xl p-6 max-w-3xl mx-auto pop-in">
                    <div class="text-center mb-6 relative">
                        ${isPerfect ? '<div class="rainbow-ring" style="width: 160px; height: 160px;"></div>' : ''}
                        <div class="text-6xl mb-4 ${isPerfect ? 'pop-in' : ''} relative z-10">${gradeEmoji}</div>
                        <h2 class="text-3xl font-bold text-gray-800 mb-2">${gradeText}</h2>
                        <p class="text-gray-600 mb-1">关卡 ${currentLevelIndex + 1} / ${LevelModule.levels.length}</p>
                        <p class="text-xl text-purple-600 font-bold mb-4">${this.currentStock.name}</p>
                        
                        <!-- 成绩 -->
                        <div class="bg-gradient-to-r ${gradeColor} rounded-xl p-4 mb-4 text-white shadow-lg inline-block min-w-48">
                            <div class="text-4xl font-bold mb-1">${percentage}%</div>
                            <p class="opacity-90">${this.correctCount} / ${this.quizzes.length} 正确</p>
                            ${isPerfect ? '<p class="mt-1">🎉 全对！</p>' : ''}
                        </div>
                    </div>
                    
                    <!-- 积分展示 -->
                    ${pointsSection}
                    
                    <!-- 订阅引导 -->
                    ${subscribeSection}
                    
                    <!-- 积分兑换提示 -->
                    ${redeemHint}
                    
                    <!-- 操作按钮 -->
                    ${actionButtons}
                </div>
            `;
        } catch (error) {
            console.error('完成学习失败:', error);
        }
    },
    
    // 进入下一关卡
    goToNextLevel() {
        const nextLevelIndex = LevelModule.currentLevel + 1;
        if (nextLevelIndex < LevelModule.levels.length) {
            LevelModule.enterLevel(nextLevelIndex);
        }
    },
    
    // 显示订阅弹窗
    showSubscribeModal() {
        const modal = document.createElement('div');
        modal.id = 'subscribe-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pop-in';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-md mx-4 relative">
                <button onclick="QuizModule.closeModal('subscribe-modal')" 
                        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
                
                <div class="text-center mb-6">
                    <div class="text-6xl mb-4">📬</div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">订阅每日投资课堂</h3>
                    <p class="text-gray-600">每天一只股票深度解析，持续提升投资认知</p>
                </div>
                
                <div class="space-y-3 mb-6">
                    <div class="flex items-center p-3 bg-purple-50 rounded-lg">
                        <span class="text-xl mr-3">📊</span>
                        <span class="text-gray-700">每日精选股票分析</span>
                    </div>
                    <div class="flex items-center p-3 bg-purple-50 rounded-lg">
                        <span class="text-xl mr-3">💡</span>
                        <span class="text-gray-700">独家投资观点解读</span>
                    </div>
                    <div class="flex items-center p-3 bg-purple-50 rounded-lg">
                        <span class="text-xl mr-3">🎯</span>
                        <span class="text-gray-700">实战案例教学</span>
                    </div>
                </div>
                
                <div class="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4 mb-6 text-center border border-amber-200">
                    <p class="text-amber-700 font-bold">🎁 订阅即送 ${AppState.pointsConfig.subscribe} 积分</p>
                </div>
                
                <div class="space-y-3">
                    <input type="email" id="subscribe-email" placeholder="请输入邮箱地址" 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
                    <button onclick="QuizModule.confirmSubscribe()" 
                            class="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-lg hover:shadow-lg transition transform hover:scale-105">
                        立即订阅
                    </button>
                </div>
                
                <p class="text-center text-gray-400 text-xs mt-4">我们尊重您的隐私，不会发送垃圾邮件</p>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    // 确认订阅
    confirmSubscribe() {
        const email = document.getElementById('subscribe-email').value;
        if (!email || !email.includes('@')) {
            Utils.showToast('请输入有效的邮箱地址');
            return;
        }
        
        // 模拟订阅成功
        AppState.isSubscribed = true;
        AppState.points += AppState.pointsConfig.subscribe;
        AppState.todayPoints += AppState.pointsConfig.subscribe;
        
        // 关闭弹窗并显示成功
        this.closeModal('subscribe-modal');
        this.triggerCelebration();
        Utils.showToast(`🎉 订阅成功！获得 ${AppState.pointsConfig.subscribe} 积分`);
    },
    
    // 显示积分商城弹窗
    showRedeemModal() {
        const modal = document.createElement('div');
        modal.id = 'redeem-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pop-in';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-lg mx-4 relative max-h-[80vh] overflow-y-auto">
                <button onclick="QuizModule.closeModal('redeem-modal')" 
                        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
                
                <div class="text-center mb-6">
                    <div class="text-5xl mb-3">🏪</div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">积分商城</h3>
                    <div class="inline-flex items-center bg-amber-100 px-4 py-2 rounded-full">
                        <span class="text-xl mr-2">🪙</span>
                        <span class="text-lg font-bold text-amber-700">${AppState.points} 积分</span>
                    </div>
                </div>
                
                <div class="space-y-4">
                    <!-- 兑换项目 -->
                    <div class="border border-gray-200 rounded-xl p-4 hover:border-purple-400 transition cursor-pointer">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl mr-4">📑</div>
                                <div>
                                    <h4 class="font-bold text-gray-800">专属股票分析报告</h4>
                                    <p class="text-sm text-gray-500">深度解析一只你感兴趣的股票</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="font-bold text-amber-600">500 积分</p>
                                <button class="text-purple-600 text-sm font-medium ${AppState.points >= 500 ? 'hover:text-purple-800' : 'opacity-50 cursor-not-allowed'}">
                                    ${AppState.points >= 500 ? '兑换' : '积分不足'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="border border-gray-200 rounded-xl p-4 hover:border-purple-400 transition cursor-pointer">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl mr-4">🎓</div>
                                <div>
                                    <h4 class="font-bold text-gray-800">VIP投资课程</h4>
                                    <p class="text-sm text-gray-500">系统学习价值投资方法论</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="font-bold text-amber-600">1000 积分</p>
                                <button class="text-purple-600 text-sm font-medium ${AppState.points >= 1000 ? 'hover:text-purple-800' : 'opacity-50 cursor-not-allowed'}">
                                    ${AppState.points >= 1000 ? '兑换' : '积分不足'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="border border-gray-200 rounded-xl p-4 hover:border-purple-400 transition cursor-pointer">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl mr-4">💼</div>
                                <div>
                                    <h4 class="font-bold text-gray-800">实战训练营名额</h4>
                                    <p class="text-sm text-gray-500">限量！跟导师一起实盘分析</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="font-bold text-amber-600">2000 积分</p>
                                <button class="text-purple-600 text-sm font-medium ${AppState.points >= 2000 ? 'hover:text-purple-800' : 'opacity-50 cursor-not-allowed'}">
                                    ${AppState.points >= 2000 ? '兑换' : '积分不足'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="border border-gray-200 rounded-xl p-4 hover:border-purple-400 transition cursor-pointer">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-2xl mr-4">☕</div>
                                <div>
                                    <h4 class="font-bold text-gray-800">请作者喝杯咖啡</h4>
                                    <p class="text-sm text-gray-500">感谢支持，继续创作更好内容</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="font-bold text-amber-600">100 积分</p>
                                <button class="text-purple-600 text-sm font-medium ${AppState.points >= 100 ? 'hover:text-purple-800' : 'opacity-50 cursor-not-allowed'}">
                                    ${AppState.points >= 100 ? '兑换' : '积分不足'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-6 pt-4 border-t border-gray-200 text-center">
                    <p class="text-gray-500 text-sm">💡 继续学习赚取更多积分吧！</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    // 关闭弹窗
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    }
};

/***********************
 * 集卡模块
 ***********************/
const CollectionModule = {
    async showCollection() {
        Utils.showPage('report-page');
        
        try {
            const response = await Utils.apiRequest(`/collection/status?user_id=${AppState.userId}`);
            
            if (!response || !response.success) {
                Utils.showToast(response?.message || '加载图鉴失败，请重试');
                console.error('Collection API response:', response);
                return;
            }
            
            // 检查必要的数据是否存在
            if (!response.sectors || !Array.isArray(response.sectors)) {
                Utils.showToast('图鉴数据格式错误');
                console.error('Invalid sectors data:', response);
                return;
            }
            
            const reportContainer = document.getElementById('reportContainer');
            if (!reportContainer) return;
            
            reportContainer.innerHTML = `
                <div class="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    <div class="text-center mb-8">
                        <div class="text-6xl mb-4">📚</div>
                        <h2 class="text-3xl font-bold text-gray-800 mb-2">我的股票图鉴</h2>
                        <p class="text-gray-600 text-lg">已收集 ${response.total_completed || 0} / ${response.total_stocks || 0} 只股票</p>
                        
                        <!-- 总进度条 -->
                        <div class="max-w-md mx-auto mt-6">
                            <div class="w-full bg-gray-200 rounded-full h-4">
                                <div class="bg-gradient-to-r from-purple-600 to-pink-600 h-4 rounded-full transition-all duration-500" 
                                     style="width: ${response.total_stocks > 0 ? (response.total_completed / response.total_stocks) * 100 : 0}%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 按板块分组 -->
                    ${response.sectors.map(sector => `
                        <div class="mb-8">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-2xl font-bold text-gray-800">${sector.name || '未知板块'}</h3>
                                <span class="text-purple-600 font-bold">${sector.completed || 0} / ${sector.total || 0}</span>
                            </div>
                            
                            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                ${(sector.stocks || []).map(stock => `
                                    <div class="relative group">
                                        <div class="bg-gradient-to-br ${stock.completed ? 'from-purple-50 to-pink-50' : 'from-gray-100 to-gray-200'} 
                                                    rounded-xl p-4 border-2 ${stock.completed ? 'border-purple-300' : 'border-gray-300'} 
                                                    transition-all duration-300 hover:shadow-lg ${stock.completed ? 'hover:scale-105' : ''}">
                                            <div class="text-center">
                                                <div class="text-4xl mb-2">${stock.completed ? '✅' : '🔒'}</div>
                                                <h4 class="font-bold text-gray-800 mb-1 ${stock.completed ? '' : 'opacity-50'}">${stock.name || '未知'}</h4>
                                                <p class="text-sm text-gray-600 ${stock.completed ? '' : 'opacity-50'}">${stock.code || ''}</p>
                                            </div>
                                        </div>
                                        
                                        ${!stock.completed ? `
                                            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onclick='LevelModule.startLevelLearning(${JSON.stringify(stock).replace(/'/g, "\\'")})'
                                                        class="px-4 py-2 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition">
                                                    开始学习
                                                </button>
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                    
                    <!-- 底部按钮 -->
                    <div class="mt-8 flex gap-4">
                        <button onclick="ReportModule.generateReport()" 
                                class="flex-1 px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-bold text-lg">
                            <i class="fas fa-arrow-left mr-2"></i>返回画像
                        </button>
                        <button onclick="BadgeModule.showBadges()" 
                                class="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-bold text-lg">
                            <i class="fas fa-medal mr-2"></i>查看勋章
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('加载图鉴失败:', error);
            Utils.showToast('加载图鉴失败: ' + (error.message || '未知错误'));
        }
    }
};

/***********************
 * 勋章模块
 ***********************/
const BadgeModule = {
    async showBadges() {
        Utils.showPage('report-page');
        
        try {
            const response = await Utils.apiRequest(`/badges/list?user_id=${AppState.userId}`);
            
            if (!response || !response.success) {
                Utils.showToast(response?.message || '加载勋章失败，请重试');
                console.error('Badges API response:', response);
                return;
            }
            
            // 检查必要的数据是否存在
            if (!response.badges || !Array.isArray(response.badges)) {
                Utils.showToast('勋章数据格式错误');
                console.error('Invalid badges data:', response);
                return;
            }
            
            const reportContainer = document.getElementById('reportContainer');
            if (!reportContainer) return;
            
            const achievementBadges = response.badges.filter(b => b.category === 'achievement');
            const sectorBadges = response.badges.filter(b => b.category === 'sector');
            const unlockedCount = response.badges.filter(b => b.unlocked).length;
            
            reportContainer.innerHTML = `
                <div class="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    <div class="text-center mb-8">
                        <div class="text-6xl mb-4">🏅</div>
                        <h2 class="text-3xl font-bold text-gray-800 mb-2">我的勋章墙</h2>
                        <p class="text-gray-600 text-lg">已解锁 ${unlockedCount} / ${response.badges.length} 个勋章</p>
                    </div>
                    
                    <!-- 成就勋章 -->
                    <div class="mb-8">
                        <h3 class="text-2xl font-bold text-gray-800 mb-4">🎯 成就勋章</h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
                            ${achievementBadges.map(badge => `
                                <div class="bg-gradient-to-br ${badge.unlocked ? 'from-yellow-50 to-orange-50' : 'from-gray-100 to-gray-200'} 
                                            rounded-xl p-6 border-2 ${badge.unlocked ? 'border-yellow-300' : 'border-gray-300'} 
                                            text-center transition-all duration-300 ${badge.unlocked ? 'hover:scale-105 hover:shadow-xl' : ''}">
                                    <div class="text-6xl mb-3 ${badge.unlocked ? '' : 'grayscale opacity-50'}">${badge.icon || '🏆'}</div>
                                    <h4 class="font-bold text-gray-800 mb-2 ${badge.unlocked ? '' : 'opacity-50'}">${badge.name || '未知勋章'}</h4>
                                    <p class="text-sm text-gray-600 ${badge.unlocked ? '' : 'opacity-50'}">${badge.desc || ''}</p>
                                    ${badge.unlocked ? `
                                        <div class="mt-3 inline-block px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold">
                                            已解锁
                                        </div>
                                    ` : `
                                        <div class="mt-3 inline-block px-3 py-1 bg-gray-400 text-white rounded-full text-xs font-bold">
                                            未解锁
                                        </div>
                                    `}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- 板块勋章 -->
                    <div class="mb-8">
                        <h3 class="text-2xl font-bold text-gray-800 mb-4">📊 板块勋章</h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
                            ${sectorBadges.map(badge => `
                                <div class="bg-gradient-to-br ${badge.unlocked ? 'from-purple-50 to-pink-50' : 'from-gray-100 to-gray-200'} 
                                            rounded-xl p-6 border-2 ${badge.unlocked ? 'border-purple-300' : 'border-gray-300'} 
                                            text-center transition-all duration-300 ${badge.unlocked ? 'hover:scale-105 hover:shadow-xl' : ''}">
                                    <div class="text-6xl mb-3 ${badge.unlocked ? '' : 'grayscale opacity-50'}">${badge.icon || '🏆'}</div>
                                    <h4 class="font-bold text-gray-800 mb-2 ${badge.unlocked ? '' : 'opacity-50'}">${badge.name || '未知勋章'}</h4>
                                    <p class="text-sm text-gray-600 mb-2 ${badge.unlocked ? '' : 'opacity-50'}">${badge.desc || ''}</p>
                                    ${badge.progress ? `
                                        <div class="mt-2">
                                            <div class="text-xs text-gray-600 mb-1">进度: ${badge.progress}</div>
                                            <div class="w-full bg-gray-200 rounded-full h-2">
                                                <div class="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full" 
                                                     style="width: ${(parseInt(badge.progress.split('/')[0]) / parseInt(badge.progress.split('/')[1])) * 100}%"></div>
                                            </div>
                                        </div>
                                    ` : ''}
                                    ${badge.unlocked ? `
                                        <div class="mt-3 inline-block px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold">
                                            已解锁
                                        </div>
                                    ` : `
                                        <div class="mt-3 inline-block px-3 py-1 bg-gray-400 text-white rounded-full text-xs font-bold">
                                            未解锁
                                        </div>
                                    `}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- 底部按钮 -->
                    <div class="mt-8 flex gap-4">
                        <button onclick="CollectionModule.showCollection()" 
                                class="flex-1 px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-bold text-lg">
                            <i class="fas fa-arrow-left mr-2"></i>返回图鉴
                        </button>
                        <button onclick="ReportModule.generateReport()" 
                                class="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-bold text-lg">
                            <i class="fas fa-chart-line mr-2"></i>查看画像
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('加载勋章失败:', error);
            Utils.showToast('加载勋章失败: ' + (error.message || '未知错误'));
        }
    }
};

/***********************
 * 游戏中心模块
 ***********************/
const GameCenter = {
    show() {
        Utils.showPage('game-center-page');
        this.render();
    },

    render() {
        const container = document.getElementById('gameCenterContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-gray-800 mb-4">
                    <span class="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        🎮 游戏中心
                    </span>
                </h1>
                <p class="text-gray-600 text-lg">边学边玩，收获满满！</p>
            </div>

            <!-- 用户状态栏 -->
            <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mb-6 text-white">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="text-5xl" id="gcMascotIcon">🥚</div>
                        <div>
                            <p class="text-xl font-bold">Lv.<span id="gcUserLevel">1</span></p>
                            <p class="text-sm opacity-80">积分: <span id="gcUserPoints">${AppState.points}</span></p>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <div class="bg-white bg-opacity-20 rounded-lg px-4 py-2 text-center">
                            <p class="text-2xl font-bold" id="gcStreak">0</p>
                            <p class="text-xs opacity-80">🔥 连胜</p>
                        </div>
                        <div class="bg-white bg-opacity-20 rounded-lg px-4 py-2 text-center">
                            <p class="text-2xl font-bold" id="gcCheckinDays">0</p>
                            <p class="text-xs opacity-80">📅 签到</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 功能入口网格 -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <!-- 每日签到 -->
                <button onclick="CheckinModule.show()" 
                        class="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                    <div class="text-4xl mb-2">📅</div>
                    <p class="font-bold">每日签到</p>
                    <p class="text-xs opacity-80">领取奖励</p>
                </button>

                <!-- 幸运转盘 -->
                <button onclick="WheelModule.show()" 
                        class="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                    <div class="text-4xl mb-2">🎡</div>
                    <p class="font-bold">幸运转盘</p>
                    <p class="text-xs opacity-80">每日免费</p>
                </button>

                <!-- 成就墙 -->
                <button onclick="AchievementModule.show()" 
                        class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                    <div class="text-4xl mb-2">🏆</div>
                    <p class="font-bold">成就墙</p>
                    <p class="text-xs opacity-80">收集荣誉</p>
                </button>

                <!-- 卡片收集 -->
                <button onclick="CardModule.show()" 
                        class="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                    <div class="text-4xl mb-2">🃏</div>
                    <p class="font-bold">卡片收集</p>
                    <p class="text-xs opacity-80">稀有图鉴</p>
                </button>

                <!-- 限时挑战 -->
                <button onclick="ChallengeModule.show()" 
                        class="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                    <div class="text-4xl mb-2">⏱️</div>
                    <p class="font-bold">限时挑战</p>
                    <p class="text-xs opacity-80">60秒答题</p>
                </button>

                <!-- 我的吉祥物 -->
                <button onclick="MascotModule.show()" 
                        class="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                    <div class="text-4xl mb-2">🐣</div>
                    <p class="font-bold">我的伙伴</p>
                    <p class="text-xs opacity-80">养成进化</p>
                </button>

                <!-- 开宝箱 -->
                <button onclick="ScratchCardModule.show()" 
                        class="bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                    <div class="text-4xl mb-2">🎁</div>
                    <p class="font-bold">开宝箱</p>
                    <p class="text-xs opacity-80">惊喜奖励</p>
                </button>

                <!-- 积分商城 -->
                <button onclick="Utils.showToast('积分商城即将上线！')" 
                        class="bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                    <div class="text-4xl mb-2">🛒</div>
                    <p class="font-bold">积分商城</p>
                    <p class="text-xs opacity-80">敬请期待</p>
                </button>
            </div>

            <!-- 返回按钮 -->
            <div class="mt-8">
                <button onclick="ReportModule.generateReport()" 
                        class="w-full px-8 py-4 bg-white border-2 border-purple-500 text-purple-600 rounded-xl hover:bg-purple-50 transition font-bold text-lg">
                    <i class="fas fa-arrow-left mr-2"></i>返回投资画像
                </button>
            </div>
        `;

        // 加载用户状态
        this.loadUserStatus();
        // 加载集卡进度
        this.loadCardProgress();
    },

    async loadCardProgress() {
        try {
            const response = await Utils.apiRequest(`/cards/collection?user_id=${AppState.userId}`);
            if (!response.success) return;

            const { owned_count, total_count, by_rarity } = response;
            const progressEl = document.getElementById('cardProgressStats');
            if (!progressEl) return;

            const progress = Math.round((owned_count / total_count) * 100);
            
            progressEl.innerHTML = `
                <div class="text-center">
                    <p class="text-2xl font-bold text-blue-600">${owned_count}</p>
                    <p class="text-xs text-gray-600">已收集</p>
                </div>
                <div class="text-center">
                    <p class="text-2xl font-bold text-gray-400">${total_count - owned_count}</p>
                    <p class="text-xs text-gray-600">待收集</p>
                </div>
                <div class="text-center">
                    <p class="text-2xl font-bold text-purple-600">${progress}%</p>
                    <p class="text-xs text-gray-600">完成度</p>
                </div>
                <div class="text-center">
                    <p class="text-2xl font-bold text-amber-600">${by_rarity.legendary || 0}</p>
                    <p class="text-xs text-gray-600">传说卡片</p>
                </div>
            `;
        } catch (e) {
            console.error('加载集卡进度失败:', e);
        }
    },

    async loadUserStatus() {
        try {
            const [streakRes, checkinRes, mascotRes] = await Promise.all([
                Utils.apiRequest(`/streak/status?user_id=${AppState.userId}`).catch(e => ({ success: false })),
                Utils.apiRequest(`/checkin/status?user_id=${AppState.userId}`).catch(e => ({ success: false })),
                Utils.apiRequest(`/mascot/status?user_id=${AppState.userId}`).catch(e => ({ success: false }))
            ]);

            if (streakRes && streakRes.success) {
                const streakEl = document.getElementById('gcStreak');
                if (streakEl) streakEl.textContent = streakRes.current_streak || 0;
            }
            if (checkinRes && checkinRes.success) {
                const checkinEl = document.getElementById('gcCheckinDays');
                if (checkinEl) checkinEl.textContent = checkinRes.streak || 0;
            }
            if (mascotRes && mascotRes.success && mascotRes.mascot) {
                const iconEl = document.getElementById('gcMascotIcon');
                const levelEl = document.getElementById('gcUserLevel');
                if (iconEl) iconEl.textContent = mascotRes.mascot.icon || '🥚';
                if (levelEl) levelEl.textContent = mascotRes.mascot.level || 1;
            }
            const pointsEl = document.getElementById('gcUserPoints');
            if (pointsEl) pointsEl.textContent = AppState.points;
        } catch (e) {
            console.error('加载用户状态失败:', e);
            // 静默失败，不影响页面显示
        }
    }
};

/***********************
 * 签到模块
 ***********************/
const CheckinModule = {
    async show() {
        Utils.showPage('checkin-page');
        await this.render();
    },

    async render() {
        const container = document.getElementById('checkinContainer');
        if (!container) return;

        try {
            const response = await Utils.apiRequest(`/checkin/status?user_id=${AppState.userId}`);
            if (!response.success) return;

            const { already_checked, streak, total_days, calendar, rewards } = response;

            container.innerHTML = `
                <div class="text-center mb-8">
                    <h1 class="text-4xl font-bold text-gray-800 mb-4">
                        <span class="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                            📅 每日签到
                        </span>
                    </h1>
                    <p class="text-gray-600 text-lg">坚持学习，收获满满！</p>
                </div>

                <!-- 签到状态卡片 -->
                <div class="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-xl p-8 mb-6 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-4xl font-bold mb-2">🔥 ${streak} 天</p>
                            <p class="text-lg opacity-90">连续签到</p>
                        </div>
                        <div class="text-center">
                            <p class="text-2xl font-bold">${total_days}</p>
                            <p class="text-sm opacity-80">累计签到</p>
                        </div>
                    </div>
                </div>

                <!-- 签到按钮 -->
                <div class="text-center mb-8">
                    ${already_checked ? `
                        <button disabled 
                                class="px-12 py-4 bg-gray-400 text-white rounded-2xl font-bold text-xl cursor-not-allowed">
                            ✅ 今日已签到
                        </button>
                    ` : `
                        <button onclick="CheckinModule.doCheckin()" 
                                class="px-12 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-pulse">
                            🎁 立即签到
                        </button>
                    `}
                </div>

                <!-- 签到日历 -->
                <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">📆 本月签到</h3>
                    <div class="grid grid-cols-7 gap-2">
                        ${['日', '一', '二', '三', '四', '五', '六'].map(d => 
                            `<div class="text-center text-sm text-gray-500 font-medium py-2">${d}</div>`
                        ).join('')}
                        ${this.generateCalendarDays(calendar)}
                    </div>
                </div>

                <!-- 签到奖励 -->
                <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">🎁 连续签到奖励</h3>
                    <div class="flex gap-4 overflow-x-auto pb-2">
                        ${rewards.map((r, i) => `
                            <div class="flex-shrink-0 text-center p-4 rounded-xl ${r.claimed ? 'bg-green-100 border-2 border-green-400' : 'bg-gray-100 border-2 border-gray-300'}">
                                <p class="text-3xl mb-2">${r.claimed ? '✅' : '🎁'}</p>
                                <p class="font-bold text-gray-800">${r.day}天</p>
                                <p class="text-sm text-gray-600">${r.reward}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 返回按钮 -->
                <button onclick="GameCenter.show()" 
                        class="w-full px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-bold text-lg">
                    <i class="fas fa-arrow-left mr-2"></i>返回游戏中心
                </button>
            `;
        } catch (e) {
            console.error('加载签到状态失败:', e);
        }
    },

    generateCalendarDays(calendar) {
        if (!calendar || calendar.length === 0) return '';
        
        // 获取本月第一天是星期几
        const firstDay = new Date(calendar[0].date);
        const startWeekday = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1).getDay();
        
        // 填充空白格子
        let html = '';
        for (let i = 0; i < startWeekday; i++) {
            html += '<div></div>';
        }
        
        calendar.forEach(day => {
            const isToday = day.is_today;
            const isChecked = day.checked;
            html += `
                <div class="text-center py-2 rounded-lg ${isToday ? 'ring-2 ring-orange-400' : ''} 
                            ${isChecked ? 'bg-gradient-to-br from-green-400 to-green-500 text-white' : 'bg-gray-100'}">
                    <span class="font-medium">${day.day}</span>
                    ${isChecked ? '<span class="block text-xs">✓</span>' : ''}
                </div>
            `;
        });
        
        return html;
    },

    async doCheckin() {
        try {
            const response = await Utils.apiRequest(`/checkin/do?user_id=${AppState.userId}`, {
                method: 'POST'
            });

            if (response.success) {
                // 显示庆祝动画
                this.showCheckinCelebration(response);
                
                // 更新积分
                AppState.points += response.points_earned;
                
                // 喂养吉祥物
                await MascotModule.feed(response.points_earned);
                
                // 重新渲染
                setTimeout(() => this.render(), 2000);
            } else {
                Utils.showToast(response.message || '签到失败');
            }
        } catch (e) {
            console.error('签到失败:', e);
        }
    },

    showCheckinCelebration(response) {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        overlay.innerHTML = `
            <div class="bg-white rounded-3xl p-8 text-center max-w-sm mx-4 transform animate-bounce-in">
                <div class="text-6xl mb-4">🎉</div>
                <h2 class="text-3xl font-bold text-gray-800 mb-2">签到成功！</h2>
                <p class="text-xl text-orange-500 font-bold mb-4">🔥 连续 ${response.streak} 天</p>
                <p class="text-lg text-green-500 font-bold">+${response.points_earned} 积分</p>
                ${response.special_rewards.length > 0 ? `
                    <div class="mt-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
                        <p class="font-bold text-purple-600">🎁 特殊奖励</p>
                        ${response.special_rewards.map(r => `<p class="text-sm">${r.name}</p>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        document.body.appendChild(overlay);
        
        // 触发彩带效果
        this.triggerConfetti();
        
        setTimeout(() => overlay.remove(), 2500);
    },

    triggerConfetti() {
        const colors = ['#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#3b82f6'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            confetti.style.animationDuration = (2 + Math.random()) + 's';
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }
    }
};

/***********************
 * 连胜模块
 ***********************/
const StreakModule = {
    currentStreak: 0,
    maxStreak: 0,

    async init() {
        try {
            const response = await Utils.apiRequest(`/streak/status?user_id=${AppState.userId}`);
            if (response && response.success) {
                this.currentStreak = response.current_streak || 0;
                this.maxStreak = response.max_streak || 0;
                this.updateDisplay();
            } else {
                // 初始化默认值
                this.currentStreak = 0;
                this.maxStreak = 0;
                console.log('连胜状态初始化为默认值');
            }
        } catch (e) {
            console.error('加载连胜状态失败:', e);
            // 初始化默认值，避免崩溃
            this.currentStreak = 0;
            this.maxStreak = 0;
        }
    },

    async update(isCorrect) {
        try {
            const response = await Utils.apiRequest(`/streak/update?user_id=${AppState.userId}&is_correct=${isCorrect}`, {
                method: 'POST'
            });

            if (response.success) {
                this.currentStreak = response.current_streak;
                this.maxStreak = response.max_streak;
                this.updateDisplay();

                // 检查成就
                if (response.achievements_unlocked.length > 0) {
                    response.achievements_unlocked.forEach(ach => {
                        this.showAchievementUnlock(ach);
                    });
                }

                // 显示连胜特效
                if (isCorrect && this.currentStreak >= 3) {
                    this.showStreakEffect();
                }
            }
        } catch (e) {
            console.error('更新连胜失败:', e);
        }
    },

    updateDisplay() {
        const display = document.getElementById('streakDisplay');
        const count = document.getElementById('streakCount');
        
        // 检查元素是否存在
        if (!display || !count) {
            return; // 如果元素不存在，直接返回，避免错误
        }
        
        if (this.currentStreak >= 3) {
            display.classList.remove('hidden');
            count.textContent = this.currentStreak;
            
            // 根据连胜数量增加火焰
            const flames = '🔥'.repeat(Math.min(Math.floor(this.currentStreak / 3), 5));
            const firstSpan = display.querySelector('span:first-child');
            if (firstSpan) {
                firstSpan.textContent = flames;
            }
        } else {
            display.classList.add('hidden');
        }
    },

    showStreakEffect() {
        const effect = document.createElement('div');
        effect.className = 'fixed inset-0 pointer-events-none z-50';
        effect.innerHTML = `
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div class="text-8xl animate-streak-fire">🔥</div>
                <div class="text-4xl font-bold text-orange-500 mt-4 animate-bounce">${this.currentStreak}连胜！</div>
            </div>
        `;
        document.body.appendChild(effect);
        
        // 添加火焰粒子
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'fire-particle';
            particle.style.left = (40 + Math.random() * 20) + '%';
            particle.style.animationDelay = Math.random() * 0.5 + 's';
            effect.appendChild(particle);
        }
        
        setTimeout(() => effect.remove(), 2000);
    },

    showAchievementUnlock(achievement) {
        const popup = document.createElement('div');
        popup.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down';
        popup.innerHTML = `
            <div class="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
                <span class="text-4xl">${achievement.icon}</span>
                <div>
                    <p class="text-sm opacity-80">成就解锁！</p>
                    <p class="font-bold text-lg">${achievement.name}</p>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        
        setTimeout(() => popup.remove(), 3000);
    }
};

/***********************
 * 转盘模块
 ***********************/
const WheelModule = {
    prizes: [],
    isSpinning: false,
    rotation: 0,

    async show() {
        Utils.showPage('wheel-page');
        await this.render();
    },

    async render() {
        const container = document.getElementById('wheelContainer');
        if (!container) return;

        try {
            const response = await Utils.apiRequest(`/wheel/info?user_id=${AppState.userId}`);
            if (!response.success) return;

            this.prizes = response.prizes;
            const { free_spins_left, spin_cost } = response;

            container.innerHTML = `
                <div class="text-center mb-8">
                    <h1 class="text-4xl font-bold text-gray-800 mb-4">
                        <span class="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            🎡 幸运转盘
                        </span>
                    </h1>
                    <p class="text-gray-600 text-lg">每日一次免费机会！</p>
                </div>

                <!-- 转盘区域 -->
                <div class="relative max-w-md mx-auto mb-8">
                    <!-- 转盘背景 -->
                    <div class="relative w-80 h-80 mx-auto">
                        <svg id="wheelSvg" class="w-full h-full" viewBox="0 0 300 300">
                            ${this.generateWheelSectors()}
                        </svg>
                        <!-- 指针 -->
                        <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
                            <div class="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[40px] border-l-transparent border-r-transparent border-t-red-500"></div>
                        </div>
                        <!-- 中心按钮 -->
                        <button onclick="WheelModule.spin()" 
                                id="spinBtn"
                                class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-600 text-white font-bold text-lg shadow-xl hover:scale-110 transition-transform z-20">
                            抽奖
                        </button>
                    </div>
                </div>

                <!-- 剩余次数 -->
                <div class="bg-white rounded-2xl shadow-xl p-6 mb-6 text-center">
                    <div class="flex justify-center gap-8">
                        <div>
                            <p class="text-3xl font-bold text-green-500">${free_spins_left}</p>
                            <p class="text-gray-600">免费次数</p>
                        </div>
                        <div>
                            <p class="text-3xl font-bold text-purple-500">${spin_cost}</p>
                            <p class="text-gray-600">积分抽奖</p>
                        </div>
                    </div>
                </div>

                <!-- 奖品列表 -->
                <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">🎁 奖品列表</h3>
                    <div class="grid grid-cols-3 md:grid-cols-4 gap-3">
                        ${this.prizes.map(p => `
                            <div class="text-center p-3 rounded-lg" style="background: ${p.color}20; border: 2px solid ${p.color}">
                                <p class="font-bold" style="color: ${p.color}">${p.name}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 返回按钮 -->
                <button onclick="GameCenter.show()" 
                        class="w-full px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-bold text-lg">
                    <i class="fas fa-arrow-left mr-2"></i>返回游戏中心
                </button>
            `;
        } catch (e) {
            console.error('加载转盘失败:', e);
        }
    },

    generateWheelSectors() {
        const n = this.prizes.length;
        const angle = 360 / n;
        let svg = '';
        
        this.prizes.forEach((prize, i) => {
            const startAngle = i * angle - 90;
            const endAngle = startAngle + angle;
            
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            
            const cx = 150, cy = 150, r = 140;
            const x1 = cx + r * Math.cos(startRad);
            const y1 = cy + r * Math.sin(startRad);
            const x2 = cx + r * Math.cos(endRad);
            const y2 = cy + r * Math.sin(endRad);
            
            const largeArc = angle > 180 ? 1 : 0;
            
            svg += `
                <path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z" 
                      fill="${prize.color}" stroke="white" stroke-width="2"/>
            `;
            
            // 添加文字
            const textAngle = startAngle + angle / 2;
            const textRad = (textAngle * Math.PI) / 180;
            const tx = cx + (r * 0.65) * Math.cos(textRad);
            const ty = cy + (r * 0.65) * Math.sin(textRad);
            
            svg += `
                <text x="${tx}" y="${ty}" 
                      fill="white" font-size="11" font-weight="bold" 
                      text-anchor="middle" dominant-baseline="middle"
                      transform="rotate(${textAngle + 90}, ${tx}, ${ty})">
                    ${prize.name}
                </text>
            `;
        });
        
        return svg;
    },

    async spin() {
        if (this.isSpinning) return;
        this.isSpinning = true;

        const spinBtn = document.getElementById('spinBtn');
        spinBtn.disabled = true;
        spinBtn.textContent = '...';

        try {
            const response = await Utils.apiRequest(`/wheel/spin?user_id=${AppState.userId}`, {
                method: 'POST'
            });

            if (!response.success) {
                Utils.showToast(response.message || '抽奖失败');
                return;
            }

            const prizeIndex = response.prize_index;
            const prize = response.prize;
            
            // 计算旋转角度
            const sectorAngle = 360 / this.prizes.length;
            const targetAngle = 360 - (prizeIndex * sectorAngle) - (sectorAngle / 2);
            const spins = 5; // 转5圈
            this.rotation += spins * 360 + targetAngle - (this.rotation % 360);

            // 应用动画
            const wheel = document.getElementById('wheelSvg');
            wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
            wheel.style.transform = `rotate(${this.rotation}deg)`;

            // 显示结果
            setTimeout(() => {
                this.showPrizeResult(prize);
                this.isSpinning = false;
                spinBtn.disabled = false;
                spinBtn.textContent = '抽奖';
                this.render(); // 刷新界面
            }, 4500);

        } catch (e) {
            console.error('抽奖失败:', e);
            this.isSpinning = false;
            spinBtn.disabled = false;
            spinBtn.textContent = '抽奖';
        }
    },

    showPrizeResult(prize) {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        overlay.innerHTML = `
            <div class="bg-white rounded-3xl p-8 text-center max-w-sm mx-4 animate-bounce-in">
                <div class="text-6xl mb-4">🎊</div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">恭喜获得！</h2>
                <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-xl text-xl font-bold">
                    ${prize.name}
                </div>
                <button onclick="this.closest('.fixed').remove()" 
                        class="mt-6 px-8 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition">
                    太棒了！
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // 处理奖品
        if (prize.type === 'points') {
            AppState.points += prize.value;
        }
    }
};

/***********************
 * 成就模块
 ***********************/
const AchievementModule = {
    async show() {
        Utils.showPage('achievements-page');
        await this.render();
    },

    async render() {
        const container = document.getElementById('achievementsContainer');
        if (!container) return;

        try {
            const response = await Utils.apiRequest(`/achievements/list?user_id=${AppState.userId}`);
            if (!response.success) return;

            const { achievements, unlocked_count, total_count } = response;

            container.innerHTML = `
                <div class="text-center mb-8">
                    <h1 class="text-4xl font-bold text-gray-800 mb-4">
                        <span class="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                            🏆 成就墙
                        </span>
                    </h1>
                    <p class="text-gray-600 text-lg">已解锁 ${unlocked_count} / ${total_count} 个成就</p>
                </div>

                <!-- 进度条 -->
                <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-bold text-gray-700">收集进度</span>
                        <span class="text-purple-600 font-bold">${Math.round(unlocked_count/total_count*100)}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-4">
                        <div class="bg-gradient-to-r from-yellow-400 to-orange-500 h-4 rounded-full transition-all duration-500" 
                             style="width: ${unlocked_count/total_count*100}%"></div>
                    </div>
                </div>

                <!-- 成就网格 -->
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    ${achievements.map(ach => `
                        <div class="bg-white rounded-2xl shadow-lg p-6 text-center transform transition-all duration-300 ${ach.unlocked ? 'hover:scale-105 hover:shadow-xl' : 'opacity-60'}">
                            <div class="text-5xl mb-3 ${ach.unlocked ? '' : 'grayscale'}">${ach.icon}</div>
                            <h4 class="font-bold text-gray-800 mb-1">${ach.name}</h4>
                            <p class="text-xs text-gray-500 mb-2">${ach.desc}</p>
                            <div class="mt-2">
                                ${ach.unlocked ? 
                                    '<span class="inline-block px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-bold">✅ 已解锁</span>' : 
                                    `<span class="inline-block px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">+${ach.points}分</span>`
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- 返回按钮 -->
                <button onclick="GameCenter.show()" 
                        class="w-full px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-bold text-lg">
                    <i class="fas fa-arrow-left mr-2"></i>返回游戏中心
                </button>
            `;
        } catch (e) {
            console.error('加载成就失败:', e);
        }
    }
};

/***********************
 * 每日任务模块
 ***********************/
const DailyTaskModule = {
    async show() {
        Utils.showPage('daily-task-page');
        await this.render();
    },

    async render() {
        const container = document.getElementById('dailyTaskContainer') || document.getElementById('cardsContainer');
        if (!container) {
            // 如果没有容器，创建一个临时容器
            const tempContainer = document.createElement('div');
            tempContainer.id = 'dailyTaskContainer';
            document.getElementById('game-center-page')?.appendChild(tempContainer);
            container = tempContainer;
        }

        try {
            const tasks = [
                {
                    id: 'daily_login',
                    name: '每日登录',
                    desc: '打开应用即可完成',
                    icon: '📱',
                    progress: 1,
                    target: 1,
                    reward: { type: 'points', amount: 10 },
                    completed: true
                },
                {
                    id: 'complete_learning',
                    name: '完成学习',
                    desc: '完成任意一只股票的学习',
                    icon: '📚',
                    progress: 0,
                    target: 1,
                    reward: { type: 'points', amount: 50, cards: 1 },
                    completed: false
                },
                {
                    id: 'answer_quiz',
                    name: '完成答题',
                    desc: '完成一次答题测试',
                    icon: '✏️',
                    progress: 0,
                    target: 1,
                    reward: { type: 'points', amount: 30 },
                    completed: false
                },
                {
                    id: 'open_box',
                    name: '开启宝箱',
                    desc: '开启一次宝箱',
                    icon: '🎁',
                    progress: 0,
                    target: 1,
                    reward: { type: 'points', amount: 20, cards: 1 },
                    completed: false
                },
                {
                    id: 'collect_card',
                    name: '收集卡片',
                    desc: '获得3张新卡片',
                    icon: '🃏',
                    progress: 0,
                    target: 3,
                    reward: { type: 'points', amount: 100 },
                    completed: false
                },
                {
                    id: 'perfect_score',
                    name: '完美答题',
                    desc: '答题获得满分',
                    icon: '⭐',
                    progress: 0,
                    target: 1,
                    reward: { type: 'points', amount: 200, cards: 2 },
                    completed: false
                }
            ];

            container.innerHTML = `
                <div class="text-center mb-8">
                    <h1 class="text-4xl font-bold text-gray-800 mb-4">
                        <span class="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                            📋 每日任务
                        </span>
                    </h1>
                    <p class="text-gray-600 text-lg">完成任务，获得丰厚奖励！</p>
                </div>

                <!-- 任务列表 -->
                <div class="space-y-4 mb-6">
                    ${tasks.map(task => `
                        <div class="bg-white rounded-2xl shadow-lg p-6 ${task.completed ? 'ring-2 ring-green-400' : ''}">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4 flex-1">
                                    <div class="text-5xl">${task.icon}</div>
                                    <div class="flex-1">
                                        <h3 class="text-lg font-bold text-gray-800 mb-1">${task.name}</h3>
                                        <p class="text-sm text-gray-600 mb-2">${task.desc}</p>
                                        <div class="w-full bg-gray-200 rounded-full h-2">
                                            <div class="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full transition-all duration-500" 
                                                 style="width: ${(task.progress / task.target) * 100}%"></div>
                                        </div>
                                        <p class="text-xs text-gray-500 mt-1">${task.progress}/${task.target}</p>
                                    </div>
                                </div>
                                <div class="text-right ml-4">
                                    <div class="mb-2">
                                        ${task.reward.type === 'points' ? `
                                            <span class="inline-block px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-bold">
                                                +${task.reward.amount} 积分
                                            </span>
                                        ` : ''}
                                        ${task.reward.cards ? `
                                            <span class="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold ml-1">
                                                +${task.reward.cards} 卡片
                                            </span>
                                        ` : ''}
                                    </div>
                                    ${task.completed ? `
                                        <button class="px-4 py-2 bg-green-500 text-white rounded-lg font-bold text-sm">
                                            ✓ 已完成
                                        </button>
                                    ` : `
                                        <button class="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-bold text-sm">
                                            进行中
                                        </button>
                                    `}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- 返回按钮 -->
                <div class="mt-6">
                    <button onclick="GameCenter.show()" 
                            class="w-full px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-bold text-lg">
                        <i class="fas fa-arrow-left mr-2"></i>返回游戏中心
                    </button>
                </div>
            `;
        } catch (e) {
            console.error('加载每日任务失败:', e);
        }
    }
};

/***********************
 * 卡片收集模块
 ***********************/
const CardModule = {
    async show() {
        Utils.showPage('cards-page');
        await this.render();
    },

    async render() {
        const container = document.getElementById('cardsContainer');
        if (!container) return;

        try {
            const response = await Utils.apiRequest(`/cards/collection?user_id=${AppState.userId}`);
            if (!response.success) return;

            const { cards, owned_count, total_count, by_rarity } = response;
            const rarities = ['common', 'rare', 'epic', 'legendary'];
            const rarityNames = { common: '普通', rare: '稀有', epic: '史诗', legendary: '传说' };
            const rarityColors = { common: '#9ca3af', rare: '#3b82f6', epic: '#8b5cf6', legendary: '#f59e0b' };

            container.innerHTML = `
                <div class="text-center mb-8">
                    <h1 class="text-4xl font-bold text-gray-800 mb-4">
                        <span class="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                            🃏 卡片图鉴
                        </span>
                    </h1>
                    <p class="text-gray-600 text-lg">已收集 ${owned_count} / ${total_count} 张卡片</p>
                </div>

                <!-- 稀有度统计 -->
                <div class="grid grid-cols-4 gap-3 mb-6">
                    ${rarities.map(r => `
                        <div class="bg-white rounded-xl p-4 text-center shadow-lg" style="border: 2px solid ${rarityColors[r]}">
                            <p class="text-2xl font-bold" style="color: ${rarityColors[r]}">${by_rarity[r] || 0}</p>
                            <p class="text-xs text-gray-600">${rarityNames[r]}</p>
                        </div>
                    `).join('')}
                </div>

                <!-- 开宝箱按钮 -->
                <div class="text-center mb-6">
                    <button onclick="ScratchCardModule.openBox()" 
                            class="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                        🎁 开启宝箱获取卡片
                    </button>
                </div>

                <!-- 卡片合成系统 -->
                <div class="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 mb-6 border-2 border-purple-300">
                    <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span class="text-2xl mr-2">✨</span>卡片合成
                    </h3>
                    <p class="text-gray-600 text-sm mb-4">3张同等级卡片可以合成1张更高等级的卡片</p>
                    <div class="grid grid-cols-3 gap-4">
                        <button onclick="CardModule.showCompose('rare')" 
                                class="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition">
                            <div class="text-3xl mb-2">🔷</div>
                            <p class="text-sm font-bold text-blue-600">合成稀有</p>
                            <p class="text-xs text-gray-500">3张普通</p>
                        </button>
                        <button onclick="CardModule.showCompose('epic')" 
                                class="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition">
                            <div class="text-3xl mb-2">💜</div>
                            <p class="text-sm font-bold text-purple-600">合成史诗</p>
                            <p class="text-xs text-gray-500">3张稀有</p>
                        </button>
                        <button onclick="CardModule.showCompose('legendary')" 
                                class="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition">
                            <div class="text-3xl mb-2">⭐</div>
                            <p class="text-sm font-bold text-amber-600">合成传说</p>
                            <p class="text-xs text-gray-500">3张史诗</p>
                        </button>
                    </div>
                </div>

                <!-- 集卡成就 -->
                <div class="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6 mb-6 border-2 border-yellow-300">
                    <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span class="text-2xl mr-2">🏆</span>集卡成就
                    </h3>
                    <div class="grid grid-cols-2 gap-3">
                        ${this.renderCardAchievements(owned_count, total_count, by_rarity)}
                    </div>
                </div>

                <!-- 卡片网格 - 按股票分组 -->
                <div class="space-y-6">
                    ${this.groupCardsByStock(cards).map(group => `
                        <div class="bg-white rounded-2xl shadow-xl p-6">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-bold text-gray-800">${group.stockName} <span class="text-sm text-gray-500">${group.stockCode}</span></h3>
                                <span class="text-sm text-gray-500">${group.cards.filter(c => c.owned).length}/${group.cards.length} 已收集</span>
                            </div>
                            <div class="grid grid-cols-4 gap-3">
                                ${group.cards.map(card => `
                                    <div onclick="${card.owned ? `CardModule.showCardDetail('${card.id}')` : ''}" 
                                         class="aspect-square rounded-xl flex flex-col items-center justify-center text-3xl relative overflow-hidden transition-all duration-300 ${card.owned ? 'hover:scale-110 cursor-pointer' : 'cursor-not-allowed'}"
                                         style="background: ${card.owned ? card.rarity_info.color + '20' : '#f3f4f6'}; 
                                                border: 2px solid ${card.owned ? card.rarity_info.color : '#e5e7eb'};
                                                ${card.owned && card.rarity === 'legendary' ? 'box-shadow: ' + card.rarity_info.glow : ''}">
                                        ${card.owned ? `
                                            <span class="text-4xl mb-1">${this.getCardEmoji(card.sector)}</span>
                                            ${card.rarity === 'legendary' ? '<div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shine"></div>' : ''}
                                        ` : `
                                            <span class="text-gray-400 text-3xl">?</span>
                                        `}
                                        <span class="absolute bottom-1 left-1 right-1 text-xs font-bold text-center" style="color: ${card.rarity_info.color}">${card.rarity_info.name}</span>
                                        ${card.owned ? '<div class="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>' : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- 返回按钮 -->
                <div class="mt-6">
                    <button onclick="GameCenter.show()" 
                            class="w-full px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-bold text-lg">
                        <i class="fas fa-arrow-left mr-2"></i>返回游戏中心
                    </button>
                </div>
            `;
        } catch (e) {
            console.error('加载卡片失败:', e);
        }
    },

    groupCardsByStock(cards) {
        const groups = {};
        cards.forEach(card => {
            if (!groups[card.stock_id]) {
                groups[card.stock_id] = {
                    stockId: card.stock_id,
                    stockName: card.stock_name,
                    stockCode: card.stock_code,
                    cards: []
                };
            }
            groups[card.stock_id].cards.push(card);
        });
        return Object.values(groups);
    },

    getCardEmoji(sector) {
        const emojis = {
            '消费': '🛒', '新能源': '⚡', '金融': '💰', '科技': '💻',
            '医药': '💊', '化工': '⚗️', '公用事业': '🏭', '通信': '📡'
        };
        return emojis[sector] || '📈';
    },

    renderCardAchievements(owned_count, total_count, by_rarity) {
        const achievements = [
            {
                id: 'collect_10',
                name: '初级收藏家',
                desc: '收集10张卡片',
                icon: '🃏',
                progress: Math.min(owned_count, 10),
                target: 10,
                completed: owned_count >= 10
            },
            {
                id: 'collect_50',
                name: '中级收藏家',
                desc: '收集50张卡片',
                icon: '🎴',
                progress: Math.min(owned_count, 50),
                target: 50,
                completed: owned_count >= 50
            },
            {
                id: 'collect_all',
                name: '完美收藏家',
                desc: '收集所有卡片',
                icon: '👑',
                progress: owned_count,
                target: total_count,
                completed: owned_count >= total_count
            },
            {
                id: 'legendary_5',
                name: '传说大师',
                desc: '拥有5张传说卡片',
                icon: '⭐',
                progress: Math.min(by_rarity.legendary || 0, 5),
                target: 5,
                completed: (by_rarity.legendary || 0) >= 5
            }
        ];

        return achievements.map(ach => `
            <div class="bg-white rounded-xl p-4 ${ach.completed ? 'ring-2 ring-yellow-400' : ''}">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">${ach.icon}</span>
                        <div>
                            <p class="text-sm font-bold text-gray-800">${ach.name}</p>
                            <p class="text-xs text-gray-500">${ach.desc}</p>
                        </div>
                    </div>
                    ${ach.completed ? '<span class="text-yellow-500 text-xl">✓</span>' : ''}
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500" 
                         style="width: ${(ach.progress / ach.target) * 100}%"></div>
                </div>
                <p class="text-xs text-gray-500 mt-1 text-right">${ach.progress}/${ach.target}</p>
            </div>
        `).join('');
    },

    showCardUnlockModal(requiredRarity, difficultyName) {
        const rarityNames = {
            'common': '普通',
            'rare': '稀有',
            'epic': '史诗',
            'legendary': '传说'
        };
        
        const rarityConfigs = {
            'common': {
                color: '#9ca3af',
                gradient: 'from-gray-400 to-gray-600',
                bgGradient: 'from-gray-50 to-gray-100',
                icon: '🔷',
                glow: 'shadow-gray-400/50'
            },
            'rare': {
                color: '#3b82f6',
                gradient: 'from-blue-400 to-blue-600',
                bgGradient: 'from-blue-50 to-cyan-100',
                icon: '💎',
                glow: 'shadow-blue-400/50'
            },
            'epic': {
                color: '#8b5cf6',
                gradient: 'from-purple-400 to-purple-600',
                bgGradient: 'from-purple-50 to-pink-100',
                icon: '💜',
                glow: 'shadow-purple-400/50'
            },
            'legendary': {
                color: '#f59e0b',
                gradient: 'from-amber-400 to-yellow-600',
                bgGradient: 'from-amber-50 to-yellow-100',
                icon: '⭐',
                glow: 'shadow-amber-400/50'
            }
        };
        
        const config = rarityConfigs[requiredRarity] || rarityConfigs['rare'];
        
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 modal-premium';
        overlay.onclick = () => overlay.remove();

        overlay.innerHTML = `
            <div class="modal-premium-content rounded-3xl p-0 max-w-lg w-full overflow-hidden transform transition-all" onclick="event.stopPropagation()">
                <!-- 背景装饰 -->
                <div class="absolute inset-0 bg-gradient-to-br ${config.bgGradient} opacity-50"></div>
                <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${config.gradient} rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                
                <div class="relative p-8">
                    <!-- 关闭按钮 -->
                    <button onclick="this.closest('.fixed').remove()" 
                            class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white transition-all shadow-lg hover:scale-110">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <!-- 锁图标 -->
                    <div class="text-center mb-6">
                        <div class="relative inline-block mb-4">
                            <div class="text-8xl animate-bounce">🔒</div>
                            <div class="absolute inset-0 bg-gradient-to-br ${config.gradient} rounded-full blur-2xl opacity-30 animate-pulse"></div>
                        </div>
                        <h3 class="text-3xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">需要解锁</h3>
                        <p class="text-gray-600 text-lg">${difficultyName}需要${rarityNames[requiredRarity]}卡片解锁</p>
                    </div>
                    
                    <!-- 卡片展示区域 -->
                    <div class="relative mb-8 group">
                        <div class="absolute inset-0 bg-gradient-to-br ${config.gradient} rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity ${config.glow}"></div>
                        <div class="relative bg-gradient-to-br ${config.bgGradient} rounded-3xl p-8 border-2 border-white/50 shadow-2xl">
                            <div class="text-center">
                                <div class="relative inline-block mb-4">
                                    <div class="text-7xl transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                                        ${config.icon}
                                    </div>
                                    <div class="absolute inset-0 bg-gradient-to-br ${config.gradient} rounded-full blur-xl opacity-50 animate-pulse"></div>
                                </div>
                                <p class="text-2xl font-bold mb-2" style="color: ${config.color}">${rarityNames[requiredRarity]}卡片</p>
                                <p class="text-sm text-gray-600">收集此卡片解锁更高难度</p>
                            </div>
                        </div>
                    </div>

                    <!-- 获取方式 -->
                    <div class="space-y-3 mb-8">
                        <div class="relative backdrop-blur-xl bg-gradient-to-br from-blue-50/90 to-indigo-50/90 border-l-4 border-blue-500 p-6 rounded-r-2xl shadow-xl">
                            <div class="flex items-start gap-4">
                                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg">
                                    💡
                                </div>
                                <div class="flex-1">
                                    <p class="text-lg font-bold text-blue-800 mb-3">
                                        如何获得${rarityNames[requiredRarity]}卡片？
                                    </p>
                                    <ul class="space-y-2">
                                        <li class="flex items-center gap-3 text-blue-700">
                                            <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <span>开启宝箱有概率获得</span>
                                        </li>
                                        <li class="flex items-center gap-3 text-blue-700">
                                            <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <span>完成学习任务获得奖励</span>
                                        </li>
                                        <li class="flex items-center gap-3 text-blue-700">
                                            <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <span>通过卡片合成获得</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 操作按钮 -->
                    <div class="flex gap-4">
                        <button onclick="this.closest('.fixed').remove()" 
                                class="flex-1 px-6 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl font-bold hover:bg-white hover:shadow-xl transition-all border border-gray-200 hover:border-gray-300 hover:scale-105">
                            知道了
                        </button>
                        <button onclick="this.closest('.fixed').remove(); ScratchCardModule.show();" 
                                class="flex-1 px-6 py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white rounded-2xl font-bold hover:shadow-2xl transition-all hover:scale-105 relative overflow-hidden group">
                            <span class="relative z-10 flex items-center justify-center gap-2">
                                <span class="text-xl">🎁</span>
                                <span>去开宝箱</span>
                            </span>
                            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        
        // 添加进入动画
        setTimeout(() => {
            overlay.querySelector('.modal-premium-content').style.animation = 'modal-scale-in 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        }, 10);
    },

    async showCardDetail(cardId) {
        try {
            const response = await Utils.apiRequest(`/cards/collection?user_id=${AppState.userId}`);
            if (!response.success) return;

            const card = response.cards.find(c => c.id === cardId);
            if (!card || !card.owned) return;

            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4';
            overlay.onclick = () => overlay.remove();

            overlay.innerHTML = `
                <div class="bg-white rounded-3xl p-8 max-w-md w-full transform transition-all" onclick="event.stopPropagation()">
                    <div class="text-center mb-6">
                        <div class="text-8xl mb-4">${this.getCardEmoji(card.sector)}</div>
                        <h3 class="text-2xl font-bold text-gray-800 mb-2">${card.stock_name}</h3>
                        <p class="text-gray-500">${card.stock_code} · ${card.sector}</p>
                    </div>
                    
                    <div class="bg-gradient-to-r ${card.rarity_info.color}20 rounded-xl p-6 mb-6 border-2" style="border-color: ${card.rarity_info.color}">
                        <div class="text-center">
                            <p class="text-sm text-gray-600 mb-2">稀有度</p>
                            <p class="text-2xl font-bold" style="color: ${card.rarity_info.color}">${card.rarity_info.name}</p>
                        </div>
                    </div>

                    <div class="space-y-3 mb-6">
                        <div class="flex justify-between">
                            <span class="text-gray-600">卡片编号</span>
                            <span class="font-bold">#${card.id}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">获得时间</span>
                            <span class="font-bold">刚刚</span>
                        </div>
                    </div>

                    <button onclick="this.closest('.fixed').remove()" 
                            class="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition">
                        关闭
                    </button>
                </div>
            `;

            document.body.appendChild(overlay);
        } catch (e) {
            console.error('显示卡片详情失败:', e);
        }
    },

    async showCompose(targetRarity) {
        const rarityMap = {
            'rare': { from: 'common', name: '稀有', icon: '🔷' },
            'epic': { from: 'rare', name: '史诗', icon: '💜' },
            'legendary': { from: 'epic', name: '传说', icon: '⭐' }
        };

        const config = rarityMap[targetRarity];
        if (!config) return;

        try {
            const response = await Utils.apiRequest(`/cards/collection?user_id=${AppState.userId}`);
            if (!response.success) return;

            // 找到用户拥有的该等级卡片
            const availableCards = response.cards.filter(c => c.owned && c.rarity === config.from);
            
            if (availableCards.length < 3) {
                Utils.showToast(`需要至少3张${config.from === 'common' ? '普通' : config.from === 'rare' ? '稀有' : '史诗'}卡片才能合成！`);
                return;
            }

            // 显示合成界面
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4';
            overlay.onclick = () => overlay.remove();

            overlay.innerHTML = `
                <div class="bg-white rounded-3xl p-8 max-w-md w-full transform transition-all" onclick="event.stopPropagation()">
                    <h3 class="text-2xl font-bold text-gray-800 mb-6 text-center">✨ 卡片合成</h3>
                    
                    <div class="text-center mb-6">
                        <div class="flex items-center justify-center gap-2 mb-4">
                            ${[1,2,3].map(i => `
                                <div class="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center text-2xl border-2 border-gray-400">
                                    ${this.getCardEmoji(availableCards[0]?.sector || '')}
                                </div>
                                ${i < 3 ? '<span class="text-2xl">+</span>' : ''}
                            `).join('')}
                        </div>
                        <div class="text-3xl mb-2">↓</div>
                        <div class="w-20 h-20 bg-gradient-to-br ${config.icon === '🔷' ? 'from-blue-400 to-blue-600' : config.icon === '💜' ? 'from-purple-400 to-purple-600' : 'from-amber-400 to-amber-600'} rounded-xl flex items-center justify-center text-4xl mx-auto border-2" style="border-color: ${config.icon === '🔷' ? '#3b82f6' : config.icon === '💜' ? '#8b5cf6' : '#f59e0b'}">
                            ${config.icon}
                        </div>
                        <p class="text-lg font-bold mt-2">${config.name}卡片</p>
                    </div>

                    <div class="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
                        <p class="text-sm text-yellow-800 text-center">
                            💡 合成后，3张${config.from === 'common' ? '普通' : config.from === 'rare' ? '稀有' : '史诗'}卡片将被消耗
                        </p>
                    </div>

                    <div class="flex gap-3">
                        <button onclick="this.closest('.fixed').remove()" 
                                class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition">
                            取消
                        </button>
                        <button onclick="CardModule.doCompose('${targetRarity}'); this.closest('.fixed').remove();" 
                                class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition">
                            确认合成
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
        } catch (e) {
            console.error('显示合成界面失败:', e);
        }
    },

    async doCompose(targetRarity) {
        try {
            const response = await Utils.apiRequest(`/cards/compose?user_id=${AppState.userId}&target_rarity=${targetRarity}`, {
                method: 'POST'
            });

            if (response.success) {
                Utils.showToast(`🎉 合成成功！获得${response.card.rarity_info.name}卡片！`);
                if (response.card.rarity === 'legendary') {
                    QuizModule.triggerCelebration && QuizModule.triggerCelebration();
                }
                // 重新渲染卡片页面
                await this.render();
            } else {
                Utils.showToast(response.message || '合成失败');
            }
        } catch (e) {
            console.error('合成失败:', e);
            Utils.showToast('合成失败，请重试');
        }
    }
};

/***********************
 * 刮刮卡/开宝箱模块
 ***********************/
const ScratchCardModule = {
    async show() {
        await this.openBox();
    },

    async openBox() {
        try {
            const response = await Utils.apiRequest(`/cards/open-box?user_id=${AppState.userId}`, {
                method: 'POST'
            });

            if (!response.success) {
                Utils.showToast('开箱失败');
                return;
            }

            this.showBoxAnimation(response.card);
        } catch (e) {
            console.error('开箱失败:', e);
        }
    },

    showBoxAnimation(card) {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
        
        // 宝箱动画HTML
        overlay.innerHTML = `
            <div class="text-center" id="boxContainer">
                <!-- 阶段1：宝箱晃动 -->
                <div id="boxPhase1" class="animate-shake">
                    <div class="text-9xl mb-4">🎁</div>
                    <p class="text-white text-xl">点击打开宝箱</p>
                </div>
                
                <!-- 阶段2：打开动画（隐藏） -->
                <div id="boxPhase2" class="hidden">
                    <div class="text-9xl mb-4 animate-bounce-in">✨</div>
                    <p class="text-white text-xl">恭喜获得...</p>
                </div>
                
                <!-- 阶段3：显示卡片（隐藏） -->
                <div id="boxPhase3" class="hidden">
                    <div class="bg-white rounded-3xl p-8 max-w-sm mx-4 animate-card-reveal"
                         style="border: 4px solid ${card.rarity_info.color}; box-shadow: ${card.rarity_info.glow}">
                        <div class="text-7xl mb-4">${CardModule.getCardEmoji(card.sector)}</div>
                        <h2 class="text-2xl font-bold text-gray-800">${card.stock_name}</h2>
                        <p class="text-gray-500 mb-4">${card.stock_code}</p>
                        <div class="inline-block px-4 py-2 rounded-full font-bold"
                             style="background: ${card.rarity_info.color}20; color: ${card.rarity_info.color}">
                            ${card.rarity_info.name}卡片
                        </div>
                        ${card.is_new ? '<p class="mt-4 text-green-500 font-bold">🆕 新卡片！</p>' : '<p class="mt-4 text-gray-400">已拥有</p>'}
                        <button onclick="this.closest('.fixed').remove(); CardModule.show();" 
                                class="mt-6 w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold">
                            查看图鉴
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 点击触发动画
        const phase1 = overlay.querySelector('#boxPhase1');
        const phase2 = overlay.querySelector('#boxPhase2');
        const phase3 = overlay.querySelector('#boxPhase3');
        
        phase1.onclick = () => {
            phase1.classList.add('hidden');
            phase2.classList.remove('hidden');
            
            // 播放开箱音效（可选）
            this.playOpenSound();
            
            // 根据稀有度触发不同特效
            if (card.rarity === 'legendary') {
                this.triggerLegendaryEffect();
            } else if (card.rarity === 'epic') {
                this.triggerEpicEffect();
            }
            
            setTimeout(() => {
                phase2.classList.add('hidden');
                phase3.classList.remove('hidden');
            }, 1500);
        };
    },

    playOpenSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(523, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1047, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {}
    },

    triggerLegendaryEffect() {
        // 金色粒子爆炸
        for (let i = 0; i < 100; i++) {
            const particle = document.createElement('div');
            particle.className = 'fixed w-3 h-3 rounded-full z-50';
            particle.style.background = 'linear-gradient(135deg, #f59e0b, #fbbf24)';
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.boxShadow = '0 0 10px #f59e0b';
            
            const angle = (i / 100) * Math.PI * 2;
            const distance = 100 + Math.random() * 200;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.animate([
                { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
                { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(1)`, opacity: 0 }
            ], {
                duration: 1000 + Math.random() * 500,
                easing: 'cubic-bezier(0, 0.5, 0.5, 1)'
            });
            
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 1500);
        }
    },

    triggerEpicEffect() {
        // 紫色光环
        const ring = document.createElement('div');
        ring.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40';
        ring.style.width = '0';
        ring.style.height = '0';
        ring.style.borderRadius = '50%';
        ring.style.border = '4px solid #8b5cf6';
        ring.style.boxShadow = '0 0 30px #8b5cf6';
        
        ring.animate([
            { width: '0', height: '0', opacity: 1 },
            { width: '400px', height: '400px', opacity: 0 }
        ], {
            duration: 800,
            easing: 'ease-out'
        });
        
        document.body.appendChild(ring);
        setTimeout(() => ring.remove(), 800);
    }
};

/***********************
 * 吉祥物模块
 ***********************/
const MascotModule = {
    mascotData: null,

    async init() {
        try {
            const response = await Utils.apiRequest(`/mascot/status?user_id=${AppState.userId}`);
            if (response.success) {
                this.mascotData = response.mascot;
                this.updateFloating();
            }
        } catch (e) {
            console.error('加载吉祥物失败:', e);
        }
    },

    updateFloating() {
        const float = document.getElementById('mascotFloat');
        if (!float || !this.mascotData) return;

        float.classList.remove('hidden');
        document.getElementById('mascotIcon').textContent = this.mascotData.icon;
        document.getElementById('mascotName').textContent = this.mascotData.name;
        
        const messages = [
            "今天也要好好学习哦～",
            "答对题目我会很开心的！",
            "快来和我玩吧～",
            "连续签到可以让我成长！"
        ];
        document.getElementById('mascotMessage').textContent = messages[Math.floor(Math.random() * messages.length)];
        
        const expProgress = (this.mascotData.exp / this.mascotData.exp_to_next) * 100;
        document.getElementById('mascotExpBar').style.width = Math.min(expProgress, 100) + '%';

        // 点击打开详情
        float.onclick = () => this.show();
    },

    async show() {
        Utils.showPage('mascot-page');
        await this.render();
    },

    async render() {
        const container = document.getElementById('mascotContainer');
        if (!container) return;

        try {
            const response = await Utils.apiRequest(`/mascot/status?user_id=${AppState.userId}`);
            if (!response.success) return;

            const { mascot, messages } = response;
            this.mascotData = mascot;

            container.innerHTML = `
                <div class="text-center mb-8">
                    <h1 class="text-4xl font-bold text-gray-800 mb-4">
                        <span class="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                            🐣 我的学习伙伴
                        </span>
                    </h1>
                </div>

                <!-- 吉祥物展示 -->
                <div class="bg-gradient-to-br from-pink-100 to-rose-100 rounded-3xl shadow-xl p-8 mb-6 text-center">
                    <div class="text-9xl mb-4 animate-bounce-slow" id="mascotDisplay">${mascot.icon}</div>
                    <h2 class="text-3xl font-bold text-gray-800 mb-2">${mascot.name}</h2>
                    <p class="text-lg text-pink-600 font-medium">Lv.${mascot.level}</p>
                    
                    <!-- 经验条 -->
                    <div class="max-w-xs mx-auto mt-6">
                        <div class="flex justify-between text-sm text-gray-600 mb-1">
                            <span>经验值</span>
                            <span>${mascot.exp} / ${mascot.exp_to_next}</span>
                        </div>
                        <div class="w-full bg-white rounded-full h-4 shadow-inner">
                            <div class="bg-gradient-to-r from-pink-400 to-rose-500 h-4 rounded-full transition-all duration-500" 
                                 style="width: ${Math.min(mascot.exp / mascot.exp_to_next * 100, 100)}%"></div>
                        </div>
                    </div>

                    ${mascot.can_evolve ? `
                        <button onclick="MascotModule.evolve()" 
                                class="mt-6 px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl font-bold text-lg shadow-lg animate-pulse">
                            ✨ 进化为 ${mascot.next_stage_icon}
                        </button>
                    ` : ''}
                </div>

                <!-- 吉祥物对话 -->
                <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <div class="flex items-start gap-4">
                        <div class="text-4xl">${mascot.icon}</div>
                        <div class="flex-1 bg-gray-100 rounded-2xl p-4">
                            <p class="text-gray-700" id="mascotSpeech">${messages[0]}</p>
                        </div>
                    </div>
                </div>

                <!-- 喂养/互动 -->
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <button onclick="MascotModule.interact('pet')" 
                            class="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transform hover:scale-105 transition-all">
                        <div class="text-4xl mb-2">🤗</div>
                        <p class="font-bold text-gray-700">摸摸头</p>
                    </button>
                    <button onclick="MascotModule.interact('play')" 
                            class="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transform hover:scale-105 transition-all">
                        <div class="text-4xl mb-2">🎮</div>
                        <p class="font-bold text-gray-700">玩游戏</p>
                    </button>
                </div>

                <!-- 成长说明 -->
                <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">🌟 成长之路</h3>
                    <div class="flex items-center justify-between">
                        <div class="text-center">
                            <div class="text-4xl mb-2">🥚</div>
                            <p class="text-xs text-gray-500">神秘蛋</p>
                        </div>
                        <div class="text-gray-300">→</div>
                        <div class="text-center">
                            <div class="text-4xl mb-2">🐣</div>
                            <p class="text-xs text-gray-500">小财宝</p>
                        </div>
                        <div class="text-gray-300">→</div>
                        <div class="text-center">
                            <div class="text-4xl mb-2">🐥</div>
                            <p class="text-xs text-gray-500">财宝宝</p>
                        </div>
                        <div class="text-gray-300">→</div>
                        <div class="text-center">
                            <div class="text-4xl mb-2">🦆</div>
                            <p class="text-xs text-gray-500">小财神</p>
                        </div>
                        <div class="text-gray-300">→</div>
                        <div class="text-center">
                            <div class="text-4xl mb-2">🦚</div>
                            <p class="text-xs text-gray-500">金凤凰</p>
                        </div>
                    </div>
                </div>

                <!-- 返回按钮 -->
                <button onclick="GameCenter.show()" 
                        class="w-full px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-bold text-lg">
                    <i class="fas fa-arrow-left mr-2"></i>返回游戏中心
                </button>
            `;
        } catch (e) {
            console.error('加载吉祥物失败:', e);
        }
    },

    async feed(amount = 10) {
        try {
            const response = await Utils.apiRequest(`/mascot/feed?user_id=${AppState.userId}&exp_amount=${amount}`, {
                method: 'POST'
            });

            if (response.success) {
                this.mascotData = { ...this.mascotData, exp: response.current_exp };
                
                if (response.evolved) {
                    this.showEvolutionAnimation(response.stage_icon);
                }
                
                this.updateFloating();
            }
        } catch (e) {
            console.error('喂养失败:', e);
        }
    },

    interact(type) {
        const display = document.getElementById('mascotDisplay');
        const speech = document.getElementById('mascotSpeech');
        
        if (type === 'pet') {
            display.classList.add('animate-wiggle');
            speech.textContent = '好舒服呀～开心！';
            setTimeout(() => display.classList.remove('animate-wiggle'), 1000);
        } else if (type === 'play') {
            display.classList.add('animate-jump');
            speech.textContent = '太好玩啦！再来再来！';
            setTimeout(() => display.classList.remove('animate-jump'), 1000);
        }
        
        // 增加经验
        this.feed(5);
    },

    showEvolutionAnimation(newIcon) {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
        overlay.innerHTML = `
            <div class="text-center animate-evolution">
                <div class="text-9xl mb-4">${newIcon}</div>
                <h2 class="text-3xl font-bold text-white mb-2">🎉 进化成功！</h2>
                <p class="text-xl text-yellow-400">你的伙伴更强大了！</p>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // 金色粒子
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'fixed w-2 h-2 bg-yellow-400 rounded-full z-50';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.animate([
                { transform: 'scale(0)', opacity: 1 },
                { transform: 'scale(2)', opacity: 0 }
            ], {
                duration: 1000 + Math.random() * 500,
                delay: Math.random() * 500
            });
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 1500);
        }
        
        setTimeout(() => overlay.remove(), 3000);
    }
};

/***********************
 * 限时挑战模块
 ***********************/
const ChallengeModule = {
    questions: [],
    currentIndex: 0,
    answers: {},
    timeLeft: 60,
    timer: null,

    async show() {
        Utils.showPage('challenge-page');
        this.showStart();
    },

    showStart() {
        const container = document.getElementById('challengeContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center">
                <div class="bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl shadow-2xl p-12 text-white mb-6">
                    <div class="text-9xl mb-6">⏱️</div>
                    <h1 class="text-4xl font-bold mb-4">限时挑战</h1>
                    <p class="text-xl opacity-90 mb-2">60秒内完成5道题</p>
                    <p class="text-lg opacity-80">答对越多，积分越高！</p>
                </div>

                <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">🏆 挑战规则</h3>
                    <ul class="text-left text-gray-600 space-y-2">
                        <li>• 每道题答对 +20 积分</li>
                        <li>• 满分额外奖励 +100 积分</li>
                        <li>• 时间结束自动提交</li>
                    </ul>
                </div>

                <button onclick="ChallengeModule.start()" 
                        class="w-full px-8 py-6 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl font-bold text-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                    🚀 开始挑战
                </button>

                <button onclick="GameCenter.show()" 
                        class="w-full mt-4 px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-bold text-lg">
                    返回游戏中心
                </button>
            </div>
        `;
    },

    async start() {
        try {
            const response = await Utils.apiRequest(`/challenge/start?user_id=${AppState.userId}`);
            if (!response.success) return;

            this.questions = response.challenge.questions;
            this.currentIndex = 0;
            this.answers = {};
            this.timeLeft = 60;
            
            this.renderQuestion();
            this.startTimer();
        } catch (e) {
            console.error('开始挑战失败:', e);
        }
    },

    renderQuestion() {
        const container = document.getElementById('challengeContainer');
        if (!container) return;

        const question = this.questions[this.currentIndex];

        container.innerHTML = `
            <!-- 顶部状态栏 -->
            <div class="bg-white rounded-2xl shadow-xl p-4 mb-6">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">📝</span>
                        <span class="font-bold text-gray-800">${this.currentIndex + 1} / ${this.questions.length}</span>
                    </div>
                    <div class="flex items-center gap-2 bg-red-100 px-4 py-2 rounded-full">
                        <span class="text-2xl">⏱️</span>
                        <span id="timerDisplay" class="font-bold text-red-600 text-xl">${this.timeLeft}s</span>
                    </div>
                </div>
                <!-- 进度条 -->
                <div class="mt-4 w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-gradient-to-r from-red-500 to-rose-600 h-2 rounded-full transition-all duration-300" 
                         style="width: ${(this.currentIndex / this.questions.length) * 100}%"></div>
                </div>
            </div>

            <!-- 问题卡片 -->
            <div class="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-8">${question.question}</h2>
                <div class="space-y-4">
                    ${question.options.map((opt, i) => `
                        <button onclick="ChallengeModule.selectAnswer(${question.id}, ${i})" 
                                class="w-full p-5 text-left rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all text-lg font-medium text-gray-700">
                            <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-600 mr-3">${String.fromCharCode(65 + i)}</span>
                            ${opt}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    },

    selectAnswer(questionId, answerIndex) {
        this.answers[questionId] = answerIndex;
        
        if (this.currentIndex < this.questions.length - 1) {
            this.currentIndex++;
            this.renderQuestion();
        } else {
            this.submit();
        }
    },

    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            const display = document.getElementById('timerDisplay');
            if (display) {
                display.textContent = this.timeLeft + 's';
                if (this.timeLeft <= 10) {
                    display.classList.add('animate-pulse', 'text-2xl');
                }
            }
            
            if (this.timeLeft <= 0) {
                this.submit();
            }
        }, 1000);
    },

    async submit() {
        clearInterval(this.timer);
        
        try {
            const response = await Utils.apiRequest('/challenge/submit?user_id=' + AppState.userId, {
                method: 'POST',
                body: JSON.stringify({ answers: this.answers })
            });

            if (response.success) {
                AppState.points += response.points_earned;
                this.showResult(response);
            }
        } catch (e) {
            console.error('提交失败:', e);
        }
    },

    showResult(result) {
        const container = document.getElementById('challengeContainer');
        if (!container) return;

        const grade = result.score >= 80 ? 'S' : result.score >= 60 ? 'A' : result.score >= 40 ? 'B' : 'C';
        const gradeColors = { S: 'from-yellow-400 to-orange-500', A: 'from-green-400 to-emerald-500', B: 'from-blue-400 to-cyan-500', C: 'from-gray-400 to-gray-500' };

        container.innerHTML = `
            <div class="text-center">
                <div class="bg-gradient-to-br ${gradeColors[grade]} rounded-3xl shadow-2xl p-12 text-white mb-6">
                    <div class="text-9xl font-bold mb-4">${grade}</div>
                    <h2 class="text-3xl font-bold mb-2">${result.is_perfect ? '🎉 满分通关！' : '挑战完成！'}</h2>
                    <p class="text-xl opacity-90">得分: ${result.score}分</p>
                </div>

                <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <div class="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p class="text-3xl font-bold text-green-500">${result.correct_count}</p>
                            <p class="text-gray-600">答对</p>
                        </div>
                        <div>
                            <p class="text-3xl font-bold text-red-500">${result.total_count - result.correct_count}</p>
                            <p class="text-gray-600">答错</p>
                        </div>
                        <div>
                            <p class="text-3xl font-bold text-purple-500">+${result.points_earned}</p>
                            <p class="text-gray-600">积分</p>
                        </div>
                    </div>
                </div>

                <div class="flex gap-4">
                    <button onclick="ChallengeModule.start()" 
                            class="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold hover:shadow-lg transition">
                        🔄 再来一局
                    </button>
                    <button onclick="GameCenter.show()" 
                            class="flex-1 px-6 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition">
                        返回
                    </button>
                </div>
            </div>
        `;

        if (result.is_perfect) {
            CheckinModule.triggerConfetti();
        }
    }
};

/***********************
 * 🗺️ 学习地图模块 - 多邻国风格
 ***********************/
const LearningMapModule = {
    learningMap: null,

    async generateAndShow() {
        // 获取用户右滑（喜欢）的股票
        const likedStocks = AppState.rightSwipedStocks.map(s => s.name);
        
        if (likedStocks.length === 0) {
            Utils.showToast('请先选择感兴趣的股票！');
            return;
        }

        try {
            // 生成学习地图 - 使用正确的API格式
            const url = `/api/learning-map/generate?user_id=${AppState.userId}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(likedStocks)
            });

            const data = await response.json();
            
            if (data && data.success) {
                this.learningMap = data.learning_map;
                this.show();
            } else {
                Utils.showToast(data?.message || '生成学习地图失败，请重试');
            }
        } catch (e) {
            console.error('生成学习地图失败:', e);
            Utils.showToast('生成学习地图失败: ' + (e.message || '未知错误'));
        }
    },

    async show() {
        // 如果没有地图数据，尝试获取
        if (!this.learningMap) {
            try {
                const response = await Utils.apiRequest('/learning-map/status?user_id=' + AppState.userId);
                if (response.success) {
                    this.learningMap = response.learning_map;
                } else {
                    Utils.showToast(response.message || '请先生成学习地图');
                    return;
                }
            } catch (e) {
                console.error('获取学习地图失败:', e);
                return;
            }
        }

        Utils.showPage('learning-map-page');
        this.render();
    },

    render() {
        const container = document.getElementById('learningMapContainer');
        if (!container || !this.learningMap) return;

        const path = this.learningMap.path;
        const completedCount = this.learningMap.completed_stocks;
        const totalCount = this.learningMap.total_stocks;

        container.innerHTML = `
            <!-- 头部信息 -->
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold mb-4">
                    <span class="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                        🗺️ 我的学习地图
                    </span>
                </h1>
                <p class="text-gray-600 text-lg mb-4">跟随地图，每天学习一只股票</p>
                
                <!-- 进度统计 -->
                <div class="inline-flex items-center gap-6 bg-white rounded-2xl shadow-lg px-8 py-4">
                    <div class="text-center">
                        <p class="text-3xl font-bold text-green-500">${completedCount}</p>
                        <p class="text-sm text-gray-500">已完成</p>
                    </div>
                    <div class="w-px h-12 bg-gray-200"></div>
                    <div class="text-center">
                        <p class="text-3xl font-bold text-gray-400">${totalCount - completedCount}</p>
                        <p class="text-sm text-gray-500">待学习</p>
                    </div>
                    <div class="w-px h-12 bg-gray-200"></div>
                    <div class="text-center">
                        <p class="text-3xl font-bold text-yellow-500">⭐ ${this.learningMap.total_stars || 0}</p>
                        <p class="text-sm text-gray-500">总星数</p>
                    </div>
                    <div class="w-px h-12 bg-gray-200"></div>
                    <div class="text-center">
                        <p class="text-3xl font-bold text-purple-500">${Math.round(completedCount / totalCount * 100)}%</p>
                        <p class="text-sm text-gray-500">完成率</p>
                    </div>
                </div>
            </div>

            <!-- 学习地图路径 -->
            <div class="relative py-8">
                ${this.renderPath(path)}
            </div>

            <!-- 返回按钮 -->
            <div class="flex justify-center gap-4 mt-8">
                <button onclick="ReportModule.generateReport()" 
                        class="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-bold text-lg">
                    <i class="fas fa-arrow-left mr-2"></i>返回投资画像
                </button>
                <button onclick="GameCenter.show()" 
                        class="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-bold text-lg">
                    <i class="fas fa-gamepad mr-2"></i>游戏中心
                </button>
            </div>
        `;
    },

    renderPath(path) {
        // 生成类似多邻国的横向滚动地图
        let html = `
            <div class="learning-map-container" style="overflow-x: auto; overflow-y: hidden; padding: 40px 20px; -webkit-overflow-scrolling: touch;">
                <div class="learning-path-horizontal" style="display: flex; align-items: center; gap: 40px; min-width: fit-content; padding: 20px 0;">
        `;
        
        path.forEach((node, index) => {
            const statusClass = this.getStatusClass(node.status);
            const statusIcon = this.getStatusIcon(node.status);
            const sectorColor = this.getSectorColor(node.sector);
            const isCompleted = node.status === 'completed';
            const isLocked = node.status === 'locked';
            const isCurrent = node.status === 'current' || node.is_today;
            
            html += `
                <!-- 连接路径 -->
                ${index > 0 ? `
                    <div class="path-connector-horizontal" style="
                        width: 80px;
                        height: 4px;
                        background: ${isLocked ? 'linear-gradient(to right, #CBD5E1, #E2E8F0)' : 'linear-gradient(to right, #10B981, #34D399)'};
                        border-radius: 2px;
                        position: relative;
                        ${isLocked ? 'opacity: 0.4;' : ''}
                    ">
                        ${!isLocked ? `
                            <div style="
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                width: 12px;
                                height: 12px;
                                background: #10B981;
                                border-radius: 50%;
                                box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
                                animation: pathPulse 2s ease-in-out infinite;
                            "></div>
                        ` : ''}
                    </div>
                ` : ''}
                
                <!-- 节点卡片 -->
                <div class="path-node-horizontal ${statusClass}" 
                     onclick="${!isLocked ? `LearningMapModule.selectNode(${index})` : ''}"
                     style="
                         position: relative;
                         min-width: 180px;
                         padding: 20px;
                         background: ${isCompleted ? 'linear-gradient(135deg, #FEF3C7, #FDE68A)' : isCurrent ? 'linear-gradient(135deg, #DBEAFE, #BFDBFE)' : isLocked ? 'linear-gradient(135deg, #F3F4F6, #E5E7EB)' : 'linear-gradient(135deg, #ECFDF5, #D1FAE5)'};
                         border-radius: 20px;
                         border: 3px solid ${isCompleted ? '#F59E0B' : isCurrent ? '#3B82F6' : isLocked ? '#9CA3AF' : '#10B981'};
                         box-shadow: ${isCurrent ? '0 8px 24px rgba(59, 130, 246, 0.3)' : isCompleted ? '0 8px 24px rgba(245, 158, 11, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)'};
                         cursor: ${isLocked ? 'not-allowed' : 'pointer'};
                         transition: all 0.3s ease;
                         transform: ${isCurrent ? 'scale(1.05)' : 'scale(1)'};
                         ${isLocked ? 'opacity: 0.6;' : ''}
                     "
                     onmouseover="${!isLocked ? "this.style.transform='scale(1.08)'; this.style.boxShadow='0 12px 32px rgba(0,0,0,0.15)';" : ''}"
                     onmouseout="${!isLocked ? "this.style.transform='" + (isCurrent ? 'scale(1.05)' : 'scale(1)') + "';" : ''}">
                    
                    <!-- 今日标记 -->
                    ${isCurrent ? `
                        <div style="
                            position: absolute;
                            top: -12px;
                            left: 50%;
                            transform: translateX(-50%);
                            background: linear-gradient(135deg, #F97316, #EF4444);
                            color: white;
                            font-size: 11px;
                            font-weight: bold;
                            padding: 4px 12px;
                            border-radius: 12px;
                            box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
                            animation: bounce 1s ease-in-out infinite;
                            z-index: 10;
                        ">
                            📍 今日任务
                        </div>
                    ` : ''}
                    
                    <!-- 节点编号 -->
                    <div style="
                        position: absolute;
                        top: -8px;
                        left: -8px;
                        width: 32px;
                        height: 32px;
                        background: ${isCompleted ? '#F59E0B' : isCurrent ? '#3B82F6' : isLocked ? '#9CA3AF' : '#10B981'};
                        color: white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 14px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    ">
                        ${node.order}
                    </div>
                    
                    <!-- 状态图标 -->
                    <div style="
                        text-align: center;
                        font-size: 48px;
                        margin-bottom: 12px;
                        filter: ${isLocked ? 'grayscale(100%)' : 'none'};
                    ">
                        ${statusIcon}
                    </div>
                    
                    <!-- 股票信息 -->
                    <div style="text-align: center;">
                        <h3 style="
                            font-size: 18px;
                            font-weight: bold;
                            color: ${isLocked ? '#9CA3AF' : '#1F2937'};
                            margin-bottom: 4px;
                        ">${node.stock_name}</h3>
                        <p style="
                            font-size: 12px;
                            color: ${isLocked ? '#D1D5DB' : '#6B7280'};
                            margin-bottom: 8px;
                        ">${node.stock_code}</p>
                        <span style="
                            display: inline-block;
                            padding: 4px 12px;
                            background: ${isLocked ? '#E5E7EB' : '#DBEAFE'};
                            color: ${isLocked ? '#9CA3AF' : '#1E40AF'};
                            border-radius: 12px;
                            font-size: 11px;
                            font-weight: 600;
                        ">${node.sector}</span>
                    </div>
                    
                    <!-- 进度/星级显示 -->
                    ${isCompleted ? `
                        <!-- 已完成：显示星级 -->
                        <div style="
                            margin-top: 16px;
                            padding: 12px;
                            background: linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.15));
                            border-radius: 12px;
                            border: 2px solid rgba(251,191,36,0.4);
                        ">
                            <div style="text-align: center; font-size: 11px; color: #92400E; margin-bottom: 6px; font-weight: 600;">
                                ⭐ 通关评价
                            </div>
                            <div style="display: flex; justify-content: center; gap: 8px;">
                                ${[0,1,2].map(i => i < (node.stars || 0) ? 
                                    `<span style="font-size: 24px; filter: drop-shadow(0 0 6px rgba(251,191,36,0.8)); animation: starGlow 2s ease-in-out infinite; animation-delay: ${i*0.15}s;">⭐</span>` : 
                                    `<span style="font-size: 22px; color: #9CA3AF; opacity: 0.5;">☆</span>`
                                ).join('')}
                            </div>
                        </div>
                    ` : !isLocked ? `
                        <!-- 进行中：显示进度条 -->
                        <div style="margin-top: 16px;">
                            <div style="
                                width: 100%;
                                height: 6px;
                                background: #E5E7EB;
                                border-radius: 3px;
                                overflow: hidden;
                            ">
                                <div style="
                                    width: ${node.progress}%;
                                    height: 100%;
                                    background: linear-gradient(90deg, #10B981, #34D399);
                                    border-radius: 3px;
                                    transition: width 0.5s ease;
                                "></div>
                            </div>
                            <p style="text-align: center; font-size: 12px; color: #6B7280; margin-top: 4px;">
                                ${node.progress}% 完成
                            </p>
                        </div>
                    ` : `
                        <!-- 锁定：显示锁定提示 -->
                        <div style="
                            margin-top: 16px;
                            text-align: center;
                            color: #9CA3AF;
                            font-size: 12px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 4px;
                        ">
                            <i class="fas fa-lock"></i>
                            <span>完成前一个解锁</span>
                        </div>
                    `}
                </div>
            `;
        });

        html += `
                </div>
            </div>
            
            <style>
                @keyframes pathPulse {
                    0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.2); }
                }
                @keyframes starGlow {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                .learning-map-container::-webkit-scrollbar {
                    height: 8px;
                }
                .learning-map-container::-webkit-scrollbar-track {
                    background: #F3F4F6;
                    border-radius: 4px;
                }
                .learning-map-container::-webkit-scrollbar-thumb {
                    background: #10B981;
                    border-radius: 4px;
                }
                .learning-map-container::-webkit-scrollbar-thumb:hover {
                    background: #059669;
                }
            </style>
        `;
        
        return html;
    },

    // 渲染星星（消消乐风格）
    renderStars(count) {
        let html = '<div class="stars-container" style="display:flex;justify-content:center;gap:8px;">';
        for (let i = 0; i < 3; i++) {
            if (i < count) {
                html += `<span class="star star-earned" style="font-size:24px;animation-delay:${i * 0.15}s;display:inline-block;">⭐</span>`;
            } else {
                html += `<span class="star star-empty" style="font-size:22px;color:#9CA3AF;display:inline-block;">☆</span>`;
            }
        }
        html += '</div>';
        return html;
    },

    getStatusClass(status) {
        const classes = {
            'completed': 'node-completed',
            'current': 'node-current',
            'unlocked': 'node-unlocked',
            'locked': 'node-locked'
        };
        return classes[status] || 'node-locked';
    },

    getStatusIcon(status) {
        const icons = {
            'completed': '✅',
            'current': '🔥',
            'unlocked': '📖',
            'locked': '🔒'
        };
        return icons[status] || '🔒';
    },

    getSectorColor(sector) {
        const colors = {
            '消费': 'sector-consumer',
            '科技': 'sector-tech',
            '金融': 'sector-finance',
            '新能源': 'sector-energy',
            '医药': 'sector-health',
            '化工': 'sector-chemical',
            '公用事业': 'sector-utility'
        };
        return colors[sector] || 'sector-default';
    },

    selectNode(index) {
        const node = this.learningMap.path[index];
        
        if (node.status === 'locked') {
            Utils.showToast('🔒 请先完成前面的学习');
            return;
        }

        // 构造股票对象
        const stock = {
            id: node.stock_id,
            name: node.stock_name,
            code: node.stock_code,
            sector: node.sector,
            desc: node.desc
        };

        // 开始学习
        LevelModule.startLevelLearning(stock);
    },

    // 更新节点进度
    async updateProgress(stockName, level) {
        try {
            await Utils.apiRequest('/learning-map/update-progress?user_id=' + AppState.userId + '&stock_name=' + encodeURIComponent(stockName) + '&level=' + level, {
                method: 'POST'
            });
        } catch (e) {
            console.error('更新进度失败:', e);
        }
    },

    // 完成股票学习
    // 完成股票学习（带星级）
    async completeStock(stockName, stars = 0) {
        try {
            const response = await Utils.apiRequest('/learning-map/complete-stock?user_id=' + AppState.userId + '&stock_name=' + encodeURIComponent(stockName) + '&stars=' + stars, {
                method: 'POST'
            });

            if (response.success) {
                this.learningMap = response.learning_map;
                
                // 根据星级显示不同的庆祝效果
                if (stars === 3) {
                    // 三星：超级庆祝
                    this.showStarCelebration(3);
                    CheckinModule.triggerConfetti();
                    setTimeout(() => CheckinModule.triggerConfetti(), 500);
                } else if (stars >= 1) {
                    // 1-2星：普通庆祝
                    this.showStarCelebration(stars);
                    CheckinModule.triggerConfetti();
                }
                
                Utils.showToast(response.message);
            }
        } catch (e) {
            console.error('完成股票学习失败:', e);
        }
    },

    // 显示星星庆祝动画
    showStarCelebration(stars) {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 flex items-center justify-center z-50 pointer-events-none';
        overlay.innerHTML = `
            <div class="star-celebration">
                ${[...Array(3)].map((_, i) => `
                    <span class="celebration-star ${i < stars ? 'star-active' : 'star-inactive'}" style="animation-delay: ${i * 0.2}s">
                        ${i < stars ? '⭐' : '☆'}
                    </span>
                `).join('')}
            </div>
        `;
        document.body.appendChild(overlay);
        
        setTimeout(() => overlay.remove(), 2500);
    }
};

/***********************
 * 🚀 3分钟快速学习模块
 * 热点事件驱动 + 情景模拟
 ***********************/
const QuickLearnModule = {
    // 当前状态
    currentHotTopic: null,
    currentStep: 0,
    currentQuestionIndex: 0,
    correctCount: 0,
    totalTime: 180, // 3分钟
    timerInterval: null,
    knowledgeCards: [],

    // 🔥 今日热点事件数据
    hotTopics: [
        {
            id: 'ai_chip',
            emoji: '🤖',
            title: 'AI芯片大战',
            subtitle: '英伟达vs华为：谁能制霸AI时代？',
            image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
            color: 'from-cyan-500 to-blue-600',
            bgColor: 'from-cyan-50 to-blue-50',
            stock: { name: '中芯国际', code: '688981' },
            intro: '最近，AI芯片成为全球科技竞争的焦点。英伟达股价一路飙升，而中国企业也在奋起直追...',
            scenario: {
                role: '你是一位科技基金经理',
                situation: '刚收到消息：国产AI芯片取得重大突破，性能接近国际先进水平。你的基金持有相关股票...',
            },
            questions: [
                {
                    id: 1,
                    situation: '📱 你的手机震动了！新闻推送：「国产AI芯片性能突破，订单暴增300%」',
                    question: '作为基金经理，你的第一反应是？',
                    options: [
                        { text: '🚀 立即加仓！这是重大利好', value: 'A', feedback: '冲动了！好消息公布时往往已被提前消化' },
                        { text: '🔍 先核实消息来源和细节', value: 'B', feedback: '聪明！投资第一步永远是验证信息真实性', correct: true },
                        { text: '😴 等等看，不急着行动', value: 'C', feedback: '谨慎有余，但可能错失良机' }
                    ],
                    knowledge: '💡 **信息验证原则**：任何投资决策前，先验证信息的真实性和时效性。市场上80%的"内幕消息"都是假的或过时的。'
                },
                {
                    id: 2,
                    situation: '📊 你查看了数据：这家芯片公司市盈率高达200倍，但营收增速确实有150%',
                    question: '面对"高估值+高增长"，你如何判断？',
                    options: [
                        { text: '📈 高增长值得高估值，继续看好', value: 'A', feedback: '需要注意：高增长能否持续是关键' },
                        { text: '⚖️ 用PEG指标来判断是否合理', value: 'B', feedback: '专业！PEG=PE÷增长率，小于1可能被低估', correct: true },
                        { text: '🚫 200倍太贵了，坚决不买', value: 'C', feedback: '不能只看PE，成长股需要看增速' }
                    ],
                    knowledge: '💡 **PEG估值法**：PEG = 市盈率 ÷ 盈利增长率。PEG < 1 表示可能被低估，PEG > 2 表示可能高估。这是评估成长股的利器！'
                },
                {
                    id: 3,
                    situation: '🎯 你决定买入！但该买多少仓位呢？你的基金规模是10亿元',
                    question: '对于这种高波动的科技股，合理仓位是？',
                    options: [
                        { text: '💰 30%以上，看好就要重仓', value: 'A', feedback: '风险太大！单只股票不宜超过20%' },
                        { text: '📊 5%-10%，控制单票风险', value: 'B', feedback: '稳健！专业机构通常单票不超过10%', correct: true },
                        { text: '🎲 1%-2%，象征性买一点', value: 'C', feedback: '太保守了，即使涨50%对组合影响也很小' }
                    ],
                    knowledge: '💡 **仓位管理原则**：单只股票仓位建议5%-15%。高波动品种控制在10%以内。永远记住：仓位决定心态，心态决定成败！'
                }
            ],
            summaryCards: [
                { icon: '🔍', title: '信息验证', content: '投资前先验证消息真实性，80%的"内幕"都不靠谱' },
                { icon: '📊', title: 'PEG估值', content: 'PEG=PE÷增长率，小于1可能被低估，评估成长股必备' },
                { icon: '⚖️', title: '仓位控制', content: '单票5%-15%，高波动品种≤10%，仓位决定心态' }
            ]
        },
        {
            id: 'ev_price_war',
            emoji: '🚗',
            title: '新能源价格战',
            subtitle: '特斯拉vs比亚迪：卷到最后谁能活？',
            image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400',
            color: 'from-emerald-500 to-green-600',
            bgColor: 'from-emerald-50 to-green-50',
            stock: { name: '比亚迪', code: '002594' },
            intro: '新能源汽车价格战愈演愈烈！特斯拉带头降价，比亚迪紧随其后，整个行业利润承压...',
            scenario: {
                role: '你是一位汽车行业分析师',
                situation: '领导让你评估：价格战中，哪家车企能笑到最后？投资者该如何选择？',
            },
            questions: [
                {
                    id: 1,
                    situation: '📉 特斯拉宣布Model 3降价2万！股价应声下跌5%',
                    question: '价格战对行业意味着什么？',
                    options: [
                        { text: '😱 行业要完了，全部卖出', value: 'A', feedback: '过于悲观！价格战是行业整合的必经阶段' },
                        { text: '🏆 龙头受益，弱者出局', value: 'B', feedback: '正确！价格战最终利好有成本优势的龙头', correct: true },
                        { text: '🤷 影响有限，照常持有', value: 'C', feedback: '需要更深入分析不同公司的成本结构' }
                    ],
                    knowledge: '💡 **价格战逻辑**：短期伤害行业利润，但长期利好龙头。关键看谁的成本控制能力强、谁能扛到最后。行业出清后，龙头市占率反而提升！'
                },
                {
                    id: 2,
                    situation: '📋 你拿到数据：比亚迪毛利率20%，特斯拉18%，其他车企只有5-10%',
                    question: '这组数据说明什么？',
                    options: [
                        { text: '📊 比亚迪和特斯拉成本控制最好', value: 'A', feedback: '对了一半！毛利率高意味着降价空间大' },
                        { text: '💪 它们降价空间更大，能打持久战', value: 'B', feedback: '完全正确！高毛利率是价格战的"弹药"', correct: true },
                        { text: '🤔 说明它们定价太高了', value: 'C', feedback: '不准确，高毛利率反映的是成本优势' }
                    ],
                    knowledge: '💡 **毛利率的意义**：毛利率 = (收入-成本)/收入。高毛利率意味着：①成本控制好 ②有降价空间 ③价格战中更能扛。看财报时，毛利率是判断竞争力的核心指标！'
                },
                {
                    id: 3,
                    situation: '🔋 你发现：比亚迪自己生产电池，而其他车企要外购，电池占成本40%',
                    question: '这种"垂直整合"模式意味着什么？',
                    options: [
                        { text: '🏭 重资产运营，风险大', value: 'A', feedback: '传统观点，但在竞争激烈时，这反而是优势' },
                        { text: '🔗 产业链可控，成本更低', value: 'B', feedback: '正确！垂直整合在价格战中是护城河', correct: true },
                        { text: '📦 库存压力大，不灵活', value: 'C', feedback: '管理得当的话，自产反而更灵活' }
                    ],
                    knowledge: '💡 **垂直整合战略**：自己掌控核心零部件（如电池）的公司，在成本上有天然优势。比亚迪的"全产业链"模式，让它在价格战中游刃有余！'
                }
            ],
            summaryCards: [
                { icon: '🏆', title: '价格战规律', content: '短期伤利润，长期利龙头，关键看谁能扛到最后' },
                { icon: '📊', title: '毛利率指标', content: '毛利率高=成本控制好=降价空间大=竞争力强' },
                { icon: '🔗', title: '垂直整合', content: '掌控核心零部件的公司，在价格战中是降维打击' }
            ]
        },
        {
            id: 'maotai_dividend',
            emoji: '🍷',
            title: '茅台天价分红',
            subtitle: '年赚700亿全分掉？土豪式分红背后的逻辑',
            image: 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=400',
            color: 'from-amber-500 to-red-600',
            bgColor: 'from-amber-50 to-red-50',
            stock: { name: '贵州茅台', code: '600519' },
            intro: '茅台宣布史上最大分红！每股派息超200元，股息率创新高。这是送钱还是另有深意？',
            scenario: {
                role: '你是一位价值投资者',
                situation: '你持有茅台3年了，今天收到分红通知。朋友问你：为什么茅台要分这么多？该继续持有吗？',
            },
            questions: [
                {
                    id: 1,
                    situation: '💰 分红公告：每10股派200元！你持有100股，将收到2000元',
                    question: '为什么茅台要分这么多红利？',
                    options: [
                        { text: '🎁 公司太有钱，回馈股东', value: 'A', feedback: '表面原因，但不是最核心的' },
                        { text: '📉 没有好的投资项目，不如分掉', value: 'B', feedback: '深层原因！成熟企业增长放缓时，分红是最佳选择', correct: true },
                        { text: '📈 提振股价，吸引投资者', value: 'C', feedback: '有这个效果，但不是主因' }
                    ],
                    knowledge: '💡 **分红的本质**：当公司找不到比投资者自己更好的投资机会时，把钱分给股东是最明智的。茅台的高分红说明：①现金流充裕 ②增长趋于稳定 ③管理层诚实'
                },
                {
                    id: 2,
                    situation: '🧮 你算了一笔账：茅台股价1800元，每股分红20元，股息率约1.1%',
                    question: '1.1%的股息率，比银行存款还低，值得投资吗？',
                    options: [
                        { text: '❌ 不值得，还不如存银行', value: 'A', feedback: '只看股息率太片面了' },
                        { text: '✅ 值得！还要看分红增长率', value: 'B', feedback: '正确！茅台分红每年增长10%+，复利惊人', correct: true },
                        { text: '🤔 看情况，取决于股价涨跌', value: 'C', feedback: '股价短期不可测，分红增长更确定' }
                    ],
                    knowledge: '💡 **股息率陷阱**：不能只看当前股息率！茅台分红连续20年增长，如果10年前买入，按当时成本算股息率已超过20%。长期投资看的是"分红增长率"！'
                },
                {
                    id: 3,
                    situation: '📊 你查看财报：茅台ROE常年30%以上，而银行只有10%左右',
                    question: '这个ROE数据意味着什么？',
                    options: [
                        { text: '💰 茅台赚钱能力是银行的3倍', value: 'A', feedback: '字面意思对，但不够深入' },
                        { text: '🏆 茅台能用更少的钱赚更多的利润', value: 'B', feedback: '完全正确！ROE是衡量赚钱效率的核心指标', correct: true },
                        { text: '📈 茅台股价应该是银行的3倍', value: 'C', feedback: 'ROE不能直接换算成股价倍数' }
                    ],
                    knowledge: '💡 **ROE是什么**：净资产收益率 = 净利润/净资产。巴菲特说：长期来看，股票收益率会趋近于ROE。茅台ROE>30%意味着每投入100元，一年能赚30元。这就是"印钞机"！'
                }
            ],
            summaryCards: [
                { icon: '💰', title: '分红的意义', content: '高分红=现金流好+增长稳定+管理层诚实' },
                { icon: '📈', title: '股息增长率', content: '比当前股息率更重要的是分红能否持续增长' },
                { icon: '🏆', title: 'ROE指标', content: 'ROE=赚钱效率，巴菲特最爱的指标，>20%是优秀' }
            ]
        },
        {
            id: 'bank_crisis',
            emoji: '🏦',
            title: '银行股暴跌',
            subtitle: '净息差收窄，银行还能投吗？',
            image: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=400',
            color: 'from-blue-500 to-indigo-600',
            bgColor: 'from-blue-50 to-indigo-50',
            stock: { name: '招商银行', code: '600036' },
            intro: '银行股集体下跌！市场担忧利率下行、净息差收窄。但招行PE只有5倍，股息率超5%...',
            scenario: {
                role: '你是一位稳健型投资者',
                situation: '你的父母想买银行股养老，问你招商银行能不能买？5倍市盈率是不是很便宜？',
            },
            questions: [
                {
                    id: 1,
                    situation: '📉 招商银行PE只有5倍！而茅台是30倍，腾讯是20倍',
                    question: '5倍PE意味着银行很便宜吗？',
                    options: [
                        { text: '✅ 太便宜了，赶紧买', value: 'A', feedback: '不能只看PE，银行有特殊性' },
                        { text: '🏦 银行PE普遍低，要和同行比', value: 'B', feedback: '正确！不同行业估值体系不同', correct: true },
                        { text: '⚠️ 便宜没好货，肯定有问题', value: 'C', feedback: '过于悲观，低PE不一定是陷阱' }
                    ],
                    knowledge: '💡 **PE的行业差异**：不同行业的合理PE不同。银行普遍5-10倍，科技股20-50倍，消费股20-40倍。比较估值时，要和同行业比，不能跨行业！'
                },
                {
                    id: 2,
                    situation: '📊 你查到：招行股息率5.2%，而银行存款利率只有2%',
                    question: '买银行股收息，是不是比存银行更划算？',
                    options: [
                        { text: '✅ 当然！收益是存款的2.5倍', value: 'A', feedback: '要考虑股价波动风险' },
                        { text: '⚖️ 要综合考虑收益和风险', value: 'B', feedback: '正确！股票有波动，存款保本', correct: true },
                        { text: '❌ 股票风险大，还是存银行', value: 'C', feedback: '过于保守，低估了股息收益' }
                    ],
                    knowledge: '💡 **股息vs存款**：股息率高于存款，但股票有波动风险。适合养老的策略：分批买入，长期持有，靠股息生活，不在乎股价涨跌。这叫"股息投资法"！'
                },
                {
                    id: 3,
                    situation: '🔍 你对比发现：招行不良贷款率0.9%，而某小银行是2.5%',
                    question: '这个数据说明什么？',
                    options: [
                        { text: '📉 小银行风险更大', value: 'A', feedback: '对，但不够全面' },
                        { text: '🏆 招行资产质量更好，值得溢价', value: 'B', feedback: '正确！低不良率是银行最核心的竞争力', correct: true },
                        { text: '🤔 不良率会变化，意义不大', value: 'C', feedback: '不良率是银行最重要的指标之一' }
                    ],
                    knowledge: '💡 **不良贷款率**：是银行最核心的健康指标。低于1%是优秀，1-2%正常，>2%要警惕。招行的低不良率，说明它借出去的钱收得回来，这是银行的命根子！'
                }
            ],
            summaryCards: [
                { icon: '📊', title: 'PE行业差异', content: '不同行业估值不同，银行5-10倍正常，要和同行比' },
                { icon: '💰', title: '股息投资法', content: '高股息+长期持有+分批买入，适合稳健型投资者' },
                { icon: '🏦', title: '不良贷款率', content: '银行核心指标，<1%优秀，>2%警惕，决定银行命运' }
            ]
        }
    ],

    // 开始快速学习
    start() {
        Utils.showPage('quick-learn-page');
        this.currentStep = 0;
        this.currentQuestionIndex = 0;
        this.correctCount = 0;
        this.knowledgeCards = [];
        this.showTopicSelection();
    },

    // 步骤1：显示热点话题选择
    showTopicSelection() {
        const container = document.getElementById('learningContainer') || document.getElementById('quickLearnContainer');
        container.innerHTML = `
            <div class="text-center mb-8 animate-fade-in-up">
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full text-sm font-semibold shadow-lg mb-4">
                    <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span class="text-red-500">LIVE</span>
                    <span class="text-gray-600">今日热点</span>
                </div>
                <h1 class="text-3xl md:text-4xl font-bold mb-3">
                    <span class="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
                        选择你感兴趣的话题
                    </span>
                </h1>
                <p class="text-gray-500">3分钟沉浸式学习，掌握投资核心技能 ⚡</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                ${this.hotTopics.map((topic, index) => `
                    <div class="group cursor-pointer" onclick="QuickLearnModule.selectTopic('${topic.id}')" style="animation: fadeInUp 0.5s ease-out ${index * 0.1}s forwards; opacity: 0;">
                        <div class="relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                            <!-- 背景渐变 -->
                            <div class="absolute inset-0 bg-gradient-to-br ${topic.bgColor} opacity-50"></div>
                            
                            <!-- 内容 -->
                            <div class="relative p-6">
                                <div class="flex items-start gap-4">
                                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br ${topic.color} flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        ${topic.emoji}
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="text-xl font-bold text-gray-800 mb-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:${topic.color} group-hover:bg-clip-text transition-all">
                                            ${topic.title}
                                        </h3>
                                        <p class="text-gray-500 text-sm">${topic.subtitle}</p>
                                    </div>
                                </div>
                                
                                <div class="mt-4 flex items-center justify-between">
                                    <div class="flex items-center gap-2 text-sm text-gray-400">
                                        <i class="fas fa-clock"></i>
                                        <span>3分钟</span>
                                        <span class="mx-2">•</span>
                                        <i class="fas fa-chart-line"></i>
                                        <span>${topic.stock.name}</span>
                                    </div>
                                    <div class="w-10 h-10 rounded-full bg-gradient-to-r ${topic.color} flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <i class="fas fa-arrow-right"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- 底部提示 -->
            <div class="text-center mt-8 text-gray-400 text-sm">
                <p>💡 每个话题都会教你3个实用的投资知识点</p>
            </div>
        `;
    },

    // 选择话题
    selectTopic(topicId) {
        this.currentHotTopic = this.hotTopics.find(t => t.id === topicId);
        this.currentStep = 1;
        this.showIntro();
    },

    // 步骤2：显示话题介绍
    showIntro() {
        const topic = this.currentHotTopic;
        const container = document.getElementById('learningContainer') || document.getElementById('quickLearnContainer');
        if (!container) {
            console.error('Container not found');
            Utils.showToast('页面元素未找到');
            return;
        }
        
        container.innerHTML = `
            <div class="animate-fade-in-up">
                <!-- 顶部进度 -->
                <div class="flex items-center justify-between mb-6">
                    <button onclick="QuickLearnModule.showTopicSelection()" class="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition">
                        <i class="fas fa-arrow-left"></i>
                        <span>返回</span>
                    </button>
                    <div class="flex items-center gap-2 text-sm">
                        <span class="text-gray-400">第1步/共4步</span>
                    </div>
                </div>

                <!-- 话题卡片 -->
                <div class="bg-gradient-to-br ${topic.color} rounded-3xl p-8 text-white relative overflow-hidden mb-6">
                    <div class="absolute inset-0 opacity-20">
                        <div class="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-20 -translate-y-20"></div>
                    </div>
                    <div class="relative z-10">
                        <div class="text-6xl mb-4">${topic.emoji}</div>
                        <h2 class="text-3xl font-bold mb-2">${topic.title}</h2>
                        <p class="text-white/80 text-lg">${topic.subtitle}</p>
                    </div>
                </div>

                <!-- 介绍文字 -->
                <div class="glass-card-solid p-6 mb-6">
                    <p class="text-gray-600 text-lg leading-relaxed">${topic.intro}</p>
                </div>

                <!-- 角色卡片 -->
                <div class="bg-gradient-to-r ${topic.bgColor} rounded-2xl p-6 mb-8 border border-white/50">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br ${topic.color} flex items-center justify-center text-white text-xl">
                            🎭
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">你的角色</p>
                            <p class="font-bold text-gray-800">${topic.scenario.role}</p>
                        </div>
                    </div>
                    <p class="text-gray-600">${topic.scenario.situation}</p>
                </div>

                <!-- 开始按钮 -->
                <button onclick="QuickLearnModule.startQuestions()" 
                        class="group w-full py-5 bg-gradient-to-r ${topic.color} text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                    <span class="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                    <span class="relative z-10 flex items-center justify-center gap-3">
                        <span>开始情景模拟</span>
                        <i class="fas fa-play"></i>
                    </span>
                </button>
            </div>
        `;
    },

    // 步骤3：开始问题
    startQuestions() {
        this.currentStep = 2;
        this.currentQuestionIndex = 0;
        this.showQuestion();
    },

    // 显示当前问题
    showQuestion() {
        const topic = this.currentHotTopic;
        const question = topic.questions[this.currentQuestionIndex];
        const container = document.getElementById('learningContainer') || document.getElementById('quickLearnContainer');
        const progress = ((this.currentQuestionIndex + 1) / topic.questions.length) * 100;

        container.innerHTML = `
            <div class="animate-fade-in-up">
                <!-- 顶部进度 -->
                <div class="mb-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-gray-500">问题 ${this.currentQuestionIndex + 1} / ${topic.questions.length}</span>
                        <span class="text-sm font-medium text-gray-600">
                            <i class="fas fa-check-circle text-green-500 mr-1"></i>
                            ${this.correctCount} 答对
                        </span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div class="bg-gradient-to-r ${topic.color} h-2 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                    </div>
                </div>

                <!-- 情景描述 -->
                <div class="bg-gradient-to-r ${topic.bgColor} rounded-2xl p-5 mb-6 border border-white/50">
                    <p class="text-gray-700 text-lg">${question.situation}</p>
                </div>

                <!-- 问题 -->
                <div class="glass-card-solid p-6 mb-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-6">${question.question}</h3>
                    
                    <div class="space-y-3">
                        ${question.options.map((opt, idx) => `
                            <button onclick="QuickLearnModule.answerQuestion('${opt.value}', ${opt.correct || false})" 
                                    class="w-full p-4 text-left rounded-xl border-2 border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 group"
                                    id="option-${opt.value}">
                                <div class="flex items-center gap-3">
                                    <span class="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-purple-200 flex items-center justify-center font-bold text-gray-500 group-hover:text-purple-600 transition-all">
                                        ${String.fromCharCode(65 + idx)}
                                    </span>
                                    <span class="text-gray-700 group-hover:text-gray-900">${opt.text}</span>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    // 回答问题
    answerQuestion(value, isCorrect) {
        const topic = this.currentHotTopic;
        const question = topic.questions[this.currentQuestionIndex];
        const selectedOption = question.options.find(o => o.value === value);
        
        if (isCorrect) {
            this.correctCount++;
        }
        
        // 收集知识点
        this.knowledgeCards.push({
            question: question.question,
            knowledge: question.knowledge,
            correct: isCorrect
        });

        // 显示反馈
        this.showFeedback(selectedOption, isCorrect, question.knowledge);
    },

    // 显示答案反馈
    showFeedback(selectedOption, isCorrect, knowledge) {
        const topic = this.currentHotTopic;
        const container = document.getElementById('learningContainer') || document.getElementById('quickLearnContainer');

        container.innerHTML = `
            <div class="animate-fade-in-up">
                <!-- 结果图标 -->
                <div class="text-center mb-6">
                    <div class="inline-flex items-center justify-center w-24 h-24 rounded-full ${isCorrect ? 'bg-green-100' : 'bg-amber-100'} mb-4">
                        <span class="text-5xl">${isCorrect ? '🎉' : '💡'}</span>
                    </div>
                    <h2 class="text-2xl font-bold ${isCorrect ? 'text-green-600' : 'text-amber-600'}">
                        ${isCorrect ? '回答正确！' : '学到新知识！'}
                    </h2>
                </div>

                <!-- 反馈解释 -->
                <div class="glass-card-solid p-6 mb-6">
                    <div class="flex items-start gap-3 mb-4">
                        <span class="text-2xl">${isCorrect ? '✅' : '📝'}</span>
                        <p class="text-gray-700">${selectedOption.feedback}</p>
                    </div>
                </div>

                <!-- 知识卡片 -->
                <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-8 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div class="relative z-10">
                        <div class="flex items-center gap-2 mb-3">
                            <span class="text-2xl">📚</span>
                            <span class="font-bold">知识点解锁</span>
                        </div>
                        <div class="text-white/90 leading-relaxed">${knowledge.replace(/\*\*(.*?)\*\*/g, '<strong class="text-yellow-300">$1</strong>')}</div>
                    </div>
                </div>

                <!-- 继续按钮 -->
                <button onclick="QuickLearnModule.nextQuestion()" 
                        class="group w-full py-5 bg-gradient-to-r ${topic.color} text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                    <span class="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                    <span class="relative z-10">
                        ${this.currentQuestionIndex < topic.questions.length - 1 ? '下一题 →' : '查看学习成果 🎁'}
                    </span>
                </button>
            </div>
        `;

        // 播放音效
        if (isCorrect) {
            this.playSound('success');
        } else {
            this.playSound('learn');
        }
    },

    // 下一题
    nextQuestion() {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.currentHotTopic.questions.length) {
            this.showQuestion();
        } else {
            this.showSummary();
        }
    },

    // 显示学习总结
    showSummary() {
        const topic = this.currentHotTopic;
        const container = document.getElementById('learningContainer') || document.getElementById('quickLearnContainer');
        const score = Math.round((this.correctCount / topic.questions.length) * 100);
        const stars = score >= 90 ? 3 : score >= 60 ? 2 : 1;

        container.innerHTML = `
            <div class="animate-fade-in-up">
                <!-- 成就展示 -->
                <div class="text-center mb-8">
                    <div class="inline-block">
                        <div class="relative">
                            <div class="w-32 h-32 rounded-full bg-gradient-to-br ${topic.color} flex items-center justify-center mx-auto mb-4 shadow-2xl">
                                <span class="text-6xl">${topic.emoji}</span>
                            </div>
                            <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                                <div class="flex gap-1">
                                    ${[0,1,2].map(i => `
                                        <span class="text-3xl ${i < stars ? '' : 'opacity-30'}" style="animation: ${i < stars ? 'starPop 0.5s ease-out forwards' : 'none'}; animation-delay: ${i * 0.2}s">
                                            ${i < stars ? '⭐' : '☆'}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <h2 class="text-3xl font-bold mt-6 mb-2">
                        <span class="bg-gradient-to-r ${topic.color} bg-clip-text text-transparent">
                            学习完成！
                        </span>
                    </h2>
                    <p class="text-gray-500">你在「${topic.title}」获得了 ${stars} 颗星</p>
                    
                    <div class="flex justify-center gap-6 mt-4">
                        <div class="text-center">
                            <p class="text-3xl font-bold text-green-500">${this.correctCount}</p>
                            <p class="text-sm text-gray-400">答对题目</p>
                        </div>
                        <div class="text-center">
                            <p class="text-3xl font-bold text-purple-500">3</p>
                            <p class="text-sm text-gray-400">知识解锁</p>
                        </div>
                        <div class="text-center">
                            <p class="text-3xl font-bold text-amber-500">+${score}</p>
                            <p class="text-sm text-gray-400">积分获得</p>
                        </div>
                    </div>
                </div>

                <!-- 知识卡片收集 -->
                <div class="mb-8">
                    <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>📚</span>
                        <span>今日收获的知识卡片</span>
                    </h3>
                    <div class="space-y-4">
                        ${topic.summaryCards.map((card, idx) => `
                            <div class="glass-card-solid p-5 hover:shadow-lg transition-all duration-300" style="animation: fadeInUp 0.5s ease-out ${idx * 0.15}s forwards; opacity: 0;">
                                <div class="flex items-start gap-4">
                                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${topic.color} flex items-center justify-center text-2xl shadow-lg">
                                        ${card.icon}
                                    </div>
                                    <div class="flex-1">
                                        <h4 class="font-bold text-gray-800 mb-1">${card.title}</h4>
                                        <p class="text-gray-500 text-sm">${card.content}</p>
                                    </div>
                                    <span class="text-green-500 text-sm">✓ 已解锁</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 操作按钮 -->
                <div class="space-y-3">
                    <button onclick="QuickLearnModule.start()" 
                            class="w-full py-4 bg-gradient-to-r ${topic.color} text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300">
                        🔥 继续学习其他话题
                    </button>
                    <button onclick="QuickLearnModule.shareResult()" 
                            class="w-full py-4 bg-white text-gray-700 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                        📤 分享学习成果
                    </button>
                    <button onclick="Utils.showPage('swipe-page')" 
                            class="w-full py-3 text-gray-500 hover:text-gray-700 transition">
                        返回首页
                    </button>
                </div>
            </div>
        `;

        // 触发庆祝效果
        if (stars >= 2) {
            setTimeout(() => {
                CheckinModule.triggerConfetti && CheckinModule.triggerConfetti();
            }, 500);
        }
    },

    // 分享结果
    shareResult() {
        const topic = this.currentHotTopic;
        const score = Math.round((this.correctCount / topic.questions.length) * 100);
        const shareText = `🎓 我刚刚完成了「${topic.title}」的学习！\n✅ 答对 ${this.correctCount}/3 题，获得 ${score} 积分\n📚 解锁了3个投资知识点\n\n一起来学习吧！`;
        
        navigator.clipboard.writeText(shareText).then(() => {
            Utils.showToast('已复制分享内容到剪贴板！');
        });
    },

    // 播放音效
    playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            if (type === 'success') {
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
            } else {
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime + 0.15);
            }
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {}
    }
};

// 暴露到全局
window.QuickLearnModule = QuickLearnModule;

/***********************
 * 页面初始化
 ***********************/
window.addEventListener('DOMContentLoaded', () => {
    // 初始化规则弹窗
    RuleModal.init();
    
    // 显示规则弹窗
    RuleModal.show();

    // 初始化连胜系统
    StreakModule.init();

    // 初始化吉祥物
    MascotModule.init();

    // 检查签到通知
    CheckinModule.checkNotification && CheckinModule.checkNotification();

    // 更新导航栏积分显示
    const updateNavPoints = () => {
        const navPointsEl = document.getElementById('navPoints');
        if (navPointsEl) {
            navPointsEl.textContent = AppState.points || 0;
        }
    };
    
    // 初始更新
    updateNavPoints();
    
    // 定期更新积分（每2秒）
    setInterval(updateNavPoints, 2000);
    
    // 监听积分变化（可以通过自定义事件）
    const originalPointsConfig = AppState.pointsConfig;
    // 创建一个代理来监听积分变化
    let lastPoints = AppState.points;
    setInterval(() => {
        if (AppState.points !== lastPoints) {
            lastPoints = AppState.points;
            updateNavPoints();
        }
    }, 500);
});
