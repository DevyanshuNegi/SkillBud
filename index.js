import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { name } from "ejs";

// for dirname to send html file
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));


const db = new pg.Client({
	user: "postgres",
	host: "localhost",
	database: "hack",
	password: "asdfjkl;",
	port: 5432,
});

db.connect();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => { // done home page
	res.sendFile(__dirname + "/views"+"/home.html");
});

app.get("/login", (req, res) => { // login page
    res.render("login.ejs")
})
app.get("/register", (req, res) => {
    res.render("register.ejs")
})

app.post("/submit", (req, res) => {
	var body = req.body;
	console.log(body);
	res.render("login.ejs");
	
});


app.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`);
});
