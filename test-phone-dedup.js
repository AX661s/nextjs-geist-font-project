#!/usr/bin/env node

// 测试电话号码去重功能
console.log('=== 测试电话号码智能去重功能 ===');

// 模拟电话号码去重函数
function deduplicatePhones(phones) {
    const phoneArray = Array.from(phones);
    const result = {
        main: null,
        mobile: new Set(),
        landline: new Set(),
        formatted: new Set()
    };
    
    // 创建归一化映射表，用于去重
    const normalizedMap = new Map();
    
    phoneArray.forEach(phone => {
        const cleanPhone = phone.replace(/\D/g, '');
        
        // 如果已经存在相同的数字序列，选择保留最佳格式
        if (normalizedMap.has(cleanPhone)) {
            const existingPhone = normalizedMap.get(cleanPhone);
            let shouldReplace = false;
            
            // 优先级：+1格式 > (xxx) xxx-xxxx格式 > xxx-xxx-xxxx格式 > 纯数字
            if (phone.startsWith('+1') && !existingPhone.startsWith('+1')) {
                shouldReplace = true;
            } else if (!phone.startsWith('+1') && !existingPhone.startsWith('+1')) {
                // 两个都不是+1格式，优先保留有括号的格式
                if (phone.includes('(') && phone.includes(')') && !existingPhone.includes('(')) {
                    shouldReplace = true;
                } else if (!phone.includes('(') && !existingPhone.includes('(')) {
                    // 都没有括号，优先保留有连字符的
                    if (phone.includes('-') && !existingPhone.includes('-')) {
                        shouldReplace = true;
                    }
                }
            }
            
            if (shouldReplace) {
                normalizedMap.set(cleanPhone, phone);
            }
            return; // 跳过重复号码
        }
        
        // 记录这个号码
        normalizedMap.set(cleanPhone, phone);
    });
    
    // 对去重后的号码进行分类
    normalizedMap.forEach((phone, cleanPhone) => {
        // 主号码（+1格式，11位数字）
        if (phone.startsWith('+1') && cleanPhone.length === 11) {
            result.main = phone;
        }
        // 格式化号码 (xxx) xxx-xxxx，但不是主号码的重复
        else if (phone.includes('(') && phone.includes(')')) {
            // 检查是否与主号码重复
            if (!result.main || result.main.replace(/\D/g, '') !== cleanPhone) {
                result.formatted.add(phone);
            }
        }
        // 10位完整号码但不是+1格式，归类为手机
        else if (cleanPhone.length === 10 && !phone.startsWith('+')) {
            result.mobile.add(phone);
        }
        // 座机号码（短号码或特定格式）
        else if (cleanPhone.length < 10 && cleanPhone.length >= 7) {
            result.landline.add(phone);
        }
        // 其他长号码归类为手机
        else if (cleanPhone.length >= 10) {
            result.mobile.add(phone);
        }
    });
    
    return result;
}

// 测试数据 - 包含重复的电话号码
const testPhones = new Set([
    '+14403828826',
    '(440) 382-8826',
    '14403828826',
    '9512603',
    '4409512603',
    '4409513757',
    '440-655-6937',
    '4406556937'  // 这个和上面的是同一个号码
]);

console.log('原始电话号码列表:');
testPhones.forEach((phone, index) => {
    console.log(`${index + 1}. ${phone}`);
});

console.log('\n执行去重...\n');

const result = deduplicatePhones(testPhones);

// 统计总数
let totalCount = 0;
if (result.main) totalCount++;
totalCount += result.formatted.size;
totalCount += result.mobile.size;
totalCount += result.landline.size;

console.log(`去重后的电话号码 (${totalCount}个):`);

let counter = 1;
if (result.main) {
    console.log(`${counter}. ${result.main} [主号码]`);
    counter++;
}

result.formatted.forEach(phone => {
    console.log(`${counter}. ${phone} [格式化]`);
    counter++;
});

result.mobile.forEach(phone => {
    console.log(`${counter}. ${phone} [手机]`);
    counter++;
});

result.landline.forEach(phone => {
    console.log(`${counter}. ${phone} [座机]`);
    counter++;
});

console.log(`\n原始数量: ${testPhones.size}个`);
console.log(`去重后数量: ${totalCount}个`);
console.log(`去除重复: ${testPhones.size - totalCount}个`);

// 验证特定重复项是否被正确处理
const cleanNumbers = new Map();
testPhones.forEach(phone => {
    const clean = phone.replace(/\D/g, '');
    if (!cleanNumbers.has(clean)) {
        cleanNumbers.set(clean, []);
    }
    cleanNumbers.get(clean).push(phone);
});

console.log('\n重复项检测:');
cleanNumbers.forEach((phones, cleanNum) => {
    if (phones.length > 1) {
        console.log(`数字 ${cleanNum} 的变体: ${phones.join(', ')}`);
    }
});

// 退出进程
process.exit(0);