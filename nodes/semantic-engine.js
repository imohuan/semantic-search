/**
 * 语义相似度引擎
 * 使用 transformers.js 加载 Embedding 模型并生成向量
 */

import { pipeline, env } from '@xenova/transformers';

export class SemanticEngine {
  constructor(config = {}) {
    // 模型配置
    this.modelName = config.modelName || 'Xenova/multilingual-e5-small';
    this.dimension = config.dimension || 384; // small: 384, base: 768
    this.useQuantized = config.useQuantized !== false; // 默认使用量化模型

    // 状态
    this.pipe = null;
    this.isInitialized = false;
    this.isInitializing = false;

    // 缓存
    this.embeddingCache = new Map();
    this.maxCacheSize = config.maxCacheSize || 1000;

    // 配置模型缓存路径
    if (config.cacheDir) {
      env.cacheDir = config.cacheDir;
    }

    // 配置本地模型路径（如果有）
    if (config.localModelPath) {
      env.localModelPath = config.localModelPath;
      env.allowLocalModels = true;
      env.allowRemoteModels = false;
    }

    console.log('SemanticEngine 配置:', {
      modelName: this.modelName,
      dimension: this.dimension,
      cacheDir: env.cacheDir,
      useQuantized: this.useQuantized,
    });
  }

  /**
   * 初始化模型
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    if (this.isInitializing) {
      // 等待正在进行的初始化
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    this.isInitializing = true;

    try {
      console.log(`正在加载模型: ${this.modelName}...`);
      const startTime = Date.now();

      // 使用 feature-extraction pipeline
      this.pipe = await pipeline('feature-extraction', this.modelName, {
        quantized: this.useQuantized,
        // 进度回调（可选）
        progress_callback: (progress) => {
          if (progress.status === 'downloading') {
            const percent = ((progress.loaded / progress.total) * 100).toFixed(2);
            console.log(`下载模型: ${progress.file} - ${percent}%`);
          }
        },
      });

      const loadTime = Date.now() - startTime;
      console.log(`模型加载完成 (耗时: ${(loadTime / 1000).toFixed(2)}秒)`);

      this.isInitialized = true;
    } catch (error) {
      console.error('模型加载失败:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * 获取文本的 Embedding 向量
   * @param {string} text - 输入文本
   * @returns {Promise<Float32Array>} - 向量
   */
  async getEmbedding(text) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 检查缓存
    const cacheKey = this.getCacheKey(text);
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey);
    }

    try {
      // E5 模型需要 "query: " 前缀用于查询文本
      // 对于文档文本使用 "passage: " 前缀
      const prefixedText = this.addPrefix(text, 'query');

      // 生成 Embedding
      const output = await this.pipe(prefixedText, {
        pooling: 'mean', // 平均池化
        normalize: true, // 归一化
      });

      // 转换为 Float32Array
      const embedding = new Float32Array(output.data);

      // 缓存结果
      this.cacheEmbedding(cacheKey, embedding);

      return embedding;
    } catch (error) {
      console.error('生成 Embedding 失败:', error);
      throw error;
    }
  }

  /**
   * 批量获取 Embedding（用于索引文档）
   * @param {string[]} texts - 文本数组
   * @param {string} textType - 'query' 或 'passage'
   * @returns {Promise<Float32Array[]>}
   */
  async getEmbeddingsBatch(texts, textType = 'passage') {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const embeddings = [];
    const uncachedTexts = [];
    const uncachedIndices = [];

    // 检查缓存
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      const cacheKey = this.getCacheKey(text, textType);

      if (this.embeddingCache.has(cacheKey)) {
        embeddings[i] = this.embeddingCache.get(cacheKey);
      } else {
        uncachedTexts.push(text);
        uncachedIndices.push(i);
      }
    }

    // 处理未缓存的文本
    if (uncachedTexts.length > 0) {
      console.log(`批量生成 Embedding: ${uncachedTexts.length} 个文本`);

      for (let i = 0; i < uncachedTexts.length; i++) {
        const text = uncachedTexts[i];
        const prefixedText = this.addPrefix(text, textType);

        try {
          const output = await this.pipe(prefixedText, {
            pooling: 'mean',
            normalize: true,
          });

          const embedding = new Float32Array(output.data);
          const originalIndex = uncachedIndices[i];
          embeddings[originalIndex] = embedding;

          // 缓存
          const cacheKey = this.getCacheKey(text, textType);
          this.cacheEmbedding(cacheKey, embedding);

          // 显示进度
          if ((i + 1) % 10 === 0 || i === uncachedTexts.length - 1) {
            console.log(`  进度: ${i + 1}/${uncachedTexts.length}`);
          }
        } catch (error) {
          console.error(`文本 ${originalIndex} 生成 Embedding 失败:`, error);
          // 使用零向量占位
          embeddings[originalIndex] = new Float32Array(this.dimension);
        }
      }
    }

    return embeddings;
  }

  /**
   * 添加模型特定的前缀
   */
  addPrefix(text, type = 'query') {
    // E5 模型要求：
    // - 查询文本前加 "query: "
    // - 文档文本前加 "passage: "
    if (this.modelName.includes('e5')) {
      if (type === 'query' && !text.startsWith('query:')) {
        return `query: ${text}`;
      } else if (type === 'passage' && !text.startsWith('passage:')) {
        return `passage: ${text}`;
      }
    }

    return text;
  }

  /**
   * 生成缓存键
   */
  getCacheKey(text, type = 'query') {
    return `${type}:${text}`;
  }

  /**
   * 缓存 Embedding
   */
  cacheEmbedding(key, embedding) {
    // LRU 缓存：达到上限时删除最旧的
    if (this.embeddingCache.size >= this.maxCacheSize) {
      const firstKey = this.embeddingCache.keys().next().value;
      this.embeddingCache.delete(firstKey);
    }

    this.embeddingCache.set(key, embedding);
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.embeddingCache.clear();
    console.log('Embedding 缓存已清空');
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      modelName: this.modelName,
      dimension: this.dimension,
      cacheSize: this.embeddingCache.size,
      maxCacheSize: this.maxCacheSize,
    };
  }

  /**
   * 释放资源
   */
  dispose() {
    this.pipe = null;
    this.isInitialized = false;
    this.clearCache();
    console.log('SemanticEngine 已释放');
  }
}

