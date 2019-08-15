var express = require('express');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var path = require('path');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var nconf = require('nconf');
var mysql = require('mysql');
var decode = require('./utils/decode');

var mysqlOptions = {
  host: decode(nconf.get('mysql:host')),
  user: decode(nconf.get('mysql:user')),
  password: decode(nconf.get('mysql:password')),
  database: decode(nconf.get('mysql:database'))
};

var connection = mysql.createConnection(mysqlOptions);


connection.connect(function (err) {
  if (err) {
    console.log("MySQL connection error: " + err);
    console.log("Stopping the app.");
    process.exit();
  } else {
    console.log("Connected to MySQL");
    // Keeps connection from Inactivity Timeout
    setInterval(function () {
      connection.ping();
    }, 60000);
  }
});

var sessionStore = new MySQLStore(mysqlOptions);

var routes = require('./routes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  name: decode(nconf.get('session:name')),
  resave: true,
  saveUninitialized: true,
  secret: decode(nconf.get('session:secret')),
  secure: true,
  store: sessionStore
}));


// Make the db and configs accessible to routes
 app.use(function (req, res, next) {
  req.configs = nconf;
  req.connection = connection;
  res.locals.version = require('./package.json').version;
  next();
});

app.use('/', routes);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('pages/error');
});

module.exports = app;
