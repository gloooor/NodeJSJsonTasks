const rpcWSC = (WebSocket = require("rpc-websockets").Client);
const ws = new rpcWSC("ws://localhost:5000");

ws.on("open", () => {
  ws.subscribe("modificationoffile");

  ws.on("modificationoffile", report => console.log(report));
});
