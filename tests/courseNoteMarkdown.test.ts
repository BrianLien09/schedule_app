import assert from 'node:assert/strict';
import test from 'node:test';
import { parseMarkdown } from '../src/components/schedule/school/markdownRenderer';

test('只解析允許的 Markdown 語法', () => {
  assert.deepEqual(parseMarkdown('## 標題\n- **粗體**\n- *斜體* 與 `程式碼`'), [
    {
      type: 'heading',
      content: [{ type: 'text', value: '標題' }],
    },
    {
      type: 'list',
      items: [
        [{ type: 'strong', value: '粗體' }],
        [
          { type: 'emphasis', value: '斜體' },
          { type: 'text', value: ' 與 ' },
          { type: 'code', value: '程式碼' },
        ],
      ],
    },
  ]);
});

test('原始 HTML 與危險 URL 會保留為純文字', () => {
  const payload = '<img src=x onerror=alert(1)> <svg onload=alert(1)> <script>alert(1)</script> [連結](javascript:alert(1))';

  assert.deepEqual(parseMarkdown(payload), [
    {
      type: 'paragraph',
      content: [{ type: 'text', value: payload }],
    },
  ]);
});

test('粗體中的 HTML payload 不會變成可執行標記', () => {
  const [block] = parseMarkdown('**<img src=x onerror=alert(1)>**');

  assert.deepEqual(block, {
    type: 'paragraph',
    content: [{ type: 'strong', value: '<img src=x onerror=alert(1)>' }],
  });
});
