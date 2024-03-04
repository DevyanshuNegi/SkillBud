import express from "express";
import bodyParser from "body-parser";
// import pg from "pg";

const app = express();
const port = 3000;

/*
const db = new pg.Client({
	user: "postgres",
	host: "localhost",
	database: "world",
	password: "asdfjkl;",
	port: 5432,
});

db.connect();
*/


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.send("Home Page")
});

app.get("/login", (req, res) => {
    res.render("search.ejs");
})

app.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`);
});