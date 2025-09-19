const fs = require('fs');

// 读取测试数据
const testData = JSON.parse(fs.readFileSync('test_results_14403828826.json', 'utf8'));

console.log('=== 数据提取测试 ===\n');

// 模拟数据提取函数
function extractVehicleData(integrated) {
    const vehicleData = [];
    
    if (integrated.rawData && integrated.rawData.results && integrated.rawData.results.osint_name) {
        const osintData = integrated.rawData.results.osint_name;
        if (osintData.success && osintData.data && osintData.data.data && osintData.data.data.List) {
            const databases = osintData.data.data.List;
            
            Object.entries(databases).forEach(([dbName, db]) => {
                console.log(`检查数据库: ${dbName}`);
                if (db.Data && Array.isArray(db.Data)) {
                    db.Data.forEach((entry, index) => {
                        console.log(`  条目 ${index}:`, Object.keys(entry));
                        
                        if (entry.AutoBrand || entry.AutoModel || entry.VIN) {
                            console.log(`  找到车辆: ${entry.AutoBrand} ${entry.AutoModel} (${entry.IssueYear}) VIN: ${entry.VIN}`);
                            vehicleData.push({
                                make: entry.AutoBrand || '未知',
                                model: entry.AutoModel || '',
                                year: entry.IssueYear || '',
                                vin: entry.VIN || '',
                                license: entry.LicensePlate || ''
                            });
                        }
                    });
                }
            });
        }
    }
    
    return vehicleData;
}

function extractFamilyData(integrated) {
    const familyData = [];
    
    if (integrated.rawData && integrated.rawData.results && integrated.rawData.results.osint_name) {
        const osintData = integrated.rawData.results.osint_name;
        if (osintData.success && osintData.data && osintData.data.data && osintData.data.data.List) {
            const databases = osintData.data.data.List;
            
            Object.entries(databases).forEach(([dbName, db]) => {
                console.log(`检查家庭数据库: ${dbName}`);
                if (db.Data && Array.isArray(db.Data)) {
                    db.Data.forEach((entry, index) => {
                        // 亲属信息
                        if (entry.Relatives && entry.Relatives !== 'N/A' && typeof entry.Relatives === 'string') {
                            console.log(`  找到亲属信息: ${entry.Relatives}`);
                            const relatives = entry.Relatives.split(',');
                            relatives.forEach(rel => {
                                const relInfo = rel.trim();
                                if (relInfo) {
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
                        
                        // 子女数量
                        if (entry.AmountKids && entry.AmountKids !== 'U' && entry.AmountKids !== 'N/A') {
                            console.log(`  找到子女数量: ${entry.AmountKids}`);
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
                        
                        if (entry.NumberOfChildren && entry.NumberOfChildren !== 'U' && entry.NumberOfChildren !== 'N/A') {
                            console.log(`  找到子女数量: ${entry.NumberOfChildren}`);
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
                        
                        // 昵称
                        if (entry.NickName && entry.NickName !== 'N/A') {
                            console.log(`  找到昵称: ${entry.NickName}`);
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
    
    return familyData;
}

// 测试房产数据提取
function extractRealEstateData(integrated) {
    const realEstateData = [];
    
    if (integrated.rawData && integrated.rawData.results && integrated.rawData.results.osint_name) {
        const osintData = integrated.rawData.results.osint_name;
        if (osintData.success && osintData.data && osintData.data.data && osintData.data.data.List) {
            const databases = osintData.data.data.List;
            
            Object.entries(databases).forEach(([dbName, db]) => {
                console.log(`检查房产数据库: ${dbName}`);
                if (db.Data && Array.isArray(db.Data)) {
                    db.Data.forEach((entry, index) => {
                        // 检查地址信息
                        if (entry.Address && entry.Address !== 'N/A') {
                            console.log(`  找到地址: ${entry.Address}`);
                            realEstateData.push({
                                address: entry.Address,
                                city: entry.City || '',
                                state: entry.State || '',
                                zipCode: entry.PostCode || '',
                                value: entry.HomeValue || entry.PropertyValue || '',
                                year: entry.HomeBuiltYear || '',
                                mortgage: entry.MortgageLenderName || ''
                            });
                        }
                        
                        // 检查房屋建筑年份（表示拥有房产）
                        if (entry.HomeBuiltYear && entry.HomeBuiltYear !== 'N/A') {
                            console.log(`  找到房屋建筑信息: ${entry.HomeBuiltYear}`);
                        }
                        
                        // 检查抵押贷款信息
                        if (entry.MortgageLenderName && entry.MortgageLenderName !== 'N/A') {
                            console.log(`  找到抵押贷款: ${entry.MortgageLenderName}`);
                        }
                    });
                }
            });
        }
    }
    
    return realEstateData;
}

// 测试收入数据提取
function extractIncomeData(integrated) {
    const incomeData = [];
    
    if (integrated.rawData && integrated.rawData.results && integrated.rawData.results.osint_name) {
        const osintData = integrated.rawData.results.osint_name;
        if (osintData.success && osintData.data && osintData.data.data && osintData.data.data.List) {
            const databases = osintData.data.data.List;
            
            Object.entries(databases).forEach(([dbName, db]) => {
                console.log(`检查收入数据库: ${dbName}`);
                if (db.Data && Array.isArray(db.Data)) {
                    db.Data.forEach((entry, index) => {
                        // 检查收入字段
                        if (entry.Income && entry.Income !== 'N/A' && entry.Income !== 'U') {
                            console.log(`  找到收入信息: ${entry.Income}`);
                            incomeData.push({
                                amount: entry.Income,
                                source: dbName,
                                type: '年收入'
                            });
                        }
                        
                        // 检查薪水字段
                        if (entry.Salary && entry.Salary !== 'N/A' && entry.Salary !== 'U') {
                            console.log(`  找到薪水信息: ${entry.Salary}`);
                            incomeData.push({
                                amount: entry.Salary,
                                source: dbName,
                                type: '薪水'
                            });
                        }
                        
                        // 检查年收入字段
                        if (entry.AnnualIncome && entry.AnnualIncome !== 'N/A' && entry.AnnualIncome !== 'U') {
                            console.log(`  找到年收入: ${entry.AnnualIncome}`);
                            incomeData.push({
                                amount: entry.AnnualIncome,
                                source: dbName,
                                type: '年收入'
                            });
                        }
                        
                        // 检查公司年收入（B2B数据库）
                        if (entry.AnnualRevenue && entry.AnnualRevenue !== 'N/A') {
                            console.log(`  找到公司年收入: ${entry.AnnualRevenue}`);
                            incomeData.push({
                                amount: entry.AnnualRevenue,
                                source: dbName,
                                type: '公司收入'
                            });
                        }
                    });
                }
            });
        }
    }
    
    return incomeData;
}

// 测试房产数据提取
console.log('4. 房产信息提取测试:');
const realEstateData = extractRealEstateData({ rawData: testData.data });
console.log('提取到的房产信息:', realEstateData);
console.log(`房产记录数量: ${realEstateData.length}\n`);

// 测试收入数据提取
console.log('5. 收入信息提取测试:');
const incomeData = extractIncomeData({ rawData: testData.data });
console.log('提取到的收入信息:', incomeData);
console.log(`收入记录数量: ${incomeData.length}\n`);

// 检查原始数据结构
console.log('3. 原始数据结构检查:');
if (testData.data && testData.data.results && testData.data.results.osint_name) {
    const osintData = testData.data.results.osint_name.data.data.List;
    Object.entries(osintData).forEach(([dbName, db]) => {
        console.log(`\n数据库: ${dbName}`);
        console.log(`记录数: ${db.NumOfResults}`);
        if (db.Data && Array.isArray(db.Data)) {
            db.Data.forEach((entry, index) => {
                console.log(`  记录 ${index + 1}:`, Object.keys(entry).filter(key => entry[key] && entry[key] !== 'N/A').slice(0, 5));
            });
        }
    });
} else {
    console.log('错误: 找不到osint_name数据');
    console.log('可用数据结构:', Object.keys(testData));
    if (testData.data) {
        console.log('testData.data结构:', Object.keys(testData.data));
        if (testData.data.results) {
            console.log('testData.data.results结构:', Object.keys(testData.data.results));
        }
    }
}