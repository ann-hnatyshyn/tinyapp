const express = require("express");
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//middleware
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));

//configuration
app.set("view engine", "ejs");

//GET
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  const username = req.cookies.username;
  res.render('urls_new.ejs', { username: username });
});

app.get("/urls/:id", (req, res) => {
  const username = req.cookies.username;
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username};
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = req.body.longURL;
  res.redirect(longURL);
});

app.get('/login', (req, res) => {
  res.redirect(`/urls`);
});

app.get("/urls", (req, res) => {
  console.log(req.cookies.username);
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"],
  };
  res.render("urls_index", templateVars);
});

// app.get('/urls/new', (req, res) => {
//   const username = req.session.username;
//   res.render('urls_new.ejs', { username: username });
// });

// app.get("/urls", (req, res) => {
//   const templateVars = { urls: urlDatabase };
//   res.render("urls_index", templateVars);
// });

//POST
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
  console.log(req.body); // Log the POST request body to the console
});

const generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8);// Simple random string generator
};

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect(`/urls`);
});

app.post("/urls/logout", (req, res) => {
  res.clearCookie('cookieName');
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  res.cookie("username", username);
  res.redirect(`/urls`);
});
