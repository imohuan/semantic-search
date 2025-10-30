/**
 * 内容索引器 - Node.js 版本
 * 可以在 Node.js 和 Electron 主进程中运行
 */

import { TextChunker } from './text-chunker.js';
import { SemanticEngine } from './semantic-engine.js';
import { VectorDatabase } from './vector-database.js';

export class ContentIndexer {
  constructor(config = {}) {
    // 初始化各个组件
    this.textChunker = new TextChunker({
      maxWordsPerChunk: config.maxWordsPerChunk || 80,
      overlapSentences: config.overlapSentences || 1,
      minChunkLength: config.minChunkLength || 20,
    });

    this.semanticEngine = new SemanticEngine({
      modelName: config.modelName || 'Xenova/multilingual-e5-small',
      dimension: config.dimension || 384,
      cacheDir: config.cacheDir,
      localModelPath: config.localModelPath,
      maxCacheSize: config.maxCacheSize || 1000,
    });

    this.vectorDatabase = new VectorDatabase({
      dimension: config.dimension || 384,
      maxElements: config.maxElements || 10000,
      M: config.M || 16,
      efConstruction: config.efConstruction || 200,
      efSearch: config.efSearch || 100,
    });

    // 状态
    this.isInitialized = false;
    this.indexedPages = new Map(); // pageId -> metadata

    console.log('ContentIndexer (Node.js版) 已创建');
  }

  /**
   * 初始化索引器
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    console.log('正在初始化内容索引器（Node.js版）...');

    try {
      // 并行初始化各组件
      await Promise.all([this.semanticEngine.initialize(), this.vectorDatabase.initialize()]);

      this.isInitialized = true;
      console.log('✅ 内容索引器初始化完成');
    } catch (error) {
      console.error('❌ 内容索引器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 索引页面内容
   */
  async indexContent(pageId, url, title, content) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`\n📄 开始索引页面: ${title}`);
    console.log(`   URL: ${url}`);
    console.log(`   内容长度: ${content.length} 字符`);

    const startTime = Date.now();

    try {
      // 1. 文本分块
      console.log('1️⃣ 文本分块...');
      const chunks = this.textChunker.chunkText(content, title);
      console.log(`   ✓ 生成 ${chunks.length} 个文本块`);

      if (chunks.length === 0) {
        console.warn('   ⚠️ 没有生成任何文本块，跳过索引');
        return {
          pageId,
          chunksIndexed: 0,
          timeElapsed: Date.now() - startTime,
        };
      }

      // 2. 批量生成 Embedding
      console.log('2️⃣ 生成向量...');
      const texts = chunks.map((c) => c.text);
      const embeddings = await this.semanticEngine.getEmbeddingsBatch(texts, 'passage');
      console.log(`   ✓ 生成 ${embeddings.length} 个向量`);

      // 3. 存储到向量数据库
      console.log('3️⃣ 存储向量...');
      const vectorIds = [];

      for (let i = 0; i < chunks.length; i++) {
        try {
          const vectorId = await this.vectorDatabase.addDocument(
            pageId,
            url,
            title,
            chunks[i],
            embeddings[i]
          );
          vectorIds.push(vectorId);
        } catch (error) {
          console.error(`   ✗ 第 ${i + 1} 个块存储失败:`, error.message);
        }
      }

      console.log(`   ✓ 成功存储 ${vectorIds.length} 个向量`);

      // 4. 记录索引信息
      this.indexedPages.set(pageId, {
        pageId,
        url,
        title,
        chunksCount: chunks.length,
        vectorIds,
        indexedAt: Date.now(),
      });

      const timeElapsed = Date.now() - startTime;
      console.log(`✅ 索引完成 (耗时: ${(timeElapsed / 1000).toFixed(2)}秒)`);

      return {
        pageId,
        chunksIndexed: chunks.length,
        timeElapsed,
        vectorIds,
      };
    } catch (error) {
      console.error('❌ 索引失败:', error);
      throw error;
    }
  }

  /**
   * 批量索引多个页面
   */
  async indexContentBatch(pages) {
    console.log(`\n📚 批量索引 ${pages.length} 个页面...`);

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      console.log(`\n进度: ${i + 1}/${pages.length}`);

      try {
        const result = await this.indexContent(
          page.pageId,
          page.url,
          page.title,
          page.content
        );
        results.push({ ...result, success: true });
        successCount++;
      } catch (error) {
        console.error(`页面 ${page.pageId} 索引失败:`, error.message);
        results.push({
          pageId: page.pageId,
          success: false,
          error: error.message,
        });
        failCount++;
      }
    }

    console.log(`\n✅ 批量索引完成: 成功 ${successCount}, 失败 ${failCount}`);

    return results;
  }

  /**
   * 搜索内容
   */
  async searchContent(query, topK = 10, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`\n🔍 搜索: "${query}"`);
    const startTime = Date.now();

    try {
      // 1. 查询文本转向量
      const queryEmbedding = await this.semanticEngine.getEmbedding(query);

      // 2. 向量搜索
      const results = await this.vectorDatabase.search(queryEmbedding, topK * 3);

      // 3. 按页面去重
      const deduplicatedResults = this.deduplicateByPage(results);

      // 4. 取前 topK 个
      const topResults = deduplicatedResults.slice(0, topK);

      const timeElapsed = Date.now() - startTime;
      console.log(`✅ 搜索完成，找到 ${topResults.length} 个结果 (耗时: ${timeElapsed}ms)`);

      // 5. 格式化结果
      return topResults.map((result, index) => ({
        rank: index + 1,
        pageId: result.pageId,
        url: result.url,
        title: result.title,
        similarity: result.similarity,
        snippet: this.generateSnippet(result.chunk.text, query),
        chunkSource: result.chunk.source,
        matchedText: result.chunk.text,
      }));
    } catch (error) {
      console.error('❌ 搜索失败:', error);
      throw error;
    }
  }

  /**
   * 按页面去重
   */
  deduplicateByPage(results) {
    const pageMap = new Map();

    for (const result of results) {
      const { pageId, similarity } = result;

      if (!pageMap.has(pageId) || pageMap.get(pageId).similarity < similarity) {
        pageMap.set(pageId, result);
      }
    }

    return Array.from(pageMap.values()).sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * 生成搜索结果片段
   */
  generateSnippet(text, query, maxLength = 200) {
    if (text.length <= maxLength) {
      return text;
    }

    const queryWords = query.toLowerCase().split(/\s+/);
    const textLower = text.toLowerCase();

    let bestPosition = 0;
    let maxMatches = 0;

    for (let i = 0; i < text.length - maxLength; i += 50) {
      const window = textLower.substring(i, i + maxLength);
      const matches = queryWords.filter((word) => window.includes(word)).length;

      if (matches > maxMatches) {
        maxMatches = matches;
        bestPosition = i;
      }
    }

    let snippet = text.substring(bestPosition, bestPosition + maxLength);

    if (bestPosition > 0) snippet = '...' + snippet;
    if (bestPosition + maxLength < text.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * 删除页面索引
   */
  async removePageIndex(pageId) {
    console.log(`🗑️ 删除页面索引: ${pageId}`);

    await this.vectorDatabase.removeByPageId(pageId);
    this.indexedPages.delete(pageId);

    console.log(`✅ 页面索引已删除`);
  }

  /**
   * 清空所有索引
   */
  clearAll() {
    console.log('🗑️ 清空所有索引...');

    this.vectorDatabase.clear();
    this.indexedPages.clear();
    this.semanticEngine.clearCache();

    console.log('✅ 所有索引已清空');
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const dbStats = this.vectorDatabase.getStats();
    const engineStats = this.semanticEngine.getStats();

    return {
      isInitialized: this.isInitialized,
      indexedPagesCount: this.indexedPages.size,
      totalDocuments: dbStats.totalDocuments,
      totalVectors: dbStats.totalVectors,
      capacityUsage: dbStats.capacityUsage,
      modelName: engineStats.modelName,
      dimension: engineStats.dimension,
      cacheSize: engineStats.cacheSize,
    };
  }

  /**
   * 获取已索引的页面列表
   */
  getIndexedPages() {
    return Array.from(this.indexedPages.values());
  }

  /**
   * 检查页面是否已索引
   */
  isPageIndexed(pageId) {
    return this.indexedPages.has(pageId);
  }

  /**
   * 释放资源
   */
  dispose() {
    this.semanticEngine.dispose();
    this.vectorDatabase.clear();
    this.indexedPages.clear();
    this.isInitialized = false;

    console.log('ContentIndexer 已释放资源');
  }
}
