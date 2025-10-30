/**
 * 文本分块器
 * 将长文本智能切分为适合向量化的小块
 */

export class TextChunker {
  constructor(options = {}) {
    this.maxWordsPerChunk = options.maxWordsPerChunk || 80;
    this.overlapSentences = options.overlapSentences || 1;
    this.minChunkLength = options.minChunkLength || 20;
    this.includeTitle = options.includeTitle !== false;
  }

  /**
   * 将文本分块
   * @param {string} content - 文本内容
   * @param {string} title - 标题（可选）
   * @returns {Array<{text: string, source: string, index: number, wordCount: number}>}
   */
  chunkText(content, title = '') {
    const chunks = [];

    // 1. 添加标题作为第一个块
    if (this.includeTitle && title && title.trim().length > 5) {
      chunks.push({
        text: title.trim(),
        source: 'title',
        index: 0,
        wordCount: title.trim().split(/\s+/).length,
      });
    }

    const cleanContent = content.trim();
    if (!cleanContent) {
      return chunks;
    }

    // 2. 分割句子
    const sentences = this.splitIntoSentences(cleanContent);

    if (sentences.length === 0) {
      return this.fallbackChunking(cleanContent, chunks);
    }

    // 3. 检查是否有超长句子
    const hasLongSentences = sentences.some(
      (s) => s.split(/\s+/).length > this.maxWordsPerChunk
    );

    if (hasLongSentences) {
      return this.mixedChunking(sentences, chunks);
    }

    // 4. 按词数组合句子
    return this.groupSentencesIntoChunks(sentences, chunks);
  }

  /**
   * 分割句子（支持中英文）
   */
  splitIntoSentences(content) {
    // 处理中英文标点
    const processed = content
      .replace(/([。！？])\s*/g, '$1\n') // 中文句号
      .replace(/([.!?])\s+(?=[A-Z])/g, '$1\n') // 英文句号后跟大写
      .replace(/([.!?]["'])\s+(?=[A-Z])/g, '$1\n') // 带引号的句号
      .replace(/([.!?])\s*$/gm, '$1\n') // 行尾句号
      .replace(/([。！？][""])\s*/g, '$1\n') // 中文引号
      .replace(/\n\s*\n/g, '\n'); // 合并多个换行

    const sentences = processed
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    // 如果句子太少但内容很长，使用更激进的分割
    if (sentences.length < 3 && content.length > 500) {
      return this.aggressiveSentenceSplitting(content);
    }

    return sentences;
  }

  /**
   * 激进的句子分割（用于段落式文本）
   */
  aggressiveSentenceSplitting(content) {
    const sentences = content
      .replace(/([.!?。！？])/g, '$1\n')
      .replace(/([;；:：])/g, '$1\n')
      .replace(/([)）])\s*(?=[\u4e00-\u9fa5A-Z])/g, '$1\n')
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    // 对超长句子进行二次分割
    const finalSentences = [];

    for (const sentence of sentences) {
      const words = sentence.split(/\s+/);
      if (words.length <= this.maxWordsPerChunk) {
        finalSentences.push(sentence);
      } else {
        // 超长句子按词数分割，保持重叠
        const overlapWords = 5;
        for (let i = 0; i < words.length; i += this.maxWordsPerChunk - overlapWords) {
          const chunkWords = words.slice(i, i + this.maxWordsPerChunk);
          const chunkText = chunkWords.join(' ');
          if (chunkText.length > 15) {
            finalSentences.push(chunkText);
          }
        }
      }
    }

    return finalSentences;
  }

  /**
   * 按词数组合句子成块
   */
  groupSentencesIntoChunks(sentences, existingChunks) {
    const chunks = [...existingChunks];
    let chunkIndex = chunks.length;

    let i = 0;
    while (i < sentences.length) {
      let currentChunkText = '';
      let currentWordCount = 0;
      let sentencesUsed = 0;

      // 组合句子直到达到词数限制
      while (i + sentencesUsed < sentences.length && currentWordCount < this.maxWordsPerChunk) {
        const sentence = sentences[i + sentencesUsed];
        const sentenceWords = sentence.split(/\s+/).length;

        // 如果加上这个句子会超出限制，且已有内容，则停止
        if (currentWordCount + sentenceWords > this.maxWordsPerChunk && currentWordCount > 0) {
          break;
        }

        currentChunkText += (currentChunkText ? ' ' : '') + sentence;
        currentWordCount += sentenceWords;
        sentencesUsed++;
      }

      // 添加块
      if (currentChunkText.trim().length > this.minChunkLength) {
        chunks.push({
          text: currentChunkText.trim(),
          source: `content_chunk_${chunkIndex}`,
          index: chunkIndex,
          wordCount: currentWordCount,
        });
        chunkIndex++;
      }

      // 移动到下一个位置（保持重叠）
      i += Math.max(1, sentencesUsed - this.overlapSentences);
    }

    return chunks;
  }

  /**
   * 混合分块（处理包含超长句子的情况）
   */
  mixedChunking(sentences, existingChunks) {
    const chunks = [...existingChunks];
    let chunkIndex = chunks.length;

    for (const sentence of sentences) {
      const sentenceWords = sentence.split(/\s+/).length;

      if (sentenceWords <= this.maxWordsPerChunk) {
        // 正常长度的句子直接作为块
        chunks.push({
          text: sentence.trim(),
          source: `sentence_chunk_${chunkIndex}`,
          index: chunkIndex,
          wordCount: sentenceWords,
        });
        chunkIndex++;
      } else {
        // 超长句子分割
        const words = sentence.split(/\s+/);
        for (let i = 0; i < words.length; i += this.maxWordsPerChunk) {
          const chunkWords = words.slice(i, i + this.maxWordsPerChunk);
          const chunkText = chunkWords.join(' ');

          if (chunkText.length > this.minChunkLength) {
            chunks.push({
              text: chunkText,
              source: `long_sentence_chunk_${chunkIndex}_part_${Math.floor(i / this.maxWordsPerChunk)}`,
              index: chunkIndex,
              wordCount: chunkWords.length,
            });
          }
        }
        chunkIndex++;
      }
    }

    return chunks;
  }

  /**
   * 回退分块方法（当句子分割失败时）
   */
  fallbackChunking(content, existingChunks) {
    const chunks = [...existingChunks];
    let chunkIndex = chunks.length;

    // 尝试按段落分割
    const paragraphs = content
      .split(/\n\s*\n/)
      .filter((p) => p.trim().length > this.minChunkLength);

    if (paragraphs.length > 1) {
      // 有多个段落，按段落分块
      paragraphs.forEach((paragraph, index) => {
        const cleanParagraph = paragraph.trim();
        if (cleanParagraph.length > 0) {
          const words = cleanParagraph.split(/\s+/);
          const maxWordsPerChunk = 150;

          for (let i = 0; i < words.length; i += maxWordsPerChunk) {
            const chunkWords = words.slice(i, i + maxWordsPerChunk);
            const chunkText = chunkWords.join(' ');

            if (chunkText.length > this.minChunkLength) {
              chunks.push({
                text: chunkText,
                source: `paragraph_${index}_chunk_${Math.floor(i / maxWordsPerChunk)}`,
                index: chunkIndex,
                wordCount: chunkWords.length,
              });
              chunkIndex++;
            }
          }
        }
      });
    } else {
      // 没有段落，直接按词数分割
      const words = content.trim().split(/\s+/);
      const maxWordsPerChunk = 150;

      for (let i = 0; i < words.length; i += maxWordsPerChunk) {
        const chunkWords = words.slice(i, i + maxWordsPerChunk);
        const chunkText = chunkWords.join(' ');

        if (chunkText.length > this.minChunkLength) {
          chunks.push({
            text: chunkText,
            source: `content_chunk_${Math.floor(i / maxWordsPerChunk)}`,
            index: chunkIndex,
            wordCount: chunkWords.length,
          });
          chunkIndex++;
        }
      }
    }

    return chunks;
  }
}

