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
const postAPIRouter = require('./routes/api/post');
const commentAPIRouter = require('./routes/api/comment');

dotenv.config();
const app = express();
passportConfig();

db.sequelize.sync();
app.set('port', process.env.PORT || 3265);

if (process.env.NODE_ENV === 'production') {
  app.use(hpp());
  app.use(helmet());
  app.use(morgan('combined'));
  app.use(cors({
    origin: '배포 주소 여기에 넣기',
  }));
} else {
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(morgan('dev'));
}

app.use(express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/post', postAPIRouter);
app.use('/api/comment', commentAPIRouter);



app.listen(app.get('port'), () => {
  console.log('server is running');
});
