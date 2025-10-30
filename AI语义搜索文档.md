# AI 语义搜索功能文档

## 概述

本项目集成了强大的 AI 驱动语义搜索功能，基于 `mcp-chrome` 库的核心实现。可以在 Node.js 和 Electron 环境中运行，支持多语言智能搜索。

## 快速开始

### 1. 安装依赖

```bash
pnpm add @xenova/transformers
```

### 2. 运行演示

```bash
node src/semantic-search-demo.js
```

### 3. 在代码中使用

```javascript
import { ContentIndexer } from "./src/semantic-search/content-indexer-node.js";

// 创建索引器
const indexer = new ContentIndexer({
  modelName: "Xenova/multilingual-e5-small", // 小模型（384维）
  dimension: 384,
  cacheDir: "./.cache/transformers", // 模型缓存目录
});

// 初始化（首次运行会下载模型，约 116MB）
await indexer.initialize();

// 索引内容
await indexer.indexContent(
  1, // pageId
  "https://example.com", // url
  "机器学习入门", // title
  "机器学习是人工智能的..." // content
);

// 搜索
const results = await indexer.searchContent("机器学习算法", 10);
console.log(results);
```

## 技术架构

### 核心技术栈

- **@xenova/transformers** - 在 Node.js 中运行机器学习模型
- **multilingual-e5-small/base** - HuggingFace 多语言 Embedding 模型
- **纯 JavaScript 实现的向量数据库** - 无需编译，开箱即用

### 架构层次

```
用户查询
   ↓
ContentIndexer (索引管理层)
   ↓
┌──────────────────┬─────────────────────┬──────────────────┐
↓                  ↓                     ↓
TextChunker    SemanticEngine      VectorDatabase
(文本分块)      (生成向量)           (存储&搜索)
```

## 核心组件

### 1. TextChunker - 文本分块器

**文件**: `src/semantic-search/text-chunker.js`

**功能**: 将长文本智能切分为适合向量化的小块

**配置**:

```javascript
{
  maxWordsPerChunk: 80,      // 每块最大词数
  overlapSentences: 1,        // 重叠句子数（避免语义断裂）
  minChunkLength: 20          // 最小块长度
}
```

**分块策略**:

1. 优先按句子分割（中英文混合支持）
2. 对超长句子进行二次分割
3. 保持句子重叠以保持上下文连贯性

**示例**:

```javascript
import { TextChunker } from "./src/semantic-search/text-chunker.js";

const chunker = new TextChunker({
  maxWordsPerChunk: 80,
  overlapSentences: 1,
  minChunkLength: 20,
});

const chunks = chunker.chunkText(longText, "Title");
// 返回: [{ text, source }, { text, source }, ...]
```

### 2. SemanticEngine - 语义引擎

**文件**: `src/semantic-search/semantic-engine.js`

**功能**: 加载 Embedding 模型，生成文本向量

**配置**:

```javascript
{
  modelName: 'Xenova/multilingual-e5-small',  // 模型名称
  dimension: 384,                              // 向量维度（small: 384, base: 768）
  cacheDir: './.cache/transformers',          // 模型缓存目录
  useQuantized: true                           // 是否使用量化模型（更小更快）
}
```

**支持的模型**:

| 模型                  | 维度 | 大小   | 性能       | 推荐场景           |
| --------------------- | ---- | ------ | ---------- | ------------------ |
| multilingual-e5-small | 384  | ~116MB | ⭐⭐⭐     | 一般搜索，速度优先 |
| multilingual-e5-base  | 768  | ~500MB | ⭐⭐⭐⭐⭐ | 高精度搜索         |

**示例**:

```javascript
import { SemanticEngine } from "./src/semantic-search/semantic-engine.js";

const engine = new SemanticEngine({
  modelName: "Xenova/multilingual-e5-small",
  dimension: 384,
  cacheDir: "./.cache/transformers",
});

await engine.initialize();

// 单个文本
const embedding = await engine.getEmbedding("查询文本");
// 返回: Float32Array(384)

// 批量生成
const embeddings = await engine.getEmbeddingsBatch(["文本1", "文本2"]);
// 返回: [Float32Array(384), Float32Array(384)]
```

### 3. VectorDatabase - 向量数据库

**文件**: `src/semantic-search/vector-database-pure.js`

**功能**: 存储和搜索向量，使用纯 JavaScript 实现的余弦相似度算法

**配置**:

```javascript
{
  dimension: 384,           // 向量维度（必须与模型一致）
  maxElements: 10000        // 最大存储数量
}
```

**特点**:

- ✅ 纯 JavaScript 实现，无需编译
- ✅ 可在任何 Node.js 环境运行
- ✅ 适合中小规模数据（< 10,000 文档）
- ✅ 余弦相似度搜索

**示例**:

```javascript
import { VectorDatabase } from "./src/semantic-search/vector-database-pure.js";

const db = new VectorDatabase({
  dimension: 384,
  maxElements: 10000,
});

await db.initialize();

// 添加文档
await db.addDocument(
  1, // pageId
  "url", // url
  "title", // title
  { text: "...", source: "body" }, // chunk
  embedding // Float32Array(384)
);

// 搜索
const results = await db.search(queryEmbedding, 10);
// 返回: [{ pageId, url, title, similarity, ... }, ...]
```

### 4. ContentIndexer - 内容索引器

**文件**: `src/semantic-search/content-indexer-node.js`

**功能**: 协调上述三个组件，提供完整的索引和搜索功能

**示例**:

```javascript
import { ContentIndexer } from "./src/semantic-search/content-indexer-node.js";

const indexer = new ContentIndexer({
  // TextChunker 配置
  maxWordsPerChunk: 80,
  overlapSentences: 1,
  minChunkLength: 20,

  // SemanticEngine 配置
  modelName: "Xenova/multilingual-e5-small",
  dimension: 384,
  cacheDir: "./.cache/transformers",

  // VectorDatabase 配置
  maxElements: 10000,
});

await indexer.initialize();

// 索引单个页面
const result = await indexer.indexContent(pageId, url, title, content);

// 批量索引
const results = await indexer.indexContentBatch([
  { pageId: 1, url: "...", title: "...", content: "..." },
  { pageId: 2, url: "...", title: "...", content: "..." },
]);

// 搜索
const searchResults = await indexer.searchContent("查询", 10);

// 删除页面索引
await indexer.removePageIndex(pageId);

// 清空所有索引
indexer.clearAll();

// 获取统计信息
const stats = indexer.getStats();
console.log(stats);
// {
//   isInitialized: true,
//   indexedPagesCount: 5,
//   totalDocuments: 15,
//   totalVectors: 15,
//   capacityUsage: '1.50%',
//   modelName: 'Xenova/multilingual-e5-small',
//   dimension: 384,
//   cacheSize: 15
// }
```

## 完整使用流程

### 第一步：创建索引器

```javascript
import { ContentIndexer } from "./src/semantic-search/content-indexer-node.js";

const indexer = new ContentIndexer({
  modelName: "Xenova/multilingual-e5-small",
  dimension: 384,
});
```

### 第二步：初始化

```javascript
await indexer.initialize();
// 首次运行会下载模型（约 116MB）
// 后续运行会使用缓存，快速启动
```

### 第三步：索引内容

```javascript
// 索引网页内容
await indexer.indexContent(
  1, // 唯一的页面ID
  "https://example.com/article", // 页面URL
  "机器学习基础教程", // 页面标题
  `
    机器学习是人工智能的一个重要分支。
    它让计算机能够从数据中学习规律。
    常见的机器学习算法包括决策树、随机森林等。
  ` // 页面内容
);

// 索引更多页面...
await indexer.indexContent(2, "url2", "title2", "content2");
await indexer.indexContent(3, "url3", "title3", "content3");
```

### 第四步：搜索

```javascript
const results = await indexer.searchContent("机器学习算法", 10);

results.forEach((result, index) => {
  console.log(`${index + 1}. ${result.title}`);
  console.log(`   URL: ${result.url}`);
  console.log(`   相似度: ${(result.similarity * 100).toFixed(2)}%`);
  console.log(`   片段: ${result.snippet}`);
  console.log();
});
```

### 第五步：管理索引

```javascript
// 获取统计信息
const stats = indexer.getStats();
console.log(`已索引页面: ${stats.indexedPagesCount}`);
console.log(`总文档数: ${stats.totalDocuments}`);
console.log(`容量使用: ${stats.capacityUsage}`);

// 删除指定页面
await indexer.removePageIndex(1);

// 清空所有
indexer.clearAll();
```

## 实战案例

### 案例 1：网页内容搜索

```javascript
const indexer = new ContentIndexer();
await indexer.initialize();

// 模拟爬取多个网页并索引
const pages = [
  { id: 1, url: "page1.html", title: "Title1", content: "..." },
  { id: 2, url: "page2.html", title: "Title2", content: "..." },
  { id: 3, url: "page3.html", title: "Title3", content: "..." },
];

for (const page of pages) {
  await indexer.indexContent(page.id, page.url, page.title, page.content);
}

// 搜索
const results = await indexer.searchContent("关键词", 5);
```

### 案例 2：文档知识库

```javascript
const indexer = new ContentIndexer({
  maxElements: 50000, // 支持更多文档
});

await indexer.initialize();

// 批量索引文档
const documents = loadDocuments(); // 从数据库或文件加载
await indexer.indexContentBatch(documents);

// 智能搜索
const answer = await searchKnowledge("如何使用机器学习？");
```

### 案例 3：Electron 集成

**主进程 (main.js)**:

```javascript
const {
  ContentIndexer,
} = require("./src/semantic-search/content-indexer-node.js");

let indexer;

ipcMain.handle("search:initialize", async () => {
  indexer = new ContentIndexer();
  await indexer.initialize();
  return { success: true };
});

ipcMain.handle("search:index", async (event, pageData) => {
  return await indexer.indexContent(
    pageData.id,
    pageData.url,
    pageData.title,
    pageData.content
  );
});

ipcMain.handle("search:query", async (event, query, topK) => {
  return await indexer.searchContent(query, topK);
});
```

**渲染进程 (renderer.js)**:

```javascript
// 初始化
await ipcRenderer.invoke("search:initialize");

// 索引当前页面
await ipcRenderer.invoke("search:index", {
  id: pageId,
  url: window.location.href,
  title: document.title,
  content: document.body.innerText,
});

// 搜索
const results = await ipcRenderer.invoke("search:query", "查询", 10);
displayResults(results);
```

## 性能优化

### 1. 模型选择

```javascript
// 速度优先（推荐）
const indexer = new ContentIndexer({
  modelName: "Xenova/multilingual-e5-small",
  dimension: 384,
});

// 精度优先
const indexer = new ContentIndexer({
  modelName: "Xenova/multilingual-e5-base",
  dimension: 768,
});
```

### 2. 批量处理

```javascript
// ❌ 不推荐：逐个索引
for (const page of pages) {
  await indexer.indexContent(...);
}

// ✅ 推荐：批量索引
await indexer.indexContentBatch(pages);
```

### 3. 缓存管理

```javascript
// SemanticEngine 内置了 LRU 缓存
const indexer = new ContentIndexer({
  maxCacheSize: 1000, // 缓存 1000 个 embedding
});
```

## 模型下载

### 首次运行

首次初始化时会自动下载模型：

```
正在加载模型: Xenova/multilingual-e5-small...
提示: 首次运行会下载模型 (约 116MB)，请稍候。后续运行会使用缓存。
```

模型会缓存到 `.cache/transformers/` 目录。

### 手动下载

如果网络不稳定，可以手动下载模型：

1. 访问 HuggingFace: https://huggingface.co/Xenova/multilingual-e5-small
2. 下载 ONNX 模型文件
3. 放到 `.cache/transformers/Xenova/multilingual-e5-small/` 目录

## 常见问题

### Q1: 如何支持更多语言？

A: `multilingual-e5` 模型已支持 100+ 种语言，包括中文、英文、日文、韩文等，无需额外配置。

### Q2: 如何提高搜索精度？

A:

1. 使用 `multilingual-e5-base` 模型（768 维）
2. 调整文本分块参数（减小 `maxWordsPerChunk`）
3. 增加重叠句子数（`overlapSentences: 2`）

### Q3: 如何提高搜索速度？

A:

1. 使用 `multilingual-e5-small` 模型（384 维）
2. 启用量化模型（`useQuantized: true`）
3. 增加缓存大小（`maxCacheSize: 2000`）

### Q4: 内存占用如何？

A:

- 模型加载：约 200-300MB
- 每个向量：384 \* 4 bytes = 1.5KB
- 10,000 个向量：约 15MB
- 总计：约 215-315MB

### Q5: 可以在浏览器中运行吗？

A: 可以！使用 `src/semantic-search/content-indexer.js` 和 `src/semantic-search/vector-database.js`（WASM 版本），性能更好。

## 文件说明

### Node.js 版本（推荐）

- `src/semantic-search/content-indexer-node.js` - 内容索引器
- `src/semantic-search/vector-database-pure.js` - 纯 JS 向量数据库
- `src/semantic-search/semantic-engine.js` - 语义引擎
- `src/semantic-search/text-chunker.js` - 文本分块器
- `src/semantic-search-demo.js` - 完整演示

### 浏览器版本（高性能）

- `src/semantic-search/content-indexer.js` - 内容索引器
- `src/semantic-search/vector-database.js` - WASM 向量数据库（更快）
- `src/semantic-search/semantic-engine.js` - 语义引擎
- `src/semantic-search/text-chunker.js` - 文本分块器

### 示例和文档

- `src/semantic-search/example.js` - 详细示例
- `src/semantic-search-demo.js` - 快速演示

## 技术原理

### 1. 文本向量化

```
原始文本 → 分词 → Transformer → Pooling → 归一化 → 向量 (Float32Array)
```

### 2. 相似度计算

使用余弦相似度：

```javascript
similarity = (A · B) / (||A|| × ||B||)
```

值域：0-1，越接近 1 越相似

### 3. 搜索流程

```
查询文本 → 生成向量 → 计算相似度 → 排序 → 去重 → 返回前 K 个
```

## 总结

- ✅ 纯 JavaScript 实现，无需编译
- ✅ 可在 Node.js 和 Electron 中运行
- ✅ 支持 100+ 种语言
- ✅ 智能分块，保持语义连贯
- ✅ 自动缓存，加速重复查询
- ✅ 简单易用的 API
- ✅ 完整的演示代码

立即开始使用 AI 语义搜索，让你的应用更智能！🚀
