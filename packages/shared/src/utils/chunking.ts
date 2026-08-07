import { ExtractedBlock } from '../types/index.js';

export interface Chunk {
  id: string;
  chunkIndex: number;
  totalChunks: number;
  blocks: ExtractedBlock[];
  text: string;
  estimatedTokens: number;
}

const MAX_TOKENS_PER_CHUNK = 4000;
const OVERLAP_BLOCKS = 2;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function chunkExtractedBlocks(blocks: ExtractedBlock[]): Chunk[] {
  if (blocks.length === 0) {
    return [];
  }

  const chunks: Chunk[] = [];
  let currentBlocks: ExtractedBlock[] = [];
  let currentTokenCount = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockTokens = estimateTokens(block.content);

    if (currentTokenCount + blockTokens > MAX_TOKENS_PER_CHUNK && currentBlocks.length > 0) {
      // Finalize current chunk
      chunks.push({
        id: `chunk-${chunks.length + 1}`,
        chunkIndex: chunks.length,
        totalChunks: 0, // updated after loop
        blocks: [...currentBlocks],
        text: currentBlocks.map((b) => `[${b.id}] ${b.content}`).join('\n\n'),
        estimatedTokens: currentTokenCount,
      });

      // Overlap with previous blocks
      const overlapStart = Math.max(0, currentBlocks.length - OVERLAP_BLOCKS);
      currentBlocks = currentBlocks.slice(overlapStart);
      currentTokenCount = currentBlocks.reduce((sum, b) => sum + estimateTokens(b.content), 0);
    }

    currentBlocks.push(block);
    currentTokenCount += blockTokens;
  }

  if (currentBlocks.length > 0) {
    chunks.push({
      id: `chunk-${chunks.length + 1}`,
      chunkIndex: chunks.length,
      totalChunks: 0,
      blocks: [...currentBlocks],
      text: currentBlocks.map((b) => `[${b.id}] ${b.content}`).join('\n\n'),
      estimatedTokens: currentTokenCount,
    });
  }

  const total = chunks.length;
  return chunks.map((c) => ({ ...c, totalChunks: total }));
}
