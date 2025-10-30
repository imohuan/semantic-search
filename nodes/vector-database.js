/**
 * 向量数据库 - 纯 JavaScript 实现
 * 不需要任何原生模块，可在任何 Node.js 环境中运行
 * 适合中小规模数据（< 10,000 文档）
 */

export class VectorDatabase {
  constructor(config = {}) {
    // 配置
    this.dimension = config.dimension || 384;
    this.maxElements = config.maxElements || 10000;

    // 状态
    this.vectors = []; // 存储所有向量
    this.documents = new Map(); // vectorId -> document metadata
    this.nextVectorId = 0;
    this.isInitialized = false;

    console.log('VectorDatabase (纯JS版) 配置:', {
      dimension: this.dimension,
      maxElements: this.maxElements,
    });
  }

  /**
   * 初始化向量数据库
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('初始化向量数据库（纯JS版）...');
      this.isInitialized = true;
      console.log('向量数据库初始化完成');
    } catch (error) {
      console.error('向量数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 添加文档
   */
  async addDocument(pageId, url, title, chunk, embedding) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // 验证向量维度
      if (embedding.length !== this.dimension) {
        throw new Error(
          `向量维度不匹配: 期望 ${this.dimension}, 实际 ${embedding.length}`
        );
      }

      // 检查是否达到容量上限
      if (this.vectors.length >= this.maxElements) {
        console.warn(`向量数据库已达到最大容量: ${this.maxElements}`);
        throw new Error('向量数据库已满，请清理旧数据');
      }

      const vectorId = this.nextVectorId++;

      // 存储向量
      this.vectors.push({
        id: vectorId,
        vector: embedding,
      });

      // 存储文档元数据
      const document = {
        vectorId,
        pageId,
        url,
        title,
        chunk,
        timestamp: Date.now(),
      };

      this.documents.set(vectorId, document);

      return vectorId;
    } catch (error) {
      console.error('添加文档失败:', error);
      throw error;
    }
  }

  /**
   * 搜索相似文档
   */
  async search(queryEmbedding, topK = 10) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // 验证查询向量
      if (!queryEmbedding || queryEmbedding.length !== this.dimension) {
        throw new Error(
          `查询向量维度无效: 期望 ${this.dimension}, 实际 ${queryEmbedding?.length || 0}`
        );
      }

      // 检查索引是否为空
      if (this.vectors.length === 0) {
        console.log('向量数据库为空，返回空结果');
        return [];
      }

      // 计算所有向量与查询向量的余弦相似度
      const similarities = [];

      for (const item of this.vectors) {
        const similarity = this.cosineSimilarity(queryEmbedding, item.vector);
        const doc = this.documents.get(item.id);

        if (doc) {
          similarities.push({
            ...doc,
            similarity,
            distance: 1 - similarity,
          });
        }
      }

      // 按相似度排序并返回前 topK 个
      const topResults = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, Math.min(topK, similarities.length))
        .map((result, index) => ({
          ...result,
          rank: index + 1,
        }));

      return topResults;
    } catch (error) {
      console.error('搜索失败:', error);
      throw error;
    }
  }

  /**
   * 计算余弦相似度
   */
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

    if (magnitude === 0) {
      return 0;
    }

    return dotProduct / magnitude;
  }

  /**
   * 根据页面ID删除文档
   */
  async removeByPageId(pageId) {
    // 删除文档元数据
    for (const [vectorId, doc] of this.documents.entries()) {
      if (doc.pageId === pageId) {
        this.documents.delete(vectorId);

        // 从向量数组中删除
        const index = this.vectors.findIndex(v => v.id === vectorId);
        if (index !== -1) {
          this.vectors.splice(index, 1);
        }
      }
    }
  }

  /**
   * 清空所有数据
   */
  clear() {
    this.vectors = [];
    this.documents.clear();
    this.nextVectorId = 0;
    console.log('向量数据库已清空');
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalDocuments: this.documents.size,
      totalVectors: this.vectors.length,
      dimension: this.dimension,
      maxElements: this.maxElements,
      capacityUsage: ((this.vectors.length / this.maxElements) * 100).toFixed(2) + '%',
    };
  }

  /**
   * 获取所有页面ID
   */
  getAllPageIds() {
    const pageIds = new Set();
    for (const doc of this.documents.values()) {
      pageIds.add(doc.pageId);
    }
    return Array.from(pageIds);
  }

  /**
   * 获取指定页面的所有文档
   */
  getDocumentsByPageId(pageId) {
    const docs = [];
    for (const doc of this.documents.values()) {
      if (doc.pageId === pageId) {
        docs.push(doc);
      }
    }
    return docs;
  }
}
