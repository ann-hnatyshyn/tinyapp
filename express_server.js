const express = require("express");
const morgan = require('morgan');
const cookieSession = require("cookie-session");
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;
const mocha = require('mocha');
const chai = require('chai');
mocha();
chai();

//middleware//
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));



//configuration//
app.set("view engine", "ejs");

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//Helper functions//
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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

const findUserByEmail = (email, users) => {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

const urlsForUser = function(id) {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
};

const generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8);// Simple random string generator
};

const generateRandomUserId = function(length = 6) {
  return Math.random().toString(36).substring(2, 2 + length);
};

// const getUserByEmail = function(email, database) {
//   for (let userId in database) {
//     if (database[userId].email === email) {
//       return database[userId];
//     }
//   }
//   return null; // Return null if no user is found
// };


/////Routes/////

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
  const user = req.session['user_id'];
  if (!user) {
    return res.redirect("/login"); //<======res.redirect("/new")
  }
  res.render('urls_new', { user });
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (!longURL) {
    return res.status(400).send('That Short URL ID does not exist, please try again');
  }
  res.redirect(longURL);
});

app.get("/urls", (req, res) => {
  const user = req.session.user_id; //<===== const user = req.session['user_id'];?

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
  const user = req.session['user_id'];
  if (!user) {
    return res.status(400).send('Please login to access this page');
  }
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = {
    longURL,
    userID: user
  }; //<===== urlDatabase.longURL = longURL;?
  res.redirect(`/urls/${shortURL}`);
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

///Register///
app.get('/register', (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  if (user) {
    res.redirect('/urls');
  } else {
    res.render('register', { user:  null}); //<=====?
  }
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
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
  req.session.newUser = userId; //<====?
  res.redirect('/urls');
});

///Login///
app.get('/login', (req, res) => {
  const userId = req.session.user_id ? req.session.user_id : null;
  if (userId) {
    return res.redirect('/urls');
  }
  res.render('login');
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
    req.session['user_id'] = user.id;
    console.log(`User ${user.id} logged in successfully`);
    res.redirect("/urls");
  } else {
    return res.status(400).send('the passwords do not match');
  }
});

///Logout///
app.post("/logout", (req, res) => {
  req.session['user_id'] = null;
  res.redirect('/login');
});