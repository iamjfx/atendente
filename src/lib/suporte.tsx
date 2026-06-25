import { AlertCircle, ChevronRight } from "lucide-react";

export const parseInlineStyles = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="italic text-foreground/80">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

export const FAQContentRenderer = ({ text }: { text: string }) => {
  const paragraphs = text.split("\n\n");

  return (
    <div className="space-y-4 text-foreground/90 leading-relaxed text-sm md:text-[15px]">
      {paragraphs.map((para, pIdx) => {
        if (para.startsWith("*Nota:") || para.toLowerCase().startsWith("nota:")) {
          const cleanText = para.replace(/^\*?Nota:\s*/i, "").replace(/\*$/, "");
          return (
            <div
              key={pIdx}
              className="flex gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 text-sm text-primary/90 mt-2 shadow-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5 text-primary">Nota Importante</span>
                <span className="text-foreground/85">{parseInlineStyles(cleanText)}</span>
              </div>
            </div>
          );
        }

        const lines = para.split("\n");
        const hasSteps = lines.some((line) => /^\d+\.\s/.test(line));
        const hasBullets = lines.some((line) => /^\s*[-*]\s/.test(line));

        if (hasSteps) {
          return (
            <div key={pIdx} className="space-y-3.5 my-3 bg-card/10 p-2 rounded-lg">
              {lines.map((line, lineIdx) => {
                const match = line.match(/^(\d+)\.\s(.*)$/);
                if (match) {
                  const [, num, content] = match;
                  return (
                    <div key={lineIdx} className="flex gap-4 items-start pl-1">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-primary/20">
                        {num}
                      </span>
                      <span className="flex-1 pt-0.5 text-foreground/85">{parseInlineStyles(content)}</span>
                    </div>
                  );
                }
                return (
                  <p key={lineIdx} className="pl-10 text-foreground/85">
                    {parseInlineStyles(line)}
                  </p>
                );
              })}
            </div>
          );
        }

        if (hasBullets) {
          return (
            <div key={pIdx} className="space-y-2.5 my-3 pl-1">
              {lines.map((line, lineIdx) => {
                const match = line.match(/^\s*[-*]\s(.*)$/);
                if (match) {
                  const content = match[1];
                  return (
                    <div key={lineIdx} className="flex gap-3 items-start pl-4">
                      <ChevronRight className="w-4 h-4 text-primary/60 shrink-0 mt-1" />
                      <span className="flex-1 text-foreground/85">{parseInlineStyles(content)}</span>
                    </div>
                  );
                }
                return (
                  <p key={lineIdx} className="pl-8 text-foreground/85">
                    {parseInlineStyles(line)}
                  </p>
                );
              })}
            </div>
          );
        }

        return <p key={pIdx} className="text-foreground/85">{parseInlineStyles(para)}</p>;
      })}
    </div>
  );
};
