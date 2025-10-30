/**
 * 语义搜索演示
 * 展示如何在你的 AutoBrowser 项目中集成语义搜索
 * 
 * 使用方式:
 * 1. 安装依赖: pnpm add @xenova/transformers hnswlib-wasm-static
 * 2. 运行此文件: node src/semantic-search/semantic-search-demo.js
 */

import { ContentIndexer } from './content-indexer.js'; // Node.js 版本
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 模拟 Electron app.getPath('userData')
const userDataPath = path.join(__dirname, '../.cache');

/**
 * 演示1: 基础使用
 */
async function demo1_basicUsage() {
  console.log('\n========== 演示1: 基础使用 ==========\n');

  // 创建索引器
  const indexer = new ContentIndexer({
    modelName: 'Xenova/multilingual-e5-small',
    dimension: 384,
    cacheDir: path.join(userDataPath, 'transformers'),
    maxElements: 1000,
  });

  // 初始化（首次运行会下载模型）
  console.log('正在初始化语义搜索引擎...');
  await indexer.initialize();
  console.log('✅ 初始化完成\n');

  // 索引一些示例文档
  console.log('开始索引文档...\n');

  await indexer.indexContent(
    1,
    'https://example.com/ml-basics',
    '机器学习基础教程',
    `机器学习是人工智能的一个重要分支。它让计算机能够从数据中学习规律，
    而不需要明确编程。常见的机器学习算法包括决策树、随机森林、支持向量机等。
    监督学习使用标注数据训练模型，而无监督学习则从未标注的数据中发现模式。`
  );

  await indexer.indexContent(
    2,
    'https://example.com/deep-learning',
    '深度学习入门',
    `深度学习是机器学习的一个子领域，使用多层神经网络来学习数据的复杂表示。
    卷积神经网络(CNN)在图像识别领域表现出色，循环神经网络(RNN)和长短期记忆网络(LSTM)
    在序列数据处理方面有独特优势。Transformer架构的出现引领了自然语言处理的革命。`
  );

  await indexer.indexContent(
    3,
    'https://example.com/python-intro',
    'Python编程入门',
    `Python是一种简洁优雅的编程语言，广泛应用于数据科学、Web开发、自动化脚本等领域。
    Python的语法简单易学，拥有丰富的第三方库。NumPy用于数值计算，Pandas用于数据处理，
    Matplotlib用于数据可视化，scikit-learn用于机器学习。`
  );

  await indexer.indexContent(
    4,
    'https://example.com/javascript-guide',
    'JavaScript开发指南',
    `JavaScript是Web开发的核心语言，可以在浏览器和Node.js环境中运行。
    现代JavaScript支持ES6+特性，包括箭头函数、解构、模板字符串、Promise和async/await。
    React、Vue、Angular是流行的前端框架，Express是常用的后端框架。`
  );

  await indexer.indexContent(
    5,
    'https://example.com/electron-tutorial',
    'Electron桌面应用开发',
    `Electron是一个使用Web技术构建跨平台桌面应用的框架。它结合了Chromium和Node.js，
    允许使用HTML、CSS、JavaScript开发桌面应用。主进程负责应用生命周期和原生功能，
    渲染进程负责显示界面。IPC机制用于主进程和渲染进程之间的通信。`
  );

  console.log('✅ 所有文档索引完成\n');

  // 显示统计信息
  const stats = indexer.getStats();
  console.log('📊 索引统计:');
  console.log(`   - 已索引页面: ${stats.indexedPagesCount}`);
  console.log(`   - 总文档数: ${stats.totalDocuments}`);
  console.log(`   - 总向量数: ${stats.totalVectors}`);
  console.log(`   - 容量使用: ${stats.capacityUsage}`);
  console.log(`   - 缓存大小: ${stats.cacheSize}\n`);

  // 搜索演示
  const queries = [
    '机器学习算法',
    'neural networks',
    'Python数据处理',
    '桌面应用开发',
    'Web框架',
  ];

  for (const query of queries) {
    console.log(`\n🔍 搜索: "${query}"`);
    console.log('─'.repeat(60));

    const results = await indexer.searchContent(query, 3);

    if (results.length === 0) {
      console.log('   没有找到相关结果\n');
      continue;
    }

    results.forEach((result, index) => {
      console.log(`
${index + 1}. ${result.title}
   URL: ${result.url}
   相似度: ${(result.similarity * 100).toFixed(2)}%
   片段: ${result.snippet.substring(0, 100)}...
      `);
    });
  }

  console.log('\n✅ 演示完成');
}

/**
 * 演示2: 跨语言搜索
 */
async function demo2_crossLanguageSearch() {
  console.log('\n========== 演示2: 跨语言搜索 ==========\n');

  const indexer = new ContentIndexer({
    modelName: 'Xenova/multilingual-e5-small',
    dimension: 384,
    cacheDir: path.join(userDataPath, 'transformers'),
  });

  await indexer.initialize();

  // 索引多语言文档
  await indexer.indexContent(
    1,
    'url1',
    'Machine Learning Tutorial',
    'Machine learning is a method of data analysis that automates analytical model building. It is a branch of artificial intelligence based on the idea that systems can learn from data, identify patterns and make decisions with minimal human intervention.'
  );

  await indexer.indexContent(
    2,
    'url2',
    '机器学习教程',
    '机器学习是一种数据分析方法，它能够自动构建分析模型。它是人工智能的一个分支，基于这样的理念：系统可以从数据中学习、识别模式并做出决策，而几乎不需要人为干预。'
  );

  await indexer.indexContent(
    3,
    'url3',
    '機械学習チュートリアル',
    '機械学習は、分析モデルの構築を自動化するデータ分析の手法です。人間の介入を最小限に抑えて、システムがデータから学習し、パターンを識別し、意思決定を行うことができるという考えに基づいた人工知能の一分野です。'
  );

  // 跨语言搜索测试
  const crossLangQueries = [
    { query: '机器学习', lang: '中文' },
    { query: 'machine learning', lang: 'English' },
    { query: '機械学習', lang: '日本語' },
  ];

  for (const { query, lang } of crossLangQueries) {
    console.log(`\n🔍 ${lang}查询: "${query}"`);
    console.log('─'.repeat(60));

    const results = await indexer.searchContent(query, 5);

    results.forEach((result, index) => {
      console.log(`
${index + 1}. ${result.title}
   相似度: ${(result.similarity * 100).toFixed(2)}%
      `);
    });
  }

  console.log('\n✅ 跨语言搜索演示完成');
  console.log('💡 注意: E5模型可以找到语义相似的内容，即使使用不同语言查询');
}

/**
 * 演示3: 模拟 Electron 场景
 */
async function demo3_electronScenario() {
  console.log('\n========== 演示3: Electron 场景模拟 ==========\n');

  const indexer = new ContentIndexer({
    modelName: 'Xenova/multilingual-e5-small',
    dimension: 384,
    cacheDir: path.join(userDataPath, 'transformers'),
  });

  await indexer.initialize();

  // 模拟多个浏览器标签页
  const mockTabs = [
    {
      id: 1,
      url: 'https://github.com/electron/electron',
      title: 'Electron | Build cross-platform desktop apps',
      content:
        'Build cross-platform desktop apps with JavaScript, HTML, and CSS. Electron combines the Chromium rendering engine and the Node.js runtime.',
    },
    {
      id: 2,
      url: 'https://nodejs.org/',
      title: 'Node.js',
      content:
        'Node.js® is a JavaScript runtime built on Chrome V8 JavaScript engine. Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient.',
    },
    {
      id: 3,
      url: 'https://www.chromium.org/',
      title: 'The Chromium Projects',
      content:
        'The Chromium projects include Chromium and Chromium OS, the open-source projects behind the Google Chrome browser and Google Chrome OS.',
    },
    {
      id: 4,
      url: 'https://developer.mozilla.org/docs/Web/API',
      title: 'Web APIs | MDN',
      content:
        'Web APIs are typically used with JavaScript, although this does not always have to be the case. The reference pages list interfaces, methods, and properties.',
    },
    {
      id: 5,
      url: 'https://www.typescriptlang.org/',
      title: 'TypeScript',
      content:
        'TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.',
    },
  ];

  // 批量索引
  console.log('正在索引所有标签页...\n');

  for (const tab of mockTabs) {
    await indexer.indexContent(tab.id, tab.url, tab.title, tab.content);
  }

  console.log('✅ 索引完成\n');

  // 搜索场景
  const searchScenarios = [
    {
      desc: '查找与 Electron 相关的标签页',
      query: 'desktop application framework',
    },
    {
      desc: '查找 JavaScript 运行时',
      query: 'JavaScript runtime',
    },
    {
      desc: '查找浏览器相关内容',
      query: 'browser engine',
    },
  ];

  for (const scenario of searchScenarios) {
    console.log(`\n📋 场景: ${scenario.desc}`);
    console.log(`🔍 查询: "${scenario.query}"`);
    console.log('─'.repeat(60));

    const results = await indexer.searchContent(scenario.query, 3);

    if (results.length > 0) {
      console.log(`   找到 ${results.length} 个匹配的标签页:\n`);

      results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.title}`);
        console.log(`      ${result.url}`);
        console.log(`      相似度: ${(result.similarity * 100).toFixed(2)}%\n`);
      });
    } else {
      console.log('   没有找到匹配的标签页\n');
    }
  }

  console.log('✅ Electron 场景演示完成');
}

/**
 * 主函数
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║       语义搜索演示 - AutoBrowser 集成示例              ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  console.log('\n📦 依赖检查...');

  try {
    await import('@xenova/transformers');
    console.log('✓ @xenova/transformers 已安装');
  } catch (error) {
    console.error('✗ @xenova/transformers 未安装');
    console.error('请运行: pnpm add @xenova/transformers');
    return;
  }

  try {
    await import('hnswlib-wasm-static/dist/hnswlib.js');
    console.log('✓ hnswlib-wasm-static 已安装');
  } catch (error) {
    console.error('✗ hnswlib-wasm-static 未安装');
    console.error('请运行: pnpm add hnswlib-wasm-static');
    console.error('错误:', error.message);
    return;
  }

  console.log('\n✅ 所有依赖已就绪\n');

  try {
    // 运行演示
    await demo1_basicUsage();
    // await demo2_crossLanguageSearch();
    // await demo3_electronScenario();

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                                                        ║');
    console.log('║                ✅ 所有演示完成                          ║');
    console.log('║                                                        ║');
    console.log('║  下一步:                                               ║');
    console.log('║  1. 查看 src/semantic-search/README.md                 ║');
    console.log('║  2. 查看 src/semantic-search/example.js                ║');
    console.log('║  3. 集成到你的 main.js 中                              ║');
    console.log('║                                                        ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ 演示失败:', error);
    console.error('\n请检查:');
    console.error('1. 依赖是否正确安装');
    console.error('2. 网络连接是否正常（首次运行需要下载模型）');
    console.error('3. 磁盘空间是否充足（模型约116MB）\n');
  }
}

// 运行演示
main();

