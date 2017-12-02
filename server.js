'use strict';

const express     = require('express'),
      bodyParser  = require('body-parser'),
      rp          = require('request-promise'),
      parseString = require('xml2js').parseString;

// Set up express
const app = express();
app.use(bodyParser.json());
app.set('port', (process.env.PORT || 8000));

const base = 'http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=sf-muni&stopId=';
app.post('/kt', function (req, res) {
  console.log(req);
  console.log('\n\n------\n\n');
  console.log(req.body);
  /*
  rp(base + req.query.stopId)
  .then((response) => {
    parseString(response, (err, result) => {
      if (err) {
        console.error(err);
        res.end();
      }

      const predictions = result.body.predictions[0].direction.pop().prediction;
      const firstPrediction = predictions[0].$.minutes;
      res.end(firstPrediction);
    });
  })
  .catch(() => {
    res.send("error");
  });
  */
});

app.listen(app.get('port'), function () {
  console.log('Serving on port', app.get('port'));
});
