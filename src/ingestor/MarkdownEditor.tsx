import { useRef, useCallback, useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markdown';
import type { SlideType } from '../types/proposal';
import { snippets, SNIPPET_LABELS } from './templates/sectionSnippets';
import { copyToClipboard } from '../shared/utils/helpers';
import { AppIcon } from '../shared/icons/AppIcon';

// Custom highlight that colorizes markdown for the editor
function highlight(code: string): string {
  return Prism.highlight(code, Prism.languages['markdown'], 'markdown');
}

const SNIPPET_ORDER: SlideType[] = [
  'title', 'intro', 'stats', 'features', 'benefits',
  'testimonial', 'comparison', 'timeline', 'media', 'closing',
];

const MARKDOWN_CONVERSION_PROMPT_PREFIX = `Convert the source content into clean slide-ready markdown for a proposal deck.

Requirements:
- Keep the meaning and key facts exactly as provided.
- Use concise, presentation-friendly language.
- Add frontmatter at the top:
  ---
  title: "<Proposal title>"
  partner: "<Partner name>"
  date: "<YYYY-MM-DD>"
  theme: "<dark-minimal|light-corporate|bold-brand>"
  ---
- Split slides with --- on its own line.
- Use headings and bullets where appropriate.
- If a slide type is obvious, add <!-- type: slideType --> before that slide.
- Valid slide types: title, intro, stats, features, benefits, testimonial, comparison, timeline, media, closing.
- For feature/benefit rows, prefer icon IDs like [icon: slide.features.default] or [icon: slide.benefits.default].
- Do not include explanations outside the markdown output.

Source content:`;

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onCursorChange?: (pos: number) => void;
}

export function MarkdownEditor({ value, onChange, onCursorChange }: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleCursorChange = useCallback(() => {
    const textarea = editorRef.current?.querySelector('textarea');
    if (textarea && onCursorChange) {
      onCursorChange(textarea.selectionStart ?? 0);
    }
  }, [onCursorChange]);

  const handleInsertSnippet = useCallback(
    (type: SlideType) => {
      const snippet = snippets[type];
      const textarea = editorRef.current?.querySelector('textarea');
      const pos = textarea?.selectionStart ?? value.length;
      const before = value.slice(0, pos);
      const after = value.slice(pos);
      const separator = before.trim() ? '\n\n' : '';
      onChange(before + separator + snippet + '\n' + after);
    },
    [value, onChange],
  );

  const handleCopyPrompt = useCallback(async () => {
    const sourceContent = value.trim() || '[Paste your raw content here]';
    const prompt = `${MARKDOWN_CONVERSION_PROMPT_PREFIX}

\`\`\`
${sourceContent}
\`\`\``;
    await copyToClipboard(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  }, [value]);

  return (
    <div className="flex flex-col h-full">
      {/* Editor body */}
      <div
        ref={editorRef}
        className="flex-1 overflow-auto"
        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace" }}
        onClick={handleCursorChange}
        onKeyUp={handleCursorChange}
      >
        <Editor
          value={value}
          onValueChange={onChange}
          highlight={highlight}
          padding={20}
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontSize: 13,
            lineHeight: 1.7,
            minHeight: '100%',
            background: 'transparent',
            color: '#374151',
          }}
          textareaClassName="outline-none resize-none"
          placeholder={`Paste your markdown content here to get started.

Separate slides with --- horizontal rules.
Add <!-- type: slideType --> to explicitly set a slide type.

Example:
# Your Heading
<!-- type: stats -->

- 250+ | Active customers
- 99.9% | Uptime
---`}
        />
      </div>

      {/* Bottom toolbar */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/80 px-4 py-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mr-1 flex-shrink-0">
            Quick insert:
          </span>
          {SNIPPET_ORDER.map((type) => (
            <button
              key={type}
              onClick={() => handleInsertSnippet(type)}
              className="px-2 py-1 text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:border-gray-400 hover:text-gray-900 transition-all flex-shrink-0"
            >
              + {SNIPPET_LABELS[type]}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={handleCopyPrompt}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-800 bg-white border border-gray-200 rounded-md hover:border-gray-400 transition-all flex-shrink-0"
            title="Copy an LLM prompt to convert raw content into slide-ready markdown"
          >
            {copiedPrompt ? (
              <>
                <AppIcon icon="ui.check" className="w-3 h-3 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <AppIcon icon="ui.copy" className="w-3 h-3" />
                Copy prompt
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
