var passport = require('passport');
var LocalStrategy = require('passport-local');
var User = require('../models/user');

module.exports = function(app, options) {
  
  return {
    init: function() {
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
      
    }
  };
};