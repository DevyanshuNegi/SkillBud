/** @format */

import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";

const app = express();
const port = 3000;
const saltRounds = 10;

var varname = "";
var varemail = "";
env.config();

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: true,
	})
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
	user: process.env.PG_USER,
	host: process.env.PG_HOST,
	database: process.env.PG_DATABASE,
	password: process.env.PG_PASSWORD,
	port: process.env.PG_PORT,
});
db.connect();

app.get("/", (req, res) => {
	res.render("home.ejs");
});

app.get("/login", (req, res) => {
	res.render("login.ejs");
});

app.get("/register", (req, res) => {
	res.render("register.ejs");
});

app.get("/save", async (req, res) => {
	const details = req.query;
	varname = details.varname;
	/* details: {
    name: 'example',
    age: '23',
    gender: 'female',
    batch: '2023',
    branch: 'core',
    skills: [ 'back-end', 'dsa', 'video-editing' ]
  },*/

	console.log("entered the save ", req.query);
	const skillsJSON = JSON.stringify(details.skills);

  	await db.query(
			"INSERT INTO details (email, name, date_of_birth, gender, batch, branch, skills) values($1, $2, $3, $4, $5, $6, $7) ",
			[varemail, details.name, details.dob, details.gender, parseInt(details.batch),details.branch, skillsJSON]
		);
// INSERT INTO details (email, name, date_of_birth, gender, batch, branch, skills, reg_no) 
// VALUES ('example1@example.com', 'John Negi Doe', '1990-05-15', 'Male', 2022, 'Computer Science', '["Java", "Python", "HTML/CSS"]', 123456);

	res.redirect("/login");
})

app.get("/logout", (req, res) => {
	req.logout(function (err) {
		if (err) {
			return next(err);
		}
		res.redirect("/");
	});
});

app.post("/submit", (req, res) =>{
	res.send("INSIDE the submit");
})

app.get("/dash", (req, res) => {
	console.log(req.query);
	if (req.isAuthenticated()) {
		res.render("dash.ejs");
	} else {
		console.log("Request not authenticated");
		res.redirect("/home"); // changed here
	}
});

app.get("/auth/google",
	passport.authenticate("google", {
		// * authentication
		scope: ["profile", "email"],
	})
);

app.get("/auth/google/dash",
	passport.authenticate("google", {
		// * the page after the login
		successRedirect: "/dash",
		failureRedirect: "/login",
	})
);

app.get("/details", (req, res) => {
	res.render("details.ejs", {email: varemail});

})

app.post("/login",
	passport.authenticate("local", {
		// *** must use on every login
		successRedirect: "/dash",
		failureRedirect: "/login",
	})
);

app.post("/register", async (req, res) => {
	const email = req.body.username; // errorit always use username instead of email or mail
	varemail = email;
	const password = req.body.password;
	console.log("the mail is ", email , " and pass is ", password);

	try {
		const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
			email,
		]);

		if (checkResult.rows.length > 0) {
			req.redirect("/login"); // errorit here it must be req.redirect and not res.redirect

		} else {
			bcrypt.hash(password, saltRounds, async (err, hash) => {
				if (err) {
					console.error("Error hashing password:", err);
				} else {
					const result = await db.query(
						"INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
						[email, hash]
					);
					const user = result.rows[0];
					req.login(user, (err) => {
						console.log("success");
						res.redirect("/details");
					});
				}
			});
		}
	} catch (err) {
		console.log(err);
	}
});

passport.use(
	"local",
	new Strategy(async function verify(username, password, cb) {
			console.log("Inside passport local")
		try {
			const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
				username,
			]);
			if (result.rows.length > 0) {
				const user = result.rows[0];
				const storedHashedPassword = user.password;
				bcrypt.compare(password, storedHashedPassword, (err, valid) => {
					if (err) {
						console.error("Error comparing passwords:", err);
						return cb(err);
					} else {
						if (valid) {
							return cb(null, user);
						} else {
							return cb(null, false);
						}
					}
				});
			} else {
				return cb("User not found");
			}
		} catch (err) {
			console.log("error on database");
			console.log(err);
		}
	})
);

passport.use(
	"google",
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: "http://localhost:3000/auth/google/secrets", // here could be dash
			userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
		},
		async (accessToken, refreshToken, profile, cb) => {
			try {
				console.log(profile);
				const result = await db.query("SELECT * FROM users WHERE email = $1", [
					profile.email,
				]);
				if (result.rows.length === 0) {
					const newUser = await db.query(
						"INSERT INTO users (email, password) VALUES ($1, $2)",
						[profile.email, "google"]
					);
					return cb(null, newUser.rows[0]);
				} else {
					return cb(null, result.rows[0]);
				}
			} catch (err) {
				return cb(err);
			}
		}
	)
);
passport.serializeUser((user, cb) => {
	cb(null, user);
});

passport.deserializeUser((user, cb) => {
	cb(null, user);
});

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
