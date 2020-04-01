const http = require("http");
const parser = require("url");
const fs = require("fs");

const port = 40001;
const file = JSON.parse(fs.readFileSync("StudentsList.json", "utf-8"));

const error1 = res => {
  res.writeHead(404, {
    "Content-type": "application/json; charset=utf-8"
  });
  res.end(
    JSON.stringify({
      error: 1,
      message: `Данный метод не поддерживается`
    })
  );
};
const error2 = res => {
  res.writeHead(404, {
    "Content-type": "application/json; charset=utf-8"
  });
  res.end(
    JSON.stringify({
      error: 2,
      message: `Данный url не поддерживается`
    })
  );
};
const error3 = res => {
  res.writeHead(401, {
    "Content-type": "application/json; charset=utf-8"
  });
  res.end(
    JSON.stringify({
      error: 3,
      message: `Студент с данным идентификатором уже существует`
    })
  );
};
const error4 = res => {
  res.writeHead(404, {
    "Content-type": "application/json; charset=utf-8"
  });
  res.end(
    JSON.stringify({
      error: 4,
      message: `Студент с данным идентификатором не найден`
    })
  );
};
const error5 = res => {
  res.writeHead(404, {
    "Content-type": "application/json; charset=utf-8"
  });
  res.end(
    JSON.stringify({
      error: 5,
      message: `Записи не найдены`
    })
  );
};

const server = http.createServer((req, res) => {
  const url = parser.parse(req.url, true);
  let body = [];
  req.on("data", data => {
    body.push(data.toString());
  });
  switch (req.method) {
    case "GET":
      getReq(req, res, url, body);
      break;
    case "POST":
      postReq(req, res, url, body);
      break;
    case "PUT":
      putReq(req, res, url, body);
      break;
    case "DELETE":
      deleteReq(req, res, url, body);
      break;
    default:
      error1(res);
  }
});
const getReq = (req, res, url, body) => {
  switch (url.pathname) {
    case "/": {
      res.writeHead(200, {
        "Content-type": "application/json; charset=utf-8"
      });
      res.end(JSON.stringify(file));
      break;
    }
    case "/backup": {
      fs.readdir(`./backup/`, (err, files) => {
        let fileList = [];
        files.forEach(file => {
          if (file.includes("StudentsList")) {
            fileList.push({ filename: file });
          }
        });
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8"
        });
        res.end(JSON.stringify(fileList));
      });
      break;
    }
    default: {
      let searchID = url.path.slice(1);
      if (!isNaN(+searchID)) {
        if (
          (searchedStudent = file.find(student => student.id === +searchID))
        ) {
          res.writeHead(200, {
            "Content-type": "application/json; charset=utf-8"
          });
          res.end(JSON.stringify(searchedStudent));
        } else {
          error4(res);
        }
      } else {
        error2(res);
      }
    }
  }
};

const postReq = (req, res, url, body) => {
  switch (url.pathname) {
    case "/":
      let flag = false;
      req.on("end", () => {
        body = JSON.parse(body);
        file.forEach(element => {
          if (element.id === body.id) {
            flag = true;
          }
        });
        if (!flag) {
          res.writeHead(200, {
            "Content-type": "application/json; charset=utf-8"
          });
          res.end(JSON.stringify(body));
          file.push(body);
          fs.writeFileSync("StudentsList.json", JSON.stringify(file, null, 2));
        } else {
          error3(res);
        }
      });
      break;

    case "/backup":
      let current = new Date();
      const addZero = n => {
        return (n < 10 ? "0" : "") + n;
      };
      let date =
        addZero(current.getFullYear()) +
        addZero(current.getMonth()) +
        addZero(current.getDate()) +
        addZero(current.getHours()) +
        addZero(current.getMinutes()) +
        addZero(current.getSeconds());

      setTimeout(
        () =>
          fs.writeFile(
            `./backup/${date}_StudentsList.json`,
            JSON.stringify(file, null, 2),
            err => {
              if (err) throw err;
              console.log("The file has been saved!");
            }
          ),
        2000
      );
      res.end();
      break;
    default:
      error2(res);
  }
};
const putReq = (req, res, url, body) => {
  switch (url.pathname) {
    case "/":
      let flag;
      req.on("end", () => {
        body = JSON.parse(body);
        file.forEach((value, key) => {
          if (value.id == body.id) {
            file.splice(key, 1);
            flag = true;
          }
        });
        if (flag) {
          res.writeHead(200, {
            "Content-type": "application/json; charset=utf-8"
          });
          file.push(body);
          file.sort((a, b) => a.id - b.id);
          fs.writeFileSync("StudentsList.json", JSON.stringify(file, null, 2));
          res.end(JSON.stringify(body));
        } else {
          error4(res);
        }
      });
      break;
    default:
      error2(res);
  }
};
const deleteReq = (req, res, url, body) => {
  let searchBackupDate = url.path.slice(8);
  switch (url.pathname) {
    case `/backup/${searchBackupDate.match(/\d{0,8}/).join("")}`:
      let correctBackupDate =
        searchBackupDate.slice(0, 4) +
        searchBackupDate.slice(6, 8) +
        searchBackupDate.slice(4, 6);
      fs.readdir(`backup`, (err, lists) => {
        if (lists.length) {
          lists.forEach(file => {
            let creationDate = file.slice(0, 8);
            if (+creationDate < +correctBackupDate) {
              fs.unlink(`backup/${file}`, err => {
                if (err) {
                  res.statusCode = 500;
                  res.body = JSON.stringify({ error: err.message });
                  throw err;
                }
                res.writeHead(200, {
                  "Content-type": "text/plain; charset=utf-8"
                });
                res.end("Записи удалены!");
              });
            } else {
              error5(res);
            }
          });
        } else {
          error5(res);
        }
      });
      break;
    default:
      if (url.pathname.includes("backup")) {
        error2(res);
      } else {
        let searchID = url.path.slice(1);
        let searchedStudent = file.find(student => student.id === +searchID);

        if (searchedStudent) {
          file.forEach((student, key) => {
            if (student.id === +searchID) {
              file.splice(key, 1);
              file.sort((a, b) => a.id - b.id);
            }
          });
          res.writeHead(200, {
            "Content-type": "application/json; charset=utf-8"
          });
          fs.writeFileSync("StudentsList.json", JSON.stringify(file, null, 2));
          res.end(JSON.stringify(searchedStudent));
        } else {
          error4(res);
        }
      }
      break;
  }
};

server.listen(port, () =>
  console.log(`Server started on http://localhost:${port}`)
);
server.on("error", e => {
  console.log(`${e.code} on http://localhost:${port}`);
});
