/*


















USE-LESS FILE













































































*/
const express = require("express");
const bodyParser = require("body-parser");
const socket = require("socket.io");
const http = require("http");
const path = require("path");
require("dotenv").config();

var Datastore = require("nedb");
const request = require("request");
const { concatSeries } = require("async");
let app = express();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = socket(server);

const db = new Datastore("database.db");
db.loadDatabase();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view-engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.route("/").get((req, res) => {
    db.find({}, (err, doc) => {
        let symbolString = "";
        doc.forEach((val) => {
            symbolString += `${val.val},`;
        });
        console.log("I am here");
        res.render("index.ejs", { symbolString, name: "krishna" });
    });
});

app.route("/init").get((req, res) => {
    request(
        `https://www.quandl.com/api/v3/datasets/WIKI/GOOG.json?limit=30&collapse=weekly&api_key=${process.env.API_KEY}`, { json: true },
        (err, response, body) => {
            if (!body["quandl_error"]) res.send(body);
        }
    );
});

app.post("/add", (req, res) => {
    let { symbol } = req.body;

    request(
        `https://www.quandl.com/api/v3/datasets/WIKI/${symbol}.json?limit=30&collapse=weekly&api_key=${process.env.API_KEY}`, { json: true },
        (err, response, body) => {
            res.send(body);
        }
    );
});

io.on("connection", (socket) => {
    console.log("new connection");
    socket.on("addsymbol", (obj) => {
        let { symbol } = obj;
        db.insert({ val: symbol });
        socket.emit("update");
    });
    socket.on("removesymbol", (obj) => {
        let { symbol } = obj;
        db.remove({ val: symbol }, (err, num) => {
            if (err) console.log("couldn't delete");
        });
        socket.emit("update");
    });
    socket.on("disconnect", () => {
        console.log("someone disconnected");
    });
});
server.listen(PORT, () => console.log("server started on port: " + PORT));