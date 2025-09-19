// 测试姓名去重功能
console.log('=== 测试姓名智能去重功能 ===');

// 模拟姓名去重函数（从前端代码复制）
function deduplicateNames(names) {
    const nameArray = Array.from(names);
    const cleaned = new Set();
    
    // 常见职位关键词列表
    const jobTitles = [
        'manager', 'director', 'ceo', 'cto', 'cfo', 'president', 'vice president', 'vp',
        'supervisor', 'coordinator', 'specialist', 'assistant', 'associate', 'analyst',
        'engineer', 'developer', 'consultant', 'advisor', 'executive', 'officer',
        'site manager', 'project manager', 'team lead', 'senior', 'junior', 'lead',
        'administrator', 'technician', 'operator', 'representative', 'agent',
        'secretary', 'clerk', 'receptionist', 'accountant', 'lawyer', 'attorney',
        'doctor', 'nurse', 'teacher', 'professor', 'instructor', 'trainer'
    ];
    
    // 清理姓名，移除职位信息
    const cleanedNames = nameArray.map(name => {
        let cleanName = name.trim();
        
        // 移除职位信息（通常在姓名后面）
        for (let job of jobTitles) {
            const regex = new RegExp(`\\s+${job}\\s*$`, 'gi');
            cleanName = cleanName.replace(regex, '').trim();
            
            // 也检查开头的职位（较少见）
            const startRegex = new RegExp(`^${job}\\s+`, 'gi');
            cleanName = cleanName.replace(startRegex, '').trim();
        }
        
        // 移除常见的后缀（如 Jr, Sr, III 等）
        cleanName = cleanName.replace(/\s+(jr\.?|sr\.?|ii+|i+v?)$/gi, '').trim();
        
        // 移除多余的空格和标点
        cleanName = cleanName.replace(/\s+/g, ' ').replace(/[,\-]+$/, '').trim();
        
        return { original: name, cleaned: cleanName };
    });
    
    // 按清理后的姓名长度排序，优先选择更完整的版本
    const sorted = cleanedNames
        .filter(item => item.cleaned.length > 0) // 过滤空名称
        .sort((a, b) => b.cleaned.length - a.cleaned.length);
    
    const usedCleanNames = new Set();
    
    for (let item of sorted) {
        const normalizedName = item.cleaned.toLowerCase().replace(/[^a-z\s]/g, '').trim();
        let isDuplicate = false;
        
        // 检查是否与已有名称重复
        for (let existing of usedCleanNames) {
            const existingNorm = existing.toLowerCase().replace(/[^a-z\s]/g, '').trim();
            
            // 精确匹配或包含关系
            if (normalizedName === existingNorm || 
                (normalizedName.length > 3 && existingNorm.includes(normalizedName)) ||
                (existingNorm.length > 3 && normalizedName.includes(existingNorm))) {
                isDuplicate = true;
                break;
            }
            
            // 检查名字部分匹配（姓氏+名字组合）
            const nameParts = normalizedName.split(/\s+/);
            const existingParts = existingNorm.split(/\s+/);
            
            if (nameParts.length >= 2 && existingParts.length >= 2) {
                // 如果两个名字都有至少2部分，检查是否有足够的匹配
                const commonParts = nameParts.filter(part => 
                    existingParts.some(existing => existing === part && part.length > 2)
                );
                if (commonParts.length >= 2) {
                    isDuplicate = true;
                    break;
                }
            }
        }
        
        if (!isDuplicate && item.cleaned.length > 1) {
            usedCleanNames.add(item.cleaned);
            cleaned.add(item.cleaned); // 使用清理后的名称
        }
    }
    
    return cleaned;
}

// 测试数据 - Susan Abazia的不同格式
const testNames = new Set([
    'Susan Abazia Site Manager',
    'Abazia Susan -',
    'SUSAN ABAZIA L',
    'SUSAN COOK'
]);

console.log('原始姓名列表:');
testNames.forEach((name, index) => {
    console.log(`${index + 1}. "${name}"`);
});

console.log('\n执行智能去重和清理...\n');

const result = deduplicateNames(testNames);

console.log(`去重后的姓名 (${result.size}个):`);

let counter = 1;
result.forEach(name => {
    console.log(`${counter}. "${name}" ${counter === 1 ? '[主要]' : ''}`);
    counter++;
});

console.log(`\n原始数量: ${testNames.size}个`);
console.log(`去重后数量: ${result.size}个`);
console.log(`去除重复: ${testNames.size - result.size}个`);

// 显示清理过程
console.log('\n清理过程详情:');
testNames.forEach(name => {
    // 模拟清理过程
    let cleanName = name.trim();
    
    // 移除 Site Manager
    if (cleanName.includes('Site Manager')) {
        console.log(`"${name}" → 移除职位 "Site Manager" → "${cleanName.replace(/\s+Site Manager\s*$/gi, '').trim()}"`);
    } else if (cleanName.endsWith(' -')) {
        console.log(`"${name}" → 移除尾部符号 → "${cleanName.replace(/\s+\-+$/, '').trim()}"`);
    } else if (cleanName.endsWith(' L')) {
        console.log(`"${name}" → 移除尾部字母 → "${cleanName}"`);
    } else {
        console.log(`"${name}" → 无需清理 → "${cleanName}"`);
    }
});

process.exit(0);