const express = require('express');
const cors = require('cors');
const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 模拟配置数据
const mockConfig = {
        coins: {
                xht: { symbol: 'xht', fullname: 'HollaEx Token', active: true },
                usdt: { symbol: 'usdt', fullname: 'Tether', active: true },
                btc: { symbol: 'btc', fullname: 'Bitcoin', active: true },
                eth: { symbol: 'eth', fullname: 'Ethereum', active: true }
        },
        pairs: {
                'xht-usdt': { name: 'xht-usdt', active: true },
                'btc-usdt': { name: 'btc-usdt', active: true },
                'eth-usdt': { name: 'eth-usdt', active: true }
        },
        info: {
                name: 'HollaEx Demo',
                active: true,
                status: true,
                initialized: true
        },
        constants: {
                api_name: 'HollaEx Demo Exchange'
        },
        color: {},
        icons: {},
        interface: {},
        strings: {},
        features: {
                chat: false,
                quick_trade: true,
                pro_trade: true,
                stake_page: false
        }
};

// 模拟用户数据
const mockUser = {
        id: 1,
        email: 'admin@demo.com',
        username: 'Demo Admin',
        balance: {
                xht_balance: 10000,
                xht_available: 10000,
                usdt_balance: 50000,
                usdt_available: 50000,
                btc_balance: 1.5,
                btc_available: 1.5,
                eth_balance: 25,
                eth_available: 25
        }
};

// 健康检查
app.get('/v2/health', (req, res) => {
        res.json({ status: 'ok', message: 'Mock backend is running' });
});

app.get('/health', (req, res) => {
        res.json({ status: 'ok' });
});

// 配置端点
app.get('/v2/health/config', (req, res) => {
        res.json(mockConfig);
});

app.get('/v2/constants', (req, res) => {
        res.json(mockConfig);
});

// 用户端点
app.get('/v2/user', (req, res) => {
        const token = req.headers.authorization;
        if (token && token.includes('demo_token')) {
                res.json(mockUser);
        } else {
                res.status(401).json({ message: 'Unauthorized' });
        }
});

app.get('/v2/user/balance', (req, res) => {
        res.json(mockUser.balance);
});

// 市场数据
app.get('/v2/ticker', (req, res) => {
        res.json({
                'xht-usdt': { last: 0.5, high: 0.55, low: 0.45, volume: 1000000 },
                'btc-usdt': { last: 35000, high: 36000, low: 34000, volume: 500 },
                'eth-usdt': { last: 2000, high: 2100, low: 1900, volume: 10000 }
        });
});

app.get('/v2/tickers', (req, res) => {
        res.json([
                { symbol: 'xht-usdt', last: 0.5, high: 0.55, low: 0.45, volume: 1000000, change: 5.2 },
                { symbol: 'btc-usdt', last: 35000, high: 36000, low: 34000, volume: 500, change: 2.1 },
                { symbol: 'eth-usdt', last: 2000, high: 2100, low: 1900, volume: 10000, change: -1.3 }
        ]);
});

// 订单簿
app.get('/v2/orderbook', (req, res) => {
        res.json({
                bids: [[34900, 0.5], [34800, 1.2], [34700, 0.8]],
                asks: [[35100, 0.6], [35200, 1.1], [35300, 0.9]],
                timestamp: new Date().toISOString()
        });
});

// 交易历史
app.get('/v2/trades', (req, res) => {
        res.json([
                { size: 0.1, price: 35000, side: 'buy', timestamp: new Date().toISOString() },
                { size: 0.2, price: 34950, side: 'sell', timestamp: new Date().toISOString() }
        ]);
});

// 用户交易
app.get('/v2/user/trades', (req, res) => {
        res.json({ count: 0, data: [] });
});

// 用户订单
app.get('/v2/user/orders', (req, res) => {
        res.json({ count: 0, data: [] });
});

// 图表数据
app.get('/v2/chart', (req, res) => {
        const data = [];
        const now = Date.now();
        for (let i = 100; i >= 0; i--) {
                data.push({
                        time: now - i * 60000,
                        open: 35000 + Math.random() * 1000,
                        high: 35500 + Math.random() * 1000,
                        low: 34500 + Math.random() * 1000,
                        close: 35000 + Math.random() * 1000,
                        volume: Math.random() * 100
                });
        }
        res.json(data);
});

// 捕获所有其他请求
app.all('*', (req, res) => {
        console.log(`接收到请求: ${req.method} ${req.path}`);
        res.json({ message: 'Mock endpoint', path: req.path });
});

const PORT = 10010;
app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Mock backend server running on port ${PORT}`);
        console.log(`📡 Health check: http://localhost:${PORT}/v2/health`);
});
