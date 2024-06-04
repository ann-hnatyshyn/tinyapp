const express = require("express");
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

//middleware//
app.use(cookieParser());
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
      return user[userId];
    }
  }
  return null;
};

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
  const user = req.cookies.user_id;
  if (user) {
    res.redirect("/new");
  }
  res.render('urls_new.ejs', { user });
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (!longURL) {
    return res.status(400).send('That Short URL ID does not exist, please try again');
  }
  res.redirect(longURL);
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: req.cookies["user_id"],
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const user = req.cookies.user_id;
  if (!user) {
    return res.status(400).send('Please login to access this page');
  }
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase.longURL = longURL;
  res.redirect(`/urls/${shortURL}`);
  console.log(req.body); // Log the POST request body to the console
});

const generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8);// Simple random string generator
};

app.get("/urls/:id", (req, res) => {
  const user = req.cookies.user_id;
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user};
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  if (urlDatabase[id]) {
    urlDatabase[id] = newLongURL;
    res.redirect(`/urls`);
  } else {
    res.status(404).send('URL not found');
  }
  if (urlDatabase[id]);
});


///Edit and Delete Buttons///
app.post("/urls/:id/edit", (req, res) => {
  res.redirect(`/urls/index`);
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect(`/urls`);
});

app.get('/register', (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  const templateVars = { user };
  if (user) {
    res.redirect('/urls');
  } else {
    res.render('register', templateVars);
  }
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }
  let foundUser = null;
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      foundUser = email;
    }
  }
  if (foundUser) {
    return res.status(400).send('That email is already in use');
  }
  const userId = generateRandomUserId();
  const hashPassword = async function(password) {
    return bcrypt.hash(password, 10)
      .then(hashedPassword => {
        return hashedPassword;
      })
      .catch(err => {
        console.error('Error hashing password:', err);
        throw err;
      });
  };
  const newUser = {
    id: generateRandomUserId,
    email: email,
    password: hashPassword,
  };
  users[userId] = newUser;
  console.log(users);
  res.cookie('user_id', newUser);
  res.redirect('/login');
});

const generateRandomUserId = function(length = 6) {
  return Math.random().toString(36).substring(2, 2 + length);
};


app.get('/login', (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  const templateVars = { user };
  if (user) {
    res.redirect('/urls');
  } else {
    res.render('login', templateVars);
  }
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log(req.body);
  if (!email || !password) {
    return res.status(403).send('please provide both a username and a password');
  }
  findUserByEmail(email, password);
  if (!findUserByEmail) {
    return res.status(400).send('no user with that email found');
  }
  if (findUserByEmail.password !== password) {
    return res.status(400).send('the passwords do not match');
  }
  res.cookie('user_id', findUserByEmail);
  res.redirect("/urls"); //<====== change?
});


app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});


app.get('protected', (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) {
    res.status(401).send('you need to be logged in to see this page');
  }
  const templateVars = {};
  res.render('protected', templateVars);
});