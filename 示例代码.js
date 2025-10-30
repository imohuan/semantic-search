/**
 * AI 语义搜索 - 使用示例
 * 展示如何在项目中集成语义搜索功能
 */

import { ContentIndexer } from './nodes/content-indexer.js';

/**
 * 示例 1: 基础使用
 */
async function example1_basicUsage() {
  console.log('=== 示例 1: 基础使用 ===\n');

  // 1. 创建索引器
  const indexer = new ContentIndexer({
    modelName: 'Xenova/multilingual-e5-small',
    dimension: 384,
  });

  // 2. 初始化
  await indexer.initialize();

  // 3. 索引文档
  await indexer.indexContent(
    1,
    'https://example.com/doc1',
    '机器学习入门',
    '机器学习是人工智能的一个重要分支，它让计算机能够从数据中学习。'
  );

  // 4. 搜索
  const results = await indexer.searchContent('机器学习', 5);
  console.log('搜索结果:', results);
}

/**
 * 示例 2: 批量索引
 */
async function example2_batchIndexing() {
  console.log('\n=== 示例 2: 批量索引 ===\n');

  const indexer = new ContentIndexer();
  await indexer.initialize();

  // 准备多个文档
  const documents = [
    {
      pageId: 1,
      url: 'https://example.com/1',
      title: 'Python 编程',
      content: 'Python 是一种简单易学的编程语言...',
    },
    {
      pageId: 2,
      url: 'https://example.com/2',
      title: 'JavaScript 开发',
      content: 'JavaScript 是 Web 开发的核心语言...',
    },
  ];

  // 批量索引
  const results = await indexer.indexContentBatch(documents);
  console.log('索引结果:', results);

  // 搜索
  const searchResults = await indexer.searchContent('编程语言', 5);
  console.log('搜索结果:', searchResults);
}

/**
 * 示例 3: 索引管理
 */
async function example3_indexManagement() {
  console.log('\n=== 示例 3: 索引管理 ===\n');

  const indexer = new ContentIndexer();
  await indexer.initialize();

  // 索引文档
  await indexer.indexContent(1, 'url1', 'title1', 'content1');
  await indexer.indexContent(2, 'url2', 'title2', 'content2');

  // 获取统计信息
  const stats = indexer.getStats();
  console.log('统计信息:', stats);

  // 检查页面是否已索引
  console.log('页面 1 已索引:', indexer.isPageIndexed(1));

  // 获取已索引的页面列表
  const pages = indexer.getIndexedPages();
  console.log('已索引的页面:', pages);

  // 删除指定页面
  await indexer.removePageIndex(1);
  console.log('删除后的统计:', indexer.getStats());

  // 清空所有索引
  indexer.clearAll();
  console.log('清空后的统计:', indexer.getStats());
}

/**
 * 示例 4: 跨语言搜索
 */
async function example4_crossLanguageSearch() {
  console.log('\n=== 示例 4: 跨语言搜索 ===\n');

  const indexer = new ContentIndexer();
  await indexer.initialize();

  // 索引不同语言的文档
  await indexer.indexContent(
    1,
    'url1',
    'Machine Learning',
    'Machine learning is a branch of artificial intelligence...'
  );

  await indexer.indexContent(
    2,
    'url2',
    '機械学習',
    '機械学習は人工知能の一分野です...'
  );

  await indexer.indexContent(3, 'url3', '机器学习', '机器学习是人工智能的一个分支...');

  // 使用中文查询，可以找到所有语言的相关内容
  const results = await indexer.searchContent('机器学习', 5);
  console.log('跨语言搜索结果:', results);
}

/**
 * 示例 5: 自定义配置
 */
async function example5_customConfig() {
  console.log('\n=== 示例 5: 自定义配置 ===\n');

  const indexer = new ContentIndexer({
    // 文本分块配置
    maxWordsPerChunk: 100, // 每块最大词数
    overlapSentences: 2, // 重叠句子数
    minChunkLength: 30, // 最小块长度

    // 模型配置
    modelName: 'Xenova/multilingual-e5-small',
    dimension: 384,
    cacheDir: './.cache/transformers',

    // 向量数据库配置
    maxElements: 20000, // 最大存储数量
    maxCacheSize: 2000, // 缓存大小
  });

  await indexer.initialize();

  console.log('自定义配置已应用');
  console.log('统计信息:', indexer.getStats());
}

// 运行示例（取消注释以运行）
// example1_basicUsage();
// example2_batchIndexing();
// example3_indexManagement();
// example4_crossLanguageSearch();
// example5_customConfig();

// 导出示例函数
export {
  example1_basicUsage,
  example2_batchIndexing,
  example3_indexManagement,
  example4_crossLanguageSearch,
  example5_customConfig,
};

