import { Fragment, type ReactNode } from 'react';

interface RichTextProps {
  text?: string | null;
}

const INLINE_TOKEN_REGEX = /(\*\*[\s\S]+?\*\*|~~[\s\S]+?~~|`[\s\S]+?`|<u>[\s\S]+?<\/u>|\*[\s\S]+?\*)/g;

function renderInlineText(text: string): ReactNode[] {
  return text.split(INLINE_TOKEN_REGEX).filter(Boolean).map((segment, index) => {
    if (segment.startsWith('**') && segment.endsWith('**') && segment.length > 4) {
      return <strong key={index}>{segment.slice(2, -2)}</strong>;
    }
    if (segment.startsWith('*') && segment.endsWith('*') && segment.length > 2) {
      return <em key={index}>{segment.slice(1, -1)}</em>;
    }
    if (segment.startsWith('~~') && segment.endsWith('~~') && segment.length > 4) {
      return <s key={index}>{segment.slice(2, -2)}</s>;
    }
    if (segment.startsWith('`') && segment.endsWith('`') && segment.length > 2) {
      return (
        <code key={index} className="rounded bg-black/10 px-1 py-0.5 text-[0.95em]">
          {segment.slice(1, -1)}
        </code>
      );
    }
    if (segment.startsWith('<u>') && segment.endsWith('</u>') && segment.length > 7) {
      return <u key={index}>{segment.slice(3, -4)}</u>;
    }
    return <Fragment key={index}>{segment}</Fragment>;
  });
}

export function RichText({ text = '' }: RichTextProps) {
  const lines = (text ?? '').split('\n');

  return (
    <>
      {lines.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 && <br />}
          {renderInlineText(line)}
        </Fragment>
      ))}
    </>
  );
}
