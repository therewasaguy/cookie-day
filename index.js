// load modules
var express = require('express');
var hbs = require('express-handlebars');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

// load .env
require('dotenv').config();

// create app
var app = express();
var PORT = process.env.PORT || 8081;


// set cookieSecret in .env
app.use(session({
    secret: process.env.cookieSecret,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    },
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

// home page
app.get('/', function(req, res) {
  if (req.session.treat) {
   return res.render('view', {
     msg: 'You have a treat: ' + req.session.treat
   }); 
  }
  return res.render('view', {
    msg: 'No treats.'
  });
});

app.get('/treat', function(req, res) {
  req.session.treat = 'candy corn';
  req.session.flash = {
    type: 'positive',
    header: 'You got a treat',
    body: 'The treat is ' + req.session.treat
  };
//  req.cookie('treat', 'candy corn', {
//    httpOnly: true,
//    signed: true
//  });
  res.redirect('/');
});

app.get('/clear', function(req, res) {
//  res.clearCookie('treat');
  delete req.session.treat;
  req.session.flash = {
    type: 'negative',
    header: 'No treat',
    body: 'Your bag is empty'
  };
  res.redirect('/');
});

// start server
app.listen(PORT, function() {
  console.log('listening on port ', PORT);
});