//dependencies//
const express = require("express");
const morgan = require('morgan');
const cookieSession = require("cookie-session");
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

//helperFunctions//
const urlDatabase = require("./helperFunctions.js");
const users = require("./helperFunctions.js");
const findUserByEmail = require("./helperFunctions.js");
const urlsForUser = require("./helperFunctions.js");
const generateRandomString = require("./helperFunctions.js");
const generateRandomUserId = require("./helperFunctions.js");

// Debugging utility
const logSession = (req) => console.log('Session:', req.session);

//middleware//
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));

//configuration//
app.set("view engine", "ejs");


/////Routes/////
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const user = req.session.user_id;
  if (!user) {
    return res.redirect('/login');
  }
  const templateVars = {
    urls: urlsForUser(user),
    user,
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const user = req.session.user_id;
  if (!user) {
    return res.status(400).send('Please login to access this page');
  }
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = {
    longURL,
    userID: user
  };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  const user = req.session.user_id;
  console.log(user);
  if (!user) {
    return res.redirect("/login");
  }
  res.render('urls_new', { user });
});

///Register///
app.get('/register', (req, res) => {
  const userId = req.session.user_id;
  logSession(req); // Debug session
  const user = users[userId]; // Use the value of userId to look up the user
  if (user) {
    res.redirect('/urls');
  } else {
    res.render('register', { userId: null });
  }
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  logSession(req); // Debug session
  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }
  const user = findUserByEmail(email, users);
  if (user) {
    return res.status(400).send('That email is already in use');
  }
  const userId = generateRandomUserId();
  const hashPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: userId,
    email: email,
    password: hashPassword,
  };
  users[userId] = newUser;
  req.session.userId = userId;
  res.redirect('/urls');
});

///Login///
app.get('/login', (req, res) => {
  const userId = req.session.user_id ? req.session.user_id : null;
  logSession(req); // Debug session
  if (userId) {
    return res.redirect('/urls');
  }
  res.render('login');
  console.log(userId);
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(403).send('please provide both a username and a password');
  }
  const user = findUserByEmail(email, users);
  if (!user) {
    return res.status(400).send('no user with that email found');
  }
  if (bcrypt.compareSync(password, user.password)) {
    req.session.userId = user.id;
    res.cookie('lastLogin', new Date().toISOString()); // Setting a custom cookie
    res.redirect("/urls");
  } else {
    return res.status(400).send('the passwords do not match');
  }
  res.redirect('/urls');
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (!longURL) {
    return res.status(400).send('That Short URL ID does not exist, please try again');
  }
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  const user = req.session.user_id;
  if (!user) {
    return res.redirect('/login');
  }
  const urlData = urlDatabase[req.params.id];
  if (!urlData || urlData.userID !== user) {
    return res.status(403).send('You do not have permission to view this URL');
  }
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user};
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const user = req.session.user_id;
  const id = req.params.id;
  const urlData = urlDatabase[id];
  if (!urlData) {
    res.status(404).send('URL not found');
  }
  if (urlData.userID !== user) {
    return res.status(403).send('You are unable to edit this URL');
  }
  const newLongURL = req.body.longURL;
  urlDatabase[id].longURL = newLongURL;
  res.redirect(`/urls`);
});

///Edit and Delete Buttons///
app.post("/urls/:id/edit", (req, res) => {
  const user = req.session.user_id;
  const id = req.params.id;
  const urlData = urlDatabase[id];
  if (!urlData) {
    return res.status(404).send('URL not found');
  }
  if (urlData.userID !== user) {
    return res.status(403).send('You do not have permission to edit this URL');
  }
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const user = req.session.user_id;
  const id = req.params.id;
  const urlData = urlDatabase[id];
  if (!urlData) {
    return res.status(404).send('URL not found');
  }
  if (urlData.userID !== user) {
    return res.status(403).send('You do not have permission to delete this URL');
  }
  delete urlDatabase[id];
  res.redirect(`/urls`);
});

///Logout///
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});

// Protecting routes
const requireLogin = (req, res, next) => {
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  next();
};

app.get("/urls", requireLogin, (req, res) => {
  const user = req.session.user_id;
  const templateVars = {
    urls: urlDatabase,
    user,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", requireLogin, (req, res) => {
  const user = users[req.session.user_id];
  const urlData = urlDatabase[req.params.id];
  if (!urlData) {
    return res.status(404).send('URL not found');
  }
  if (urlData.userID !== user) {
    return res.status(403).send('You do not have permission to view this URL');
  }
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user};
  res.render("urls_show", templateVars);
});


const saltRounds = 10;
const myPlaintextPassword = 's0/4$$w0rD';
const salt = bcrypt.genSaltSync(saltRounds);
const hash = bcrypt.hashSync(myPlaintextPassword, salt);


bcrypt.genSalt(saltRounds, function(err, salt) {
  bcrypt.hash(myPlaintextPassword, salt, function(err, hash) {
    console.log(hash);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});