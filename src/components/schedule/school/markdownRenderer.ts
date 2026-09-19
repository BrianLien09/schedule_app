export type MarkdownInlineNode =
  | { type: 'text'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'emphasis'; value: string }
  | { type: 'code'; value: string };

export type MarkdownBlock =
  | { type: 'paragraph'; content: MarkdownInlineNode[] }
  | { type: 'heading'; content: MarkdownInlineNode[] }
  | { type: 'list'; items: MarkdownInlineNode[][] };

const INLINE_MARKDOWN_PATTERN = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;

function parseInlineMarkdown(line: string): MarkdownInlineNode[] {
  const nodes: MarkdownInlineNode[] = [];
  let lastIndex = 0;

  for (const match of line.matchAll(INLINE_MARKDOWN_PATTERN)) {
    const token = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push({ type: 'text', value: line.slice(lastIndex, index) });
    }

    if (token.startsWith('**')) {
      nodes.push({ type: 'strong', value: token.slice(2, -2) });
    } else if (token.startsWith('*')) {
      nodes.push({ type: 'emphasis', value: token.slice(1, -1) });
    } else {
      nodes.push({ type: 'code', value: token.slice(1, -1) });
    }

    lastIndex = index + token.length;
  }

  if (lastIndex < line.length) {
    nodes.push({ type: 'text', value: line.slice(lastIndex) });
  }

  return nodes;
}

/**
 * 將筆記內容拆成受限的 Markdown 結構。
 *
 * 只回傳明確允許的文字與格式節點，原始 HTML 不會被當成標記解析，
 * 讓呼叫端可以透過 React 的文字節點安全輸出內容。
 */
export function parseMarkdown(text: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let listItems: MarkdownInlineNode[][] = [];

  const flushList = (): void => {
    if (listItems.length === 0) return;
    blocks.push({ type: 'list', items: listItems });
    listItems = [];
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();

    if (line.startsWith('- ')) {
      listItems.push(parseInlineMarkdown(line.slice(2)));
      continue;
    }

    flushList();

    if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', content: parseInlineMarkdown(line.slice(3)) });
    } else if (line.trim() !== '') {
      blocks.push({ type: 'paragraph', content: parseInlineMarkdown(line) });
    }
  }

  flushList();
  return blocks;
}
