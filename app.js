var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var uuid = require('uuid');

var authRoutes = require('./routes/auth');

var app = express();

var env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// assorted express setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// for our local session store, we need to have a way to generate IDs
// which are stored in the user's browser

// NOTE: this really should be set as a secure cookie, which requires the
//       site to run on HTTPS, which is outside the scope of this demo
app.use(session({
  genid: function(req) {
    return uuid.v4()
  },
  secret: 'shiftkey was here'
}));

app.use('/', authRoutes);

app.get('/', function (req, res) {

  // express-session let's us attach arbitrary values to the user's session
  // so let's use that to correlate the session with a token and redirect
  // if we have a valid token for the current user
  if (req.session.token) {
    console.log("Authorized token exists for user, redirecting...");
    res.redirect('/home');
    return;
  }

  // otherwise we'll show the unauthenticated view
  console.log("No token found, rendering default view...")
  res.render('index');
});

app.get('/home', function (req, res) {

  if (req.session.token) {
    res.render('home', { name: req.session.name });
    return;
  }

  console.log("No token found, sending to authentication endpoint...")
  res.redirect('/auth');
});

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
      title: 'error'
    });
  });
}

// production error handler does not leak stacktraces
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
    title: 'error'
  });
});


module.exports = app;
