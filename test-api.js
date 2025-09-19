// API测试脚本
const https = require('https');
const http = require('http');
const fs = require('fs');

// 禁用证书验证（开发环境）
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// 测试号码 - 基于真实数据样本
const testNumbers = [
    // 原有测试号码
    '1646-535-7491',
    '14403828826',
    
    // 新的真实测试号码
    '13604404502',    // HeggieCrystal
    '19094934795',    // Thomas Hentschel  
    '7042494652',     // Jennifer Jacobs
    '4126704024',     // Ines Brady
    '16192575877',    // Felicia Dunston
    '16192546032',    // Johanan Veinbengs
    '14353220826',    // WardDustin
    '19168090662',    // Hargobinder Singh Mangat
    '15104637880',    // Rodriguez-Choularge
    '13109118958'     // Vijay_devireddy
];

// 存储session cookie
let sessionCookie = '';

// 执行登录获取session
async function login() {
    console.log('🔐 执行登录...');
    
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            username: 'admin',
            password: 'admin123'
        });
        
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: '/api/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            
            // 获取Set-Cookie头
            const cookies = res.headers['set-cookie'];
            if (cookies) {
                sessionCookie = cookies.map(cookie => cookie.split(';')[0]).join('; ');
                console.log('🍪 获取到Session Cookie');
            }
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.success) {
                        console.log('✅ 登录成功');
                        resolve(result);
                    } else {
                        reject(new Error(`登录失败: ${result.message}`));
                    }
                } catch (error) {
                    reject(new Error(`JSON解析错误: ${error.message}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

// 执行API测试
async function testAPI() {
    console.log('🚀 开始API测试...');
    
    try {
        // 先登录
        await login();
        
        for (let i = 0; i < testNumbers.length; i++) {
            const phoneNumber = testNumbers[i];
            console.log(`📱 测试号码 ${i + 1}: ${phoneNumber}`);
            
            try {
                const result = await makeAPICall(phoneNumber);
                const fileName = `test_results_${phoneNumber.replace(/[-]/g, '_')}.json`;
                
                // 保存结果
                fs.writeFileSync(fileName, JSON.stringify(result, null, 2), 'utf8');
                console.log(`✅ 结果已保存到: ${fileName}`);
                console.log(`📊 数据概览:`);
                console.log(`   - 查询成功: ${result.success ? '是' : '否'}`);
                if (result.data) {
                    console.log(`   - 号码: ${result.data.phone_number}`);
                    console.log(`   - 完整号码: ${result.data.full_number}`);
                    console.log(`   - 国家代码: ${result.data.country_code}`);
                    
                    // 分析各个数据源
                    const results = result.data.results;
                    if (results) {
                        console.log(`   - WhatsApp: ${results.whatsapp?.success ? '有数据' : '无数据'}`);
                        console.log(`   - Truecaller: ${results.truecaller?.success ? '有数据' : '无数据'}`);
                        console.log(`   - OSINT号码: ${results.osint_number?.success ? '有数据' : '无数据'}`);
                        console.log(`   - OSINT姓名: ${results.osint_name?.success ? '有数据' : '无数据'}`);
                        
                        // WhatsApp详细信息
                        if (results.whatsapp?.success && results.whatsapp.data) {
                            const wa = results.whatsapp.data;
                            console.log(`   - WhatsApp详情:`);
                            console.log(`     * 已注册: ${wa.isRegistered ? '是' : '否'}`);
                            console.log(`     * 有头像: ${wa.hasProfilePic ? '是' : '否'}`);
                            console.log(`     * 商业账户: ${wa.isBusiness ? '是' : '否'}`);
                            if (wa.profilePicBase64) {
                                console.log(`     * 头像数据: ${wa.profilePicBase64.substring(0, 50)}...`);
                            }
                        }
                        
                        // Truecaller详细信息
                        if (results.truecaller?.success && results.truecaller.data?.data?.length > 0) {
                            const tc = results.truecaller.data.data[0];
                            console.log(`   - Truecaller详情:`);
                            console.log(`     * 姓名: ${tc.name || '未知'}`);
                            console.log(`     * 性别: ${tc.gender || '未知'}`);
                            if (tc.phones && tc.phones[0]) {
                                console.log(`     * 运营商: ${tc.phones[0].carrier || '未知'}`);
                            }
                            if (tc.addresses && tc.addresses[0]) {
                                console.log(`     * 城市: ${tc.addresses[0].city || '未知'}`);
                            }
                        }
                    }
                }
                console.log('---\n');
                
            } catch (error) {
                console.error(`❌ 测试 ${phoneNumber} 失败:`, error.message);
            }
            
            // 延迟以避免API限制
            if (i < testNumbers.length - 1) {
                console.log('⏱️ 等待3秒...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        
        console.log('🎉 所有测试完成！');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

// 执行API调用
function makeAPICall(phoneNumber) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            phoneNumber: phoneNumber
        });
        
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: '/api/external-lookup',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Cookie': sessionCookie // 添加session cookie
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (error) {
                    reject(new Error(`JSON解析错误: ${error.message}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

// 启动测试
testAPI().catch(console.error);