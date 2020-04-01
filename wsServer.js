const rpcWSS = require("rpc-websockets").Server;
const fs = require("fs");

let server = new rpcWSS({
  port: 5000,
  host: "localhost"
});

server.event("modificationoffile");

fs.watch("./backup/", (event, file) => {
  if (file.includes("StudentsList")) {
    server.emit("modificationoffile", { file: file, event: event });
  }
});
