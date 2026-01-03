#!/usr/bin/env node

/**
 * 性能测试脚本
 * 用于验证 API 优化效果
 * 
 * 运行方式：
 * node scripts/test-performance.js
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 测试 API 响应时间
async function testAPIPerformance(url, headers = {}) {
  const start = Date.now();
  
  try {
    const response = await fetch(url, { headers });
    const duration = Date.now() - start;
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      duration,
      dataSize: JSON.stringify(data).length,
      cacheControl: response.headers.get('cache-control'),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      duration: Date.now() - start,
    };
  }
}

// 测试重复请求（检查缓存）
async function testCaching(url, headers = {}) {
  log('\n📊 测试缓存效果...', 'cyan');
  
  const results = [];
  
  for (let i = 1; i <= 3; i++) {
    log(`  请求 #${i}...`, 'blue');
    const result = await testAPIPerformance(url, headers);
    results.push(result);
    
    if (result.success) {
      log(`    ✓ 响应时间: ${result.duration}ms`, 'green');
      log(`    ✓ 数据大小: ${(result.dataSize / 1024).toFixed(2)} KB`, 'green');
      log(`    ✓ Cache-Control: ${result.cacheControl || 'none'}`, 'green');
    } else {
      log(`    ✗ 失败: ${result.error}`, 'red');
    }
    
    // 等待 100ms 再发下一个请求
    if (i < 3) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // 分析结果
  if (results.every(r => r.success)) {
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const improvement = ((results[0].duration - avgDuration) / results[0].duration * 100).toFixed(1);
    
    log('\n📈 缓存效果分析:', 'cyan');
    log(`  第一次请求: ${results[0].duration}ms`, 'yellow');
    log(`  平均响应时间: ${avgDuration.toFixed(0)}ms`, 'yellow');
    
    if (improvement > 0) {
      log(`  ✓ 性能提升: ${improvement}%`, 'green');
    } else {
      log(`  ⚠ 未检测到明显缓存效果`, 'yellow');
    }
  }
  
  return results;
}

// 测试并发请求（检查是否有重复调用）
async function testConcurrentRequests(url, headers = {}) {
  log('\n🔄 测试并发请求...', 'cyan');
  
  const start = Date.now();
  const promises = Array(5).fill(null).map((_, i) => {
    log(`  启动并发请求 #${i + 1}...`, 'blue');
    return testAPIPerformance(url, headers);
  });
  
  const results = await Promise.all(promises);
  const totalDuration = Date.now() - start;
  
  const successCount = results.filter(r => r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  log('\n📊 并发测试结果:', 'cyan');
  log(`  成功请求: ${successCount}/5`, successCount === 5 ? 'green' : 'red');
  log(`  总耗时: ${totalDuration}ms`, 'yellow');
  log(`  平均响应时间: ${avgDuration.toFixed(0)}ms`, 'yellow');
  
  if (totalDuration < avgDuration * 2) {
    log('  ✓ 并发处理良好（请求被并行处理）', 'green');
  } else {
    log('  ⚠ 可能存在串行处理', 'yellow');
  }
  
  return results;
}

// 主测试函数
async function runTests() {
  log('🚀 开始性能测试\n', 'cyan');
  log('⚠️  注意：此脚本需要有效的认证 token', 'yellow');
  log('⚠️  请确保开发服务器正在运行（npm run dev）\n', 'yellow');
  
  // 这里需要替换为实际的 token
  const token = process.env.TEST_AUTH_TOKEN;
  
  if (!token) {
    log('❌ 错误：未设置 TEST_AUTH_TOKEN 环境变量', 'red');
    log('   使用方法：TEST_AUTH_TOKEN=your_token node scripts/test-performance.js', 'yellow');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
  };
  
  const testUrl = `${API_BASE_URL}/api/job-postings`;
  
  try {
    // 测试 1: 缓存效果
    await testCaching(testUrl, headers);
    
    // 等待 2 秒
    log('\n⏳ 等待 2 秒...\n', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 测试 2: 并发请求
    await testConcurrentRequests(testUrl, headers);
    
    log('\n✅ 测试完成！', 'green');
    log('\n💡 优化建议:', 'cyan');
    log('  1. 检查浏览器 Network 面板，确认 API 只被调用一次', 'yellow');
    log('  2. 查看终端日志，确认没有重复的 "Fetching job postings" 消息', 'yellow');
    log('  3. 检查 Prisma 日志，确认查询都有 LIMIT 子句', 'yellow');
    
  } catch (error) {
    log(`\n❌ 测试失败: ${error.message}`, 'red');
    console.error(error);
  }
}

// 运行测试
runTests().catch(console.error);


