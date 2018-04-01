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
        console.error(err);
        res.end();
      }

      const predictions = result.body.predictions[0].direction.shift().prediction;
      const firstPrediction = predictions[0].$.minutes;
      say(`The next train will be in ${firstPrediction} minutes`);
      res.end();
    });
  })
  .catch(() => {
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
