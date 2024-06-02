const express = require("express");
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

//middleware
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));

//configuration
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "1234",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "5678",
  },
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

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
  res.render('login');
  // res.redirect(`/urls`);
});

app.get("/urls", (req, res) => {
  console.log(req.cookies.username);
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"],
  };
  res.render("urls_index", templateVars);
});

app.get('/register', (req, res) => {
  res.render('urls_register.ejs');
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

app.post("/urls/:id/edit", (req, res) => {
  res.redirect(`/urls/index`);
});

app.post("/urls/:id", (req, res) => {
  let id = req.params.id; // Get the unique ID from the URL path
  const newLongURL = req.body.longURL; // Get the new long URL from the form data
  if (id) { // Check if the URL with the given ID exists
    id = newLongURL; // Update the URL
    res.redirect(`/urls`); // Redirect to the main URL listing page
  } else {
    res.status(404).send('URL not found');
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect(`/urls`);
});

app.post("/urls/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});


app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let foundEmail = null;
  if (!email || !password) {
    res.status(400).send('please provide both a username and a password');
  }
  for (const userEmail in users) {
    const email = users[userEmail];
    if (email.userEmail === email) {
      foundEmail = userEmail;
    }
  }
  if (foundEmail) {
    res.status(400).send('email already in use');
  }
  if (foundEmail.password !== password) {
    res.status(400).send('the password does not match');
  }
  res.cookie("userId", foundEmail.id);
  res.redirect(`/protected`);
  res.render('register');
});

app.get('protected', (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) {
    res.status(401).send('you need to be logged in to see this page');
  }
  const templateVars = {};
  res.render('protected', templateVars);
});