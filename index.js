const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const dotenv = require('dotenv');
const passport = require('passport');
const path = require('path');

const passportConfig = require('./passport');
const db = require('./models');
const userAPIRouter = require('./routes/api/user');

dotenv.config();
const app = express();
passportConfig();

db.sequelize.sync();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(expressSession({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },
  name: 'juicyck'
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/user', userAPIRouter);

app.get('/', (req, res) => {
  res.send('hello');
});

app.listen(3265, () => {
  console.log('server is running');
});