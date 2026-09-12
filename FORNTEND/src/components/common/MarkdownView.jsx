import React from 'react';
import {
  Zap,
  Building2,
  Calendar,
  IndianRupee,
  UserCheck,
  Activity,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileText,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

/**
 * Format inline tokens: bold, italic, code, links
 */
const formatInline = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-950 dark:text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-slate-700 dark:text-slate-300">$1</em>')
    .replace(
      /`([^`]+)`/g,
      '<code class="px-1.5 py-0.5 rounded bg-slate-150 dark:bg-slate-800 font-mono text-[11px] text-blue-700 dark:text-blue-300 font-semibold border border-slate-200 dark:border-slate-700">$1</code>'
    );
};

/**
 * Get icon for metadata keys
 */
const getMetadataIcon = (key = '') => {
  const k = key.toLowerCase();
  if (k.includes('project') || k.includes('name')) return <Building2 size={13} className="text-blue-600 dark:text-blue-400" />;
  if (k.includes('budget') || k.includes('cost') || k.includes('utilized') || k.includes('sanctioned'))
    return <IndianRupee size={13} className="text-emerald-600 dark:text-emerald-400" />;
  if (k.includes('officer') || k.includes('responsible'))
    return <UserCheck size={13} className="text-purple-600 dark:text-purple-400" />;
  if (k.includes('status')) return <Activity size={13} className="text-amber-600 dark:text-amber-400" />;
  if (k.includes('timeline') || k.includes('date') || k.includes('period'))
    return <Calendar size={13} className="text-sky-600 dark:text-sky-400" />;
  return <FileText size={13} className="text-slate-500" />;
};

/**
 * Format metadata values (e.g. highlight status badges, budget)
 */
const renderMetadataValue = (key = '', value = '') => {
  const k = key.toLowerCase();
  const v = value.trim();

  // Status badge
  if (k.includes('status')) {
    const isSuccess = /active|completed|approved|on track/i.test(v);
    const isWarning = /delayed|risk|pending|critical/i.test(v);

    let badgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    if (isSuccess) {
      badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    } else if (isWarning) {
      badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${badgeClass}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
        {v}
      </span>
    );
  }

  // Budget highlight
  if (k.includes('budget') || k.includes('utilized') || k.includes('sanctioned')) {
    return (
      <span className="font-bold text-emerald-700 dark:text-emerald-400 tracking-tight font-mono text-[12px] sm:text-[13px]">
        {v}
      </span>
    );
  }

  return (
    <span
      className="font-medium text-slate-900 dark:text-slate-100"
      dangerouslySetInnerHTML={{ __html: formatInline(v) }}
    />
  );
};

/**
 * Parse a bullet line into Key-Value pair if it matches
 */
const parseKvLine = (line) => {
  if (!/^[-*•]\s+/.test(line)) return null;
  const stripped = line.replace(/^[-*•]\s+/, '').trim();
  const colonIdx = stripped.indexOf(':');
  if (colonIdx === -1) return null;
  const rawKey = stripped.slice(0, colonIdx).replace(/\*\*/g, '').replace(/\*/g, '').trim();
  const rawValue = stripped.slice(colonIdx + 1).replace(/^\*\*/, '').trim();
  if (rawKey && rawKey.length <= 50 && !rawKey.startsWith('http') && rawValue) {
    return { key: rawKey, value: rawValue };
  }
  return null;
};

/**
 * Parse lines into cohesive markdown blocks:
 * - metadata_card: consecutive key-value bullet points
 * - practical_example: practical example title and all following steps/content
 * - table: standard markdown tables
 * - heading: #, ##, ###
 * - divider: ---
 * - ordered_list: 1. 2. 3.
 * - unordered_list: - * •
 * - blockquote: >
 * - paragraph: normal paragraphs
 */
const parseBlocks = (text) => {
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      i++;
      continue;
    }

    // 1. Divider
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(line)) {
      blocks.push({ type: 'divider' });
      i++;
      continue;
    }

    // 2. Practical Example Block
    if (
      line.toLowerCase().includes('practical example') ||
      line.toLowerCase().includes('scenario:') ||
      line.startsWith('> **Scenario')
    ) {
      let title = line
        .replace(/^#+\s*/, '')
        .replace(/^>\s*/, '')
        .replace(/💡/g, '')
        .replace(/\*\*/g, '')
        .replace(/^Practical Example:?\s*/i, '')
        .trim();

      const bodyLines = [];
      i++;
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        // Stop if a subsequent main section or divider or tool indicator begins
        if (
          nextLine.startsWith('---') ||
          (/^#{1,3}\s/.test(nextLine) && !nextLine.toLowerCase().includes('step') && !nextLine.toLowerCase().includes('example')) ||
          nextLine.startsWith('Tools Executed:')
        ) {
          break;
        }
        bodyLines.push(lines[i]);
        i++;
      }

      // If title is generic (e.g. 'Practical Example' or empty) and first body line is **Topic:**
      let cleanBodyLines = bodyLines;
      const firstNonEmpty = bodyLines.find((l) => l.trim().length > 0);
      if (firstNonEmpty) {
        const trimmedF = firstNonEmpty.trim();
        if (/^\*{0,2}[A-Za-z0-9\s/&()_–-]+?[:]\*{0,2}$/.test(trimmedF)) {
          const extractedTitle = trimmedF.replace(/\*\*/g, '').replace(/:$/, '').trim();
          if (extractedTitle) {
            title = extractedTitle;
            cleanBodyLines = bodyLines.filter((l) => l !== firstNonEmpty);
          }
        }
      }

      if (!title) title = 'Budget & Milestone Implementation';

      blocks.push({
        type: 'practical_example',
        title,
        body: cleanBodyLines.join('\n').trim(),
      });
      continue;
    }

    // 3. Table Block
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const headers = tableLines[0]
          .split('|')
          .slice(1, -1)
          .map((h) => h.trim());
        let dataStart = 1;
        if (tableLines[1].includes('---') || tableLines[1].includes(':---')) {
          dataStart = 2;
        }
        const rows = tableLines.slice(dataStart).map((r) =>
          r
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
        );
        blocks.push({ type: 'table', headers, rows });
        continue;
      }
    }

    // 4. Consecutive Key-Value Metadata List Block (Project details card)
    const initialKv = parseKvLine(line);
    if (initialKv) {
      const items = [];
      while (i < lines.length) {
        const kv = parseKvLine(lines[i].trim());
        if (!kv) break;
        items.push(kv);
        i++;
      }
      // If 2 or more key-value items exist, render as structured parameters card
      if (items.length >= 2) {
        blocks.push({ type: 'metadata_card', items });
        continue;
      } else {
        // Fallback to standard unordered list for single item
        blocks.push({ type: 'unordered_list', items: [lines[i - 1].replace(/^[-*•]\s*/, '')] });
        continue;
      }
    }

    // 5. Headings (#, ##, ###)
    if (/^#{1,4}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      const headingText = line.replace(/^#+\s*/, '').replace(/^[💡📌🔍⚙️\s]+/, '').trim();
      blocks.push({ type: 'heading', level, text: headingText });
      i++;
      continue;
    }

    // 6. Ordered / Numbered List (1. 2. 3.)
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s*/, ''));
        i++;
      }
      blocks.push({ type: 'ordered_list', items });
      continue;
    }

    // 7. Unordered List (- or * or •)
    if (/^[-*•]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s*/, ''));
        i++;
      }
      blocks.push({ type: 'unordered_list', items });
      continue;
    }

    // 8. Blockquote (> quote)
    if (line.startsWith('>')) {
      const quoteText = line.replace(/^>\s*/, '');
      blocks.push({ type: 'blockquote', text: quoteText });
      i++;
      continue;
    }

    // 9. Tools Executed Indicator (if generated in text)
    if (line.startsWith('Tools Executed:') || line.startsWith('`Tools Executed:')) {
      const toolText = line.replace(/^`?Tools Executed:\s*/i, '').replace(/`$/, '').trim();
      blocks.push({ type: 'tools_executed', toolText });
      i++;
      continue;
    }

    // 10. Normal Paragraph
    blocks.push({ type: 'paragraph', text: line });
    i++;
  }

  return blocks;
};

/**
 * Clean Markdown View for Government AI Assistant Responses
 */
export const MarkdownView = ({ content = '' }) => {
  if (!content) return null;

  const blocks = parseBlocks(content);

  return (
    <div className="space-y-2.5 text-xs sm:text-[13px] leading-relaxed text-slate-800 dark:text-slate-200">
      {blocks.map((block, idx) => {
        switch (block.type) {
          // --- Metadata Card (e.g. Project Details Summary) ---
          case 'metadata_card':
            return (
              <div
                key={`meta-${idx}`}
                className="my-3 p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-2xs"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <Building2 size={13} className="text-blue-600 dark:text-blue-400" />
                  <span>Scheme & Project Parameters</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {block.items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-150 dark:border-slate-700/60 shadow-2xs"
                    >
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium shrink-0">
                        {getMetadataIcon(item.key)}
                        <span>{item.key}:</span>
                      </div>
                      <div className="text-left sm:text-right">
                        {renderMetadataValue(item.key, item.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );

          // --- Practical Example Card (Government Implementation Example) ---
          case 'practical_example': {
            const bodyLines = block.body.split('\n');
            return (
              <div
                key={`example-${idx}`}
                className="my-3 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15 dark:via-amber-500/10 dark:to-transparent border border-amber-500/30 dark:border-amber-500/35 p-3.5 sm:p-4 text-amber-950 dark:text-amber-100 shadow-2xs"
              >
                {/* Header with Zap Badge */}
                <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-amber-500/25">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Zap size={14} className="fill-amber-500/30" />
                    </span>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 block leading-tight">
                        Practical Implementation Example
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-100">
                        {block.title}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="space-y-2 text-xs sm:text-[13px] leading-relaxed text-amber-950 dark:text-amber-100">
                  {bodyLines.map((line, lIdx) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;

                    // Numbered action items inside example
                    if (/^\d+\.\s/.test(trimmed)) {
                      const num = trimmed.match(/^(\d+)\./)[1];
                      const itemText = trimmed.replace(/^\d+\.\s*/, '');
                      return (
                        <div key={lIdx} className="flex items-start gap-2.5 my-1">
                          <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-900 dark:text-amber-300 text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/30 font-mono">
                            {num}
                          </span>
                          <div
                            className="flex-1 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: formatInline(itemText) }}
                          />
                        </div>
                      );
                    }

                    // Bullet points inside example
                    if (/^[-*•]\s/.test(trimmed)) {
                      const bulletText = trimmed.replace(/^[-*•]\s*/, '');
                      return (
                        <div key={lIdx} className="flex items-start gap-2 my-1 pl-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 shrink-0 mt-1.5" />
                          <div
                            className="flex-1 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: formatInline(bulletText) }}
                          />
                        </div>
                      );
                    }

                    // Normal paragraph inside example
                    return (
                      <p
                        key={lIdx}
                        className="leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          }

          // --- Tables ---
          case 'table':
            return (
              <div
                key={`table-${idx}`}
                className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs"
              >
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      {block.headers.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          className="px-3 py-2.5 whitespace-nowrap"
                          dangerouslySetInnerHTML={{ __html: formatInline(h) }}
                        />
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {block.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="px-3 py-2 text-slate-700 dark:text-slate-300 leading-normal"
                            dangerouslySetInnerHTML={{ __html: formatInline(cell) }}
                          />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          // --- Headings ---
          case 'heading':
            if (block.level === 1) {
              return (
                <h2
                  key={`h-${idx}`}
                  className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-3.5 mb-1.5 pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5"
                  dangerouslySetInnerHTML={{ __html: formatInline(block.text) }}
                />
              );
            }
            if (block.level === 2) {
              return (
                <h3
                  key={`h-${idx}`}
                  className="text-xs sm:text-sm font-bold text-blue-900 dark:text-blue-400 mt-3 mb-1"
                  dangerouslySetInnerHTML={{ __html: formatInline(block.text) }}
                />
              );
            }
            return (
              <h4
                key={`h-${idx}`}
                className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-200 mt-2 mb-0.5 flex items-center gap-1.5"
                dangerouslySetInnerHTML={{ __html: formatInline(block.text) }}
              />
            );

          // --- Dividers ---
          case 'divider':
            return (
              <hr
                key={`hr-${idx}`}
                className="my-2.5 border-slate-200 dark:border-slate-800"
              />
            );

          // --- Ordered Lists ---
          case 'ordered_list':
            return (
              <ol key={`ol-${idx}`} className="my-2 space-y-1.5">
                {block.items.map((item, nIdx) => (
                  <li key={nIdx} className="flex items-start gap-2.5 leading-normal">
                    <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 font-mono border border-blue-200 dark:border-blue-800">
                      {nIdx + 1}
                    </span>
                    <div
                      className="flex-1"
                      dangerouslySetInnerHTML={{ __html: formatInline(item) }}
                    />
                  </li>
                ))}
              </ol>
            );

          // --- Unordered Lists ---
          case 'unordered_list':
            return (
              <ul key={`ul-${idx}`} className="my-2 space-y-1">
                {block.items.map((item, uIdx) => (
                  <li key={uIdx} className="flex items-start gap-2 leading-normal">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 mt-1.5" />
                    <div
                      className="flex-1"
                      dangerouslySetInnerHTML={{ __html: formatInline(item) }}
                    />
                  </li>
                ))}
              </ul>
            );

          // --- Blockquote ---
          case 'blockquote':
            return (
              <blockquote
                key={`quote-${idx}`}
                className="my-2 pl-3 border-l-2 border-blue-600 dark:border-blue-400 text-slate-700 dark:text-slate-300 italic"
                dangerouslySetInnerHTML={{ __html: formatInline(block.text) }}
              />
            );

          // --- Tools Executed Token ---
          case 'tools_executed':
            return (
              <div
                key={`tool-${idx}`}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-slate-700"
              >
                <span>🛠️ Tool:</span>
                <span className="font-bold">{block.toolText}</span>
              </div>
            );

          // --- Paragraph ---
          default:
            return (
              <p
                key={`p-${idx}`}
                className="leading-relaxed my-1"
                dangerouslySetInnerHTML={{ __html: formatInline(block.text) }}
              />
            );
        }
      })}
    </div>
  );
};

export default MarkdownView;
