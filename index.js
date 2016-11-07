// load modules
var express = require('express');
var hbs = require('express-handlebars');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');

// load .env
require('dotenv').config();

// create app
var app = express();
var PORT = process.env.PORT || 8081;

// setup cookieParser and bodyParser middleware
// before our routes that depend on them
app.use(cookieParser());

// set cookieSecret in .env
app.use(session({
    secret: process.env.cookieSecret,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    },
    resave: false,
    saveUninitialized: true,
    // add session store
    store: new MongoStore({
      url: process.env.DB_URL
    })
  }
));

// attach req.session.flash to res.locals
app.use(function(req, res, next) {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// init handlebars
app.engine('handlebars', hbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// add form fields to req.body, i.e. req.body.username
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// connect to database
mongoose.connect(process.env.DB_URL);

var options = {};
var auth = require('./lib/auth')(app, options);
auth.init(); // setup middleware
auth.registerRoutes();

// home page
app.get('/', function(req, res) {
  if (req.user) {
   return res.render('view', {
     treats: req.user.treats.join(', ')
   }); 
  }
  return res.render('view', {
    treats: 'No treats.'
  });
});

app.post('/treat', function(req, res) {
  var dbQuery = {$push: {treats: req.body.treat}};
  User.findByIdAndUpdate(req.user._id, dbQuery, function(err, data) {
    if (err) {
      res.status(404).json({
        status: 'error'
      });
    }
    res.json({
      status: 'success',
      treats: data.treats
    });
  });
});

app.get('/leaders', function(req, res) {
  if (req.user.role !== 'admin') {
    res.status('403').send('Unauthorized')
  } else {
    var User = require('./models/user');
    User.find({}, function(err, users) {
      res.json(users);
    });
  }
})

// after routes but before error handlers
app.use(express.static('public'));

// start server
app.listen(PORT, function() {
  console.log('listening on port ', PORT);
});