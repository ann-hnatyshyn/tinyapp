const express = require("express");
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
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

const findUserByEmail = (email, users) => {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
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
  const username = req.cookies.username;
  res.render('urls_new.ejs', { username: username });
});

app.get("/u/:id", (req, res) => {
  const longURL = req.body.longURL;
  res.redirect(longURL);
});


app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"],
  };
  res.render("urls_index", templateVars);
});

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

app.get("/urls/:id", (req, res) => {
  const username = req.cookies.username;
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username};
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  let id = req.params.id;
  const newLongURL = req.body.longURL;
  if (id) { // Check if the URL with the given ID exists
    newLongURL[urlDatabase]; // Update the URL
    res.redirect(`/urls`);
  } else {
    res.status(404).send('URL not found');
  }
});

///Edit and Delete Buttons///
app.post("/urls/:id/edit", (req, res) => {
  res.redirect(`/urls/index`);
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  // const urlId = req.params.id;
  // if (urlDatabase[urlId] && urlDatabase[urlId].userId === req.session.user_id) {
  //   delete urlDatabase[id];
  //   res.redirect('/urls');
  // } else {
  //   res.status(403).send('You do not have permission to delete this URL');
  // }
  delete urlDatabase[id];
  res.redirect(`/urls`);
});

app.post("/urls/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

//Register//
app.get('/register', (req, res) => {
  res.render('/register');
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('Email and password cannot be empty');
  }
  if (findUserByEmail(email, users)) {
    return res.status(400).send('Email already registered');
  }
  const userId = `user_${Date.now()}`;
  const newUser = {
    id: userId,
    email,
    password // In production, hash the password with bcrypt
  };
  users[userId] = newUser;
  res.render('register');
  res.cookie('user_id', userId);
  res.redirect('/urls');
});

////Log IN /////
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = findUserByEmail(email, users);
  if (!user) {
    return res.status(403).send('User not found');
  }
  if (user.password !== password) { // In production, use bcrypt to compare passwords
    return res.status(403).send('Password does not match');
  }
  req.session.username = user.id;
  res.redirect('/urls');
});



// app.get('protected', (req, res) => {
//   const userId = req.cookies.userId;
//   if (!userId) {
//     res.status(401).send('you need to be logged in to see this page');
//   }
//   const templateVars = {};
//   res.render('protected', templateVars);
// });




// app.post('/register', (req, res) => {
//   const email = req.body.email;
//   const password = req.body.password;
//   let foundEmail = null;
//   // res.render('register');
//   if (!email || !password) {
//     res.status(400).send('please provide both an email and a password');
//   }
//   for (const userEmail in users) {
//     const email = users[userEmail];
//     if (email.userEmail === email) {
//       foundEmail = userEmail;
//     }
//   }
//   if (foundEmail) {
//     res.status(400).send('email already in use');
//   }
//   if (password !== password) {
//     res.status(400).send('the password does not match');
//   }
//   res.cookie("userId", foundEmail.id);
//   res.redirect(`/register`);
// });