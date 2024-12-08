import { helper } from '@/lib/helper';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { BlinkoStore } from '@/store/blinkoStore';
import { RootStore } from '@/store';
import rehypeRaw from 'rehype-raw';
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Code } from './Code';
import { LinkPreview } from './LinkPreview';
import { ImageWrapper } from './ImageWrapper';
import { ListItem } from './ListItem';
import dynamic from 'next/dynamic';
import { Skeleton } from '@nextui-org/react';

const MermaidWrapper = dynamic(() => import('./MermaidWrapper').then(mod => mod.MermaidWrapper), {
  loading: () => <Skeleton className='w-full h-[40px]' />,
  ssr: false
});

const MarkmapWrapper = dynamic(() => import('./MarkmapWrapper').then(m => m.MarkmapWrapper), {
  loading: () => <Skeleton className='w-full h-[40px]' />,
  ssr: false
});

const EchartsWrapper = dynamic(() => import('./EchartsWrapper'), {
  loading: () => <Skeleton className='w-full h-[40px]' />,
  ssr: false
});

const highlightTags = (text) => {
  if (!text) return text
  try {
    const lines = text?.split("\n");
    return lines.map((line, lineIndex) => {
      const parts = line.split(" ");
      const processedParts = parts.map((part, index) => {
        if (part.startsWith('#') && part.length > 1 && part.match(helper.regex.isContainHashTag)) {
          return (
            <Link key={`${lineIndex}-${index}`} className='select-none blinko-tag px-11 font-bold cursor-pointer hover:opacity-80 transition-all' onClick={() => {
              RootStore.Get(BlinkoStore).forceQuery++
            }} href={`/all?searchText=${part}`}>
              {part + " "}
            </Link>
          );
        } else {
          return part + " ";
        }
      });
      return [...processedParts, <br key={`br-${lineIndex}`} />];
    });
  } catch (e) {
    return text
  }
};

export const MarkdownRender = observer(({ content = '', onChange, }: { content?: string, onChange?: (newContent: string) => void }) => {
  const { theme } = useTheme()
  const contentRef = useRef(null);

  return (
    <div className={`markdown-body`}>
      <div ref={contentRef} data-markdown-theme={theme} className={`markdown-body content`}>
        <ReactMarkdown
          remarkPlugins={[
            remarkGfm,
            [remarkMath, {
              singleDollarTextMath: true,
              inlineMath: [['$', '$']],
              blockMath: [['$$', '$$']]
            }]
          ]}
          rehypePlugins={[
            rehypeRaw,
            [rehypeKatex, {
              throwOnError: false,
              output: 'html',
              trust: true,
              strict: false
            }]
          ]}
          components={{
            p: ({ node, children }) => <p>{highlightTags(children)}</p>,
            code: ({ node, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';

              if (language === 'mermaid') {
                return <MermaidWrapper content={String(children)} />;
              }

              if (language === 'mindmap') {
                return <MarkmapWrapper content={String(children)} />;
              }

              if (language === 'echarts') {
                return <EchartsWrapper options={String(children).trim()} />;
              }

              return <Code node={node} className={className} {...props}>{children}</Code>;
            },
            a: ({ node, children }) => {
              return <LinkPreview href={node?.properties?.href} text={children} />
            },
            li: ({ node, children }) => <ListItem content={content} onChange={onChange}>{children}</ListItem>,
            img: ImageWrapper
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
});

export const StreamingCodeBlock = observer(({ markdown }: { markdown: string }) => {
  return (
    <ReactMarkdown components={{ code: Code }}>
      {markdown}
    </ReactMarkdown>
  );
}); 