const express = require("express");
const bodyParser = require("body-parser");
const rp = require("request-promise");
const parseString = require("xml2js").parseString;
const fs = require("fs");
const spawn = require("child_process").spawn;
const Logger = require("../util/logger");

const IP = "192.168.128.4";
const LOG = new Logger("next-muni");
const PORT = process.argv[2] || 9001;

// Set up express
const app = express();
app.use(bodyParser.json());

const base = "http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=sf-muni&stopId=";

app.get("/", function (req, res) {
  rp(base + req.query.stopId)
    .then((response) => {
      parseString(response, (err, result) => {
        if (err) {
          LOG.log(err);
          res.end();
        }

        // Get the 2 closest trains
        const directions = result.body.predictions[0].direction;
        const closestTrains = directions.reduce((memo, d) => {
          const f = d.prediction[0].$.seconds;
          const s = d.prediction[1].$.seconds;

          if (f < memo[0])      return [f, s < memo[1] ? s : memo[1]];
          else if (f < memo[1]) return [memo[0], f];
          else                  return memo;
        }, [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]);
        const ctWithAdj = closestTrains.map(s => Math.floor((parseInt(s) - 20) / 60));
        const answer = `The next train will be in ${ctWithAdj[0]} minutes, then ${ctWithAdj[1]} minutes`;
        say(answer);
        LOG.log(answer);
        res.end();
      });
    })
    .catch((err) => {
      LOG.log(err);
      res.send("error");
  });
});

app.listen(PORT, () => LOG.log(`Serving on port ${PORT}`));

function say (str) {
  const tts = spawn("espeak", ["--stdout", str]);
  const audioFile = fs.createWriteStream("/home/ajay/projects/next-muni/audio.wav");

  tts.stdout.pipe(audioFile);
  tts.on("close", (code) => {
    spawn("castnow", ["--address", IP, "/home/ajay/projects/next-muni/audio.wav"]);
  });
}
