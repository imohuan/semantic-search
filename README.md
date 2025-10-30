# AI 语义搜索功能文档

[![Node.js Version](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Language](https://img.shields.io/badge/Language-JavaScript-yellow.svg)](https://www.javascript.com/)

## 概述

本项目提供了强大的 AI 驱动语义搜索功能，基于 Transformer 模型实现多语言智能搜索。提供两个版本：

- **Node.js 版本** - 适合服务器端、Electron 主进程
- **浏览器版本** - 适合纯前端应用、Electron 渲染进程

## 📖 目录

- [两个版本对比](#-两个版本对比)
- [快速开始](#-快速开始)
  - [Node.js 版本](#nodejs-版本使用)
  - [浏览器版本](#浏览器版本使用)
- [可用脚本](#-可用脚本)
- [技术架构](#技术架构)
- [核心组件](#核心组件)
- [完整使用流程](#完整使用流程)
- [实战案例](#实战案例)
- [性能优化](#性能优化)
- [性能对比](#-性能对比)
- [常见问题](#常见问题)
- [文件结构](#-文件结构)
- [总结](#-总结)

## 📦 两个版本对比

### Node.js 版本（推荐）

**位置**: `semantic-search/nodes/`

**特点**:

- ✅ 运行在 Node.js 环境（服务器、Electron 主进程）
- ✅ 使用 `@xenova/transformers` 运行 AI 模型
- ✅ 纯 JavaScript 实现的向量数据库（无需编译）
- ✅ 更好的性能和稳定性
- ✅ 支持本地模型缓存
- ✅ 适合中大型应用

**依赖**:

```bash
pnpm add @xenova/transformers
```

**适用场景**:

- Electron 桌面应用（主进程）
- Node.js 后端服务
- 本地工具和脚本
- 需要持久化存储的应用

### 浏览器版本

**位置**: `semantic-search-browser.html`

**特点**:

- ✅ 纯浏览器运行（无需 Node.js）
- ✅ 使用 Web Workers 和 WASM 加速
- ✅ 可视化交互界面
- ⚠️ 首次加载需要下载模型（~116MB）
- ⚠️ 受浏览器内存限制

**依赖**:

```html
<!-- 直接在 HTML 中引入 CDN -->
<script type="module">
  import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers";
</script>
```

**适用场景**:

- 在线演示和测试
- 纯前端应用
- 快速原型验证
- 教学和展示

## 🚀 快速开始

### Node.js 版本使用

#### 1. 安装依赖

```bash
# 在 semantic-search 目录下
pnpm install
```

#### 2. 运行演示

```bash
# 方法1: 使用 pnpm 脚本
pnpm run demo

# 方法2: 使用 Windows 批处理脚本
双击 scripts/start-node-demo.bat

# 方法3: 直接运行
node nodes/semantic-search-demo.js
```

#### 3. 在代码中使用

```javascript
import { ContentIndexer } from "./nodes/content-indexer.js";

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

### 浏览器版本使用

#### 1. 启动演示

```bash
# 方法1: 使用 pnpm 脚本（自动打开浏览器）
pnpm run browser

# 方法2: 使用 Windows 批处理脚本
双击 scripts/start-browser.bat

# 方法3: 直接打开 HTML 文件
双击 semantic-search-browser.html
```

#### 2. 操作步骤

1. 点击「初始化语义搜索引擎」
2. 等待模型加载完成（首次约 1-2 分钟）
3. 索引示例文档或自定义内容
4. 输入查询词进行搜索

## 📋 可用脚本

### NPM/PNPM 脚本

| 脚本命令           | 说明                   |
| ------------------ | ---------------------- |
| `pnpm install`     | 安装依赖               |
| `pnpm run demo`    | 运行 Node.js 版本演示  |
| `pnpm run browser` | 在浏览器中打开演示界面 |
| `pnpm run dev`     | 开发模式（同 demo）    |
| `pnpm run start`   | 启动演示（同 demo）    |

### Windows 批处理脚本

**快速启动（推荐）**：

| 脚本文件                  | 说明                            |
| ------------------------- | ------------------------------- |
| `快速启动-Node版本.bat`   | 自动安装依赖并启动 Node.js 演示 |
| `快速启动-浏览器版本.bat` | 直接在浏览器中打开演示          |

**单独启动**：

| 脚本文件                      | 说明                                  |
| ----------------------------- | ------------------------------------- |
| `scripts/start-node-demo.bat` | 启动 Node.js 版本演示（需先安装依赖） |
| `scripts/start-browser.bat`   | 在浏览器中打开演示                    |

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

**文件**: `nodes/text-chunker.js`

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
import { TextChunker } from "./nodes/text-chunker.js";

const chunker = new TextChunker({
  maxWordsPerChunk: 80,
  overlapSentences: 1,
  minChunkLength: 20,
});

const chunks = chunker.chunkText(longText, "Title");
// 返回: [{ text, source }, { text, source }, ...]
```

### 2. SemanticEngine - 语义引擎

**文件**: `nodes/semantic-engine.js`

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
import { SemanticEngine } from "./nodes/semantic-engine.js";

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

**文件**: `nodes/vector-database.js`

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
import { VectorDatabase } from "./nodes/vector-database.js";

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

**文件**: `nodes/content-indexer.js`

**功能**: 协调上述三个组件，提供完整的索引和搜索功能

**示例**:

```javascript
import { ContentIndexer } from "./nodes/content-indexer.js";

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
import { ContentIndexer } from "./nodes/content-indexer.js";

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
import { ContentIndexer } from "./semantic-search/nodes/content-indexer.js";
import { ipcMain } from "electron";

let indexer;

ipcMain.handle("search:initialize", async () => {
  indexer = new ContentIndexer({
    modelName: "Xenova/multilingual-e5-small",
    dimension: 384,
  });
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

ipcMain.handle("search:stats", async () => {
  return indexer.getStats();
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

A: 可以！直接打开 `semantic-search-browser.html`，提供完整的可视化界面。浏览器版本特别适合演示和测试。

### Q6: Node.js 版本和浏览器版本如何选择？

A:

- **生产环境** → Node.js 版本（更稳定、性能更好）
- **演示测试** → 浏览器版本（无需安装依赖）
- **Electron 应用** → 主进程用 Node.js 版本，渲染进程可用浏览器版本

## 📁 文件结构

```
semantic-search/
├── nodes/                              # Node.js 版本核心代码
│   ├── content-indexer.js             # 内容索引器（协调器）
│   ├── semantic-engine.js             # 语义引擎（AI 模型加载）
│   ├── text-chunker.js                # 文本分块器
│   ├── vector-database.js             # 向量数据库（纯 JS 实现）
│   └── semantic-search-demo.js        # 完整演示脚本
│
├── scripts/                            # 启动脚本
│   ├── start-node-demo.bat            # Windows: 启动 Node.js 演示
│   ├── start-browser.bat              # Windows: 启动浏览器演示
│   └── start-browser.js               # 跨平台: 启动浏览器脚本
│
├── semantic-search-browser.html        # 浏览器版本（独立 HTML）
├── 快速启动-Node版本.bat               # 快速启动 Node.js 版本（自动安装依赖）
├── 快速启动-浏览器版本.bat             # 快速启动浏览器版本
├── 示例代码.js                          # 使用示例代码
├── package.json                        # 依赖管理
├── .gitignore                          # Git 忽略文件
└── README.md                           # 本文档
```

### 快速启动说明

项目根目录提供了两个快速启动文件：

1. **快速启动-Node 版本.bat**

   - 自动检查并安装依赖
   - 启动 Node.js 版本演示
   - 适合首次运行

2. **快速启动-浏览器版本.bat**
   - 直接在浏览器中打开演示
   - 无需安装任何依赖
   - 适合快速体验

## ⚖️ 版本选择建议

| 需求                    | Node.js 版本 | 浏览器版本 |
| ----------------------- | ------------ | ---------- |
| Electron 主进程         | ✅ 推荐      | ❌         |
| Electron 渲染进程       | ⚠️ 可用      | ✅ 推荐    |
| Node.js 服务器          | ✅ 推荐      | ❌         |
| 纯前端应用              | ❌           | ✅ 推荐    |
| 快速演示/测试           | ⚠️           | ✅ 推荐    |
| 生产环境                | ✅ 推荐      | ⚠️         |
| 大规模数据（>10k 文档） | ✅ 推荐      | ❌         |
| 离线使用                | ✅ 推荐      | ⚠️         |

**总结**：

- **生产应用** → Node.js 版本
- **快速演示** → 浏览器版本
- **Electron 应用** → 主进程用 Node.js，渲染进程用浏览器版本

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

## 🔥 性能对比

### Node.js 版本 vs 浏览器版本

| 特性         | Node.js 版本                  | 浏览器版本                  |
| ------------ | ----------------------------- | --------------------------- |
| 运行环境     | Node.js / Electron 主进程     | 浏览器 / Electron 渲染进程  |
| AI 模型引擎  | @xenova/transformers          | @xenova/transformers (CDN)  |
| 向量数据库   | 纯 JavaScript                 | 纯 JavaScript               |
| 初始化速度   | ⭐⭐⭐⭐⭐ 快                 | ⭐⭐⭐ 中等（首次需下载）   |
| 搜索速度     | ⭐⭐⭐⭐⭐ 快                 | ⭐⭐⭐⭐ 较快               |
| 内存占用     | 300-400MB                     | 300-500MB                   |
| 稳定性       | ⭐⭐⭐⭐⭐ 优秀               | ⭐⭐⭐⭐ 良好               |
| 可扩展性     | ⭐⭐⭐⭐⭐ 优秀（支持大规模） | ⭐⭐⭐ 中等（受浏览器限制） |
| 离线使用     | ✅ 完全支持                   | ⚠️ 需预先下载模型           |
| 可视化界面   | ❌ 无                         | ✅ 内置漂亮界面             |
| 部署难度     | ⭐⭐⭐ 中等（需 Node.js）     | ⭐⭐⭐⭐⭐ 简单（直接打开） |
| 生产环境推荐 | ✅ 强烈推荐                   | ⚠️ 适合轻量应用             |

### 性能测试数据（参考）

基于 multilingual-e5-small 模型（384 维）：

| 操作                     | Node.js 版本 | 浏览器版本 |
| ------------------------ | ------------ | ---------- |
| 模型初始化               | ~2-3 秒      | ~3-5 秒    |
| 索引 1 个文档（1000 字） | ~100-200ms   | ~150-250ms |
| 搜索（10k 文档）         | ~50-100ms    | ~80-150ms  |
| 批量索引 100 个文档      | ~10-15 秒    | ~15-20 秒  |

## 💡 总结

### ✨ 核心特性

- ✅ **纯 JavaScript 实现** - 无需编译，开箱即用
- ✅ **双版本支持** - Node.js 版本 + 浏览器版本
- ✅ **多语言支持** - 支持 100+ 种语言，包括中英日韩等
- ✅ **智能分块** - 保持语义连贯，避免上下文丢失
- ✅ **自动缓存** - LRU 缓存机制，加速重复查询
- ✅ **简单易用** - 清晰的 API，完整的文档和示例
- ✅ **高性能** - 余弦相似度算法，快速准确
- ✅ **可扩展** - 支持自定义配置和模型选择

### 🎯 适用场景

- **Electron 桌面应用** - 智能标签页搜索、浏览历史搜索
- **Node.js 后端服务** - 文档检索、知识库搜索
- **纯前端应用** - 网页内容搜索、在线文档查询
- **开发工具** - 代码搜索、日志分析
- **教育培训** - AI 技术演示、教学案例

### 🚀 快速选择指南

```
需要演示或快速测试？
  ↓
  使用浏览器版本（semantic-search-browser.html）

生产环境或 Electron 应用？
  ↓
  使用 Node.js 版本（nodes/）

需要处理大规模数据？
  ↓
  使用 Node.js 版本 + 增大 maxElements
```

立即开始使用 AI 语义搜索，让你的应用更智能！🚀

---

**项目地址**: AutoBrowser/semantic-search  
**技术支持**: 基于 mcp-chrome 核心实现  
**开源协议**: MIT License
