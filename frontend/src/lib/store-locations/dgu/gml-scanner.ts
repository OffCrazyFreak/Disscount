const MEMBER_END = "</wfs:member>";

// Real members are a few kilobytes; anything this long means the feed changed shape, and buffering would pull 2.6 GB into memory.
const MAX_MEMBER_CHARS = 1_000_000;

export interface IMemberScanner {
  write(bytes: Uint8Array): void;
  end(): void;
}

/** Chunks end anywhere, so the decoder keeps split UTF-8 characters and the buffer keeps the unfinished tail. */
export function createMemberScanner(
  onMember: (member: string) => void,
): IMemberScanner {
  const decoder = new TextDecoder("utf-8");
  let tail = "";

  function drain(text: string) {
    let start = 0;
    let end = text.indexOf(MEMBER_END, start);

    while (end !== -1) {
      end += MEMBER_END.length;
      onMember(text.slice(start, end));
      start = end;
      end = text.indexOf(MEMBER_END, start);
    }

    tail = text.slice(start);

    if (tail.length > MAX_MEMBER_CHARS) {
      throw new Error(`GML member over ${MAX_MEMBER_CHARS} characters`);
    }
  }

  return {
    write(bytes) {
      drain(tail + decoder.decode(bytes, { stream: true }));
    },
    end() {
      drain(tail + decoder.decode());
      tail = "";
    },
  };
}
