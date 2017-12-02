'use strict';

const express       = require('express'),
      bodyParser    = require('body-parser'),
      rp            = require('request-promise'),
      DialogflowApp = require('actions-on-google').DialogflowApp,
      parseString   = require('xml2js').parseString;

// Set up express
const app = express();
app.use(bodyParser.json());
app.set('port', (process.env.PORT || 8000));

const WELCOME_ARGUMENT = 'input.direction';
const base = 'http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=sf-muni&stopId=';

app.post('/kt', function (req, res) {
  const app = new DialogflowApp({ request: req, response: res });
  app.handleRequest(welcomeIntent);

  /*
  rp(base + req.body.result.parameters.direction)
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

function welcomeIntent(app) {
  console.log('got argument', app.getArgument(WELCOME_ARGUMENT));
  rp(base + app.getArgument(WELCOME_ARGUMENT))
    .then((response) => {
      parseString(response, (err, result) => {
        if (err) {
          console.error(err);
          app.tell('Error getting information');
        }

        const predictions = result.body.predictions[0].direction.pop().prediction;
        const firstPrediction = predictions[0].$.minutes;
        app.tell('The next train will be in ' + firstPrediction + ' minutes.');
      });
    })
    .catch(() => {
      app.tell('Error getting information');
    });
}

app.listen(app.get('port'), function () {
  console.log('Serving on port', app.get('port'));
});
