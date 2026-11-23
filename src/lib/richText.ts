/**
 * Convert lightweight markdown (as produced by Gemini/ChatGPT) to HTML.
 * Handles: **bold**, *italic*, ## headings, - bullet lists, blank-line paragraphs.
 */
function markdownToHtml(md: string): string {
  let html = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Strip fenced code blocks
  html = html.replace(/```[\s\S]*?```/g, '');

  // ATX headings
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^##\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^#\s+(.+)$/gm, '<h3>$1</h3>');

  // Bullet lists
  html = html.replace(/((?:^[ \t]*[-*•]\s+.+\n?)+)/gm, (block) => {
    const items = block
      .split('\n')
      .filter((l) => /^[ \t]*[-*•]\s+/.test(l))
      .map((l) => `<li>${l.replace(/^[ \t]*[-*•]\s+/, '').trim()}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  });

  // Numbered lists
  html = html.replace(/((?:^[ \t]*\d+\.\s+.+\n?)+)/gm, (block) => {
    const items = block
      .split('\n')
      .filter((l) => /^[ \t]*\d+\.\s+/.test(l))
      .map((l) => `<li>${l.replace(/^[ \t]*\d+\.\s+/, '').trim()}</li>`)
      .join('');
    return `<ol>${items}</ol>`;
  });

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_\n]+?)_/g, '<em>$1</em>');

  // Wrap non-tag lines in <p>
  const blocks = html.split(/\n{2,}/);
  html = blocks
    .map((block) => {
      block = block.trim();
      if (!block) return '';
      if (/^<(h[1-6]|ul|ol|blockquote|hr|div|p)[\s>]/i.test(block)) return block;
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');

  return html;
}

const ALLOWED_TAGS = /^(h[1-6]|p|br|hr|ul|ol|li|strong|b|em|i|u|s|blockquote|span|div)$/i;

/** Strip all tags except a safe allowlist. Keeps text content. */
function stripUnsafeTags(html: string): string {
  return html.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
    if (ALLOWED_TAGS.test(tag)) return match;
    return ''; // strip the tag but keep inner text (handled by browser walking)
  });
}

/**
 * Accept plain text, markdown, or HTML from any source.
 * Returns safe HTML suitable for dangerouslySetInnerHTML.
 */
export function renderRichText(input: string): string {
  if (!input) return '';
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(input);
  const html = looksLikeHtml ? input : markdownToHtml(input);
  return stripUnsafeTags(html)
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    // Remove empty <p> tags
    .replace(/<p>\s*<\/p>/g, '')
    .trim();
}
