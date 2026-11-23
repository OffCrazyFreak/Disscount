// Streams a gzipped heap snapshot of the frontend's Node process to stdout, then closes its inspector.
// Runs inside the container through stdin, so nothing is written there:
//   docker exec <frontend> kill -USR1 1
//   docker exec -i <frontend> node - < scripts/heap-snapshot.cjs > frontend.heapsnapshot.gz
const zlib = require("node:zlib");

const INSPECTOR_URL = "http://127.0.0.1:9229/json/list";

async function connect() {
  const targets = await (await fetch(INSPECTOR_URL)).json();
  const socket = new WebSocket(targets[0].webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });

  return socket;
}

async function main() {
  const socket = await connect();
  const gzip = zlib.createGzip({ level: 6 });
  const pending = new Map();
  let lastId = 0;

  gzip.pipe(process.stdout);

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.method === "HeapProfiler.addHeapSnapshotChunk") {
      gzip.write(message.params.chunk);
    }

    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve) => {
      lastId += 1;
      pending.set(lastId, resolve);
      socket.send(JSON.stringify({ id: lastId, method, params }));
    });
  }

  await send("HeapProfiler.collectGarbage");
  await send("HeapProfiler.takeHeapSnapshot", { reportProgress: false });

  // The inspector stays open after USR1 until something closes it.
  await send("Runtime.evaluate", {
    expression: "process.getBuiltinModule('inspector').close()",
  });

  gzip.end();
  await new Promise((resolve) => gzip.on("end", resolve));
  socket.close();
}

main().catch((error) => {
  console.error("heap snapshot failed:", error?.message ?? error);
  process.exit(1);
});
