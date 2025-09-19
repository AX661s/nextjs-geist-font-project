const fs = require('fs');

// 测试房产和家庭数据提取函数
const testData = JSON.parse(fs.readFileSync('test_results_14403828826.json', 'utf8'));

// 模拟extractRealEstateData函数
function extractRealEstateData(integrated) {
    const realEstateData = [];
    
    if (integrated.rawData && integrated.rawData.results && integrated.rawData.results.osint_name) {
        const osintData = integrated.rawData.results.osint_name;
        if (osintData.success && osintData.data && osintData.data.data && osintData.data.data.List) {
            const databases = osintData.data.data.List;
            
            Object.values(databases).forEach(db => {
                if (db.Data && Array.isArray(db.Data)) {
                    db.Data.forEach(entry => {
                        // 检查地址信息 - 所有有地址的记录都被提取
                        if (entry.Address && entry.Address !== 'N/A' && entry.Address.trim() !== '') {
                            realEstateData.push({
                                address: entry.Address,
                                city: entry.City || '',
                                state: entry.State || '',
                                zipCode: entry.PostCode || '',
                                value: entry.HomeValue || entry.PropertyValue || entry.EstimatedValue || '',
                                year: entry.HomeBuiltYear || entry.PropertyYear || '',
                                mortgage: entry.MortgageLenderName || '',
                                type: entry.PropertyType || '住宅'
                            });
                        }
                    });
                }
            });
        }
    }
    
    // 去重处理 - 基于地址
    const uniqueProperties = [];
    const seen = new Set();
    
    realEstateData.forEach(property => {
        const normalizedAddress = property.address.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!seen.has(normalizedAddress) && property.address.length > 5 && !property.address.includes('united states')) {
            seen.add(normalizedAddress);
            uniqueProperties.push(property);
        }
    });
    
    return uniqueProperties;
}

// 模拟extractFamilyData函数
function extractFamilyData(integrated) {
    const familyData = [];
    
    if (integrated.rawData && integrated.rawData.results && integrated.rawData.results.osint_name) {
        const osintData = integrated.rawData.results.osint_name;
        if (osintData.success && osintData.data && osintData.data.data && osintData.data.data.List) {
            const databases = osintData.data.data.List;
            
            Object.values(databases).forEach(db => {
                if (db.Data && Array.isArray(db.Data)) {
                    db.Data.forEach(entry => {
                        // 提取亲属信息
                        if (entry.Relatives && entry.Relatives !== 'N/A' && typeof entry.Relatives === 'string' && entry.Relatives.trim() !== '') {
                            const relatives = entry.Relatives.split(',');
                            relatives.forEach(rel => {
                                const relInfo = rel.trim();
                                if (relInfo && relInfo !== '' && !relInfo.includes('N/A')) {
                                    const parts = relInfo.split(' ');
                                    if (parts.length >= 2) {
                                        const name = parts.slice(0, 2).join(' ');
                                        familyData.push({
                                            name: name,
                                            relationship: '亲属',
                                            phone: parts[3] || '',
                                            age: ''
                                        });
                                    }
                                }
                            });
                        }
                        
                        // 从AmountKids字段提取
                        if (entry.AmountKids && entry.AmountKids !== 'U' && entry.AmountKids !== 'N/A' && entry.AmountKids.trim() !== '') {
                            const numKids = parseInt(entry.AmountKids);
                            if (!isNaN(numKids) && numKids > 0) {
                                familyData.push({
                                    name: `${numKids} 个孩子`,
                                    relationship: '家庭信息',
                                    phone: '',
                                    age: ''
                                });
                            }
                        }
                        
                        // 从NumberOfChildren字段提取
                        if (entry.NumberOfChildren && entry.NumberOfChildren !== 'U' && entry.NumberOfChildren !== 'N/A' && entry.NumberOfChildren.trim() !== '') {
                            const numChildren = parseInt(entry.NumberOfChildren);
                            if (!isNaN(numChildren) && numChildren > 0) {
                                familyData.push({
                                    name: `${numChildren} 个子女`,
                                    relationship: '家庭成员',
                                    phone: '',
                                    age: ''
                                });
                            }
                        }
                        
                        // 提取昵称信息
                        if (entry.NickName && entry.NickName !== 'N/A' && entry.NickName.trim() !== '') {
                            familyData.push({
                                name: entry.NickName,
                                relationship: '昵称/别名',
                                phone: '',
                                age: ''
                            });
                        }
                    });
                }
            });
        }
    }
    
    // 去重处理
    return familyData.filter((item, index, self) => 
        index === self.findIndex((t) => t.name === item.name && t.relationship === item.relationship)
    );
}

console.log('=== 修复后的数据提取测试 ===\n');

// 测试房产数据提取
const realEstateData = extractRealEstateData({ rawData: testData.data });
console.log(`房产信息提取结果: ${realEstateData.length} 条记录`);
if (realEstateData.length > 0) {
    console.log('前5条房产记录:');
    realEstateData.slice(0, 5).forEach((property, index) => {
        console.log(`  ${index + 1}. ${property.address} ${property.city} ${property.state} ${property.zipCode}`);
        if (property.year) console.log(`     建筑年份: ${property.year}`);
        if (property.mortgage) console.log(`     抵押贷款: ${property.mortgage}`);
    });
} else {
    console.log('❌ 没有提取到房产信息');
}

console.log('\n');

// 测试家庭数据提取
const familyData = extractFamilyData({ rawData: testData.data });
console.log(`家庭信息提取结果: ${familyData.length} 条记录`);
if (familyData.length > 0) {
    console.log('家庭成员记录:');
    familyData.forEach((member, index) => {
        console.log(`  ${index + 1}. ${member.name} (${member.relationship})`);
        if (member.phone) console.log(`     电话: ${member.phone}`);
    });
} else {
    console.log('❌ 没有提取到家庭信息');
}

console.log('\n=== 结果分析 ===');
console.log(`房产信息: ${realEstateData.length > 0 ? '✅ 成功提取' : '❌ 提取失败'}`);
console.log(`家庭信息: ${familyData.length > 0 ? '✅ 成功提取' : '❌ 提取失败'}`);