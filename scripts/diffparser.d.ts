// diffparser.d.ts
declare module "diffparser" {
  interface DiffChange {
    type: "add" | "del" | "normal";
    add?: boolean;
    del?: boolean;
    oldLine?: number;
    newLine?: number;
    position: number;
    content: string;
  }

  interface DiffChunk {
    content: string;
    changes: DiffChange[];
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
  }

  interface DiffFile {
    from: string;
    to: string;
    chunks: DiffChunk[];
    deletions: number;
    additions: number;
    index: string[];
  }

  const parse: (diffText: string) => DiffFile[];
  export default parse;
}
