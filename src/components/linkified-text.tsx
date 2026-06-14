import type { ReactNode } from "react";

const urlPattern = /https?:\/\/[^\s<>"']+/gi;
const trailingPunctuationPattern = /[.,!?;:)\]}、。！？；：）］】]+$/;

type LinkifiedTextProps = {
  text: string | null | undefined;
};

function splitTrailingPunctuation(value: string) {
  const match = value.match(trailingPunctuationPattern);
  if (!match) return { punctuation: "", url: value };
  return {
    punctuation: match[0],
    url: value.slice(0, -match[0].length),
  };
}

export function LinkifiedText({ text }: LinkifiedTextProps) {
  if (!text) return null;

  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(urlPattern)) {
    const matchedUrl = match[0];
    const index = match.index ?? 0;
    const { punctuation, url } = splitTrailingPunctuation(matchedUrl);

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    if (url) {
      nodes.push(
        <a key={`${url}-${index}`} href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">
          {url}
        </a>,
      );
    }
    if (punctuation) nodes.push(punctuation);

    lastIndex = index + matchedUrl.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <>{nodes}</>;
}
