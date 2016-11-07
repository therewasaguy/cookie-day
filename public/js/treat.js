var treats = ["m&m's", "tootsie roll", "snickers", "skittles"];

window.onload = function() {

    $('#treat').on('click', function(e) {

      // pick a random treat
      var treat = treats[Math.floor( Math.random() * treats.length)];

      $.ajax({
        url: '/treat',
        method: 'post',
        data: {
          treat: treat
        }
      })
        .done(function(data) {
          console.log(data);
          var treatList = data.treats.join(', ');
          $('.treats').html(treatList);
      })
        .fail(function(err) {
          console.log('err', err)
      });
        

    });

};

