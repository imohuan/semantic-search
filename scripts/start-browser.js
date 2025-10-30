/**
 * 浏览器版本启动脚本
 * 在默认浏览器中打开 semantic-search-browser.html
 */

import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { platform } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// HTML 文件路径
const htmlPath = join(__dirname, '..', 'semantic-search-browser.html');

// 根据操作系统选择打开命令
const getOpenCommand = () => {
  const os = platform();

  switch (os) {
    case 'darwin': // macOS
      return 'open';
    case 'win32': // Windows
      return 'start';
    default: // Linux 等
      return 'xdg-open';
  }
};

const openCommand = getOpenCommand();
const command = `${openCommand} "${htmlPath}"`;

console.log('🚀 正在启动浏览器版本...');
console.log(`📄 文件路径: ${htmlPath}`);
console.log(`💻 操作系统: ${platform()}`);
console.log(`🔧 执行命令: ${command}\n`);

exec(command, (error) => {
  if (error) {
    console.error('❌ 启动失败:', error.message);
    console.log('\n💡 请手动打开文件:');
    console.log(`   ${htmlPath}\n`);
    process.exit(1);
  }

  console.log('✅ 浏览器已打开！');
  console.log('\n📖 使用说明:');
  console.log('   1. 点击「初始化语义搜索引擎」按钮');
  console.log('   2. 等待模型加载完成（首次约 1-2 分钟）');
  console.log('   3. 点击「索引示例文档」或添加自定义内容');
  console.log('   4. 输入查询词进行搜索\n');
});

