export function parseMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_\-\.\s]+?)(?=\s|$|@)/g;
  const matches: string[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    matches.push(match[1].trim());
  }
  return matches;
}
