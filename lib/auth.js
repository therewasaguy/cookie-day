var passport = require('passport');
var LocalStrategy = require('passport-local');
var TwitterStrategy = require('passport-twitter');
var User = require('../models/user');

// twitter Options
var twOptions = {
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  callbackURL: '/auth/twitter/callback'
};


function twCallback(token, tokenSecret, profile, cb) {

  // query DB based on the twitterId
  User.findOne({ twitterId: profile.id }, function (err, user) {
  
    // if user exists, sign in as that user
    if (user) return cb(err, user);
    
    // otherwise, create and save a new user
    var userObj = new User({
      username: profile.username,
      twitterId: profile.id
    });
    userObj.save(function(err, user) {
      return cb(err, user);
    });

  });
}


module.exports = function(app, options) {
  
  return {
    init: function() {

      passport.use( new LocalStrategy(User.authenticate()));

      // let passport know it can use TwitterStrategy
      passport.use(new TwitterStrategy(twOptions, twCallback));
                   
      passport.serializeUser(function(user, done) {
        done(null, user._id);
      });
      
      passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
          // handle err
          if (err || !user) {
            return done(err, null);
          }
          done(null, user);
        });
      });
      
      app.use(passport.initialize());
      app.use(passport.session());
      
      app.use(function(req, res, next) {
        // add user to res.locals
        // passport adds req.user
        // we can use res.locals.user in our views
        res.locals.user = req.user;
        next();
      });
    },
    
    registerRoutes: function() {

      app.get('/signup', function(req, res) {
        res.render('signup', {header: 'Sign Up!!!'})
      });

      app.post('/signup', function(req, res, next) {
        var newUser = new User({
          username: req.body.username
        });

        User.register(newUser, req.body.password, function(err, user) {
          if (err) {
            console.log('signup error', err);
            
            return res.render('signup', {
              flash: {
                type: 'negative',
                header: 'Signup Error',
                body: err.message
              },
              header: 'Sign Up'
            });
          }

          // if success... 
          passport.authenticate('local')(req, res, function() {
            req.session.flash = {
              type: 'positive',
              header: 'Successfully Registered',
              body: 'You signed up as ' + user.username
            };
            res.redirect('/');
            
          });

        });
      });
      
      app.get('/login', function(req, res) {
        res.render('signup', {header: 'Log In'})
      });

      app.post('/login', passport.authenticate('local'), function(req, res) {
        
        req.session.flash = {
          type: 'positive',
          header: 'Signed in',
          body: 'Welcome, ' + req.body.username
        };
        
        res.redirect('/');
        
      });

      app.get('/logout', function(req, res) {
        req.logout();
        req.session.flash = {
          type: 'positive',
          header: 'Signed out',
          body: 'Successfully signed out'
        };
        res.redirect('/');
      });
     
      // twitter auth route
      app.get('/auth/twitter', passport.authenticate('twitter'));

      // twitter auth callback
      app.get('/auth/twitter/callback', 
        passport.authenticate('twitter', { failureRedirect: '/login' }),
        function(req, res) {
          // Successful authentication, redirect home.
          res.redirect('/');
        }
      );

    }
  };
};