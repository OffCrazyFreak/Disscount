const MEMBER_END = "</wfs:member>";

export interface IMemberScanner {
  write(bytes: Uint8Array): void;
  end(): void;
}

/**
 * Feeds each `<wfs:member>` element of a GML stream to `onMember` as text.
 * Chunks end anywhere, so the decoder keeps split UTF-8 characters and the
 * buffer keeps the unfinished tail until its closing tag arrives.
 */
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
