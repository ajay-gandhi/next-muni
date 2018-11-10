const rp = require("request-promise");
const parseString = require("xml2js").parseString;
const fs = require("fs");
const spawn = require("child_process").spawn;
const Logger = require("../util/logger");

const IP = "192.168.128.4";
const LOG = new Logger("next-muni");

const base = "http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=sf-muni&stopId=";

module.exports = (stopId) => {
  return rp(`${base}${stopId}`)
    .then((response) => {
      parseString(response, (err, result) => {
        if (err) {
          LOG.log(err);
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
        const ctWithAdj = closestTrains.map(s => Math.floor((parseInt(s) - 15) / 60));
        const answer = `It is ${now()}. The next train will be in ${ctWithAdj[0]} minutes, then ${ctWithAdj[1]} minutes`;
        say(answer);
        LOG.log(answer);
      });
    })
    .catch((err) => {
      LOG.log(err);
    });
};

const say = (str) => {
  try {
    const safeStr = str.replace(/[^A-Za-z0-9 ]/g, '');
    const nodePath = "/home/ajay/.nvm/versions/node/v10.6.0/bin/node";
    const castnowPath = "/home/ajay/.nvm/versions/node/v10.6.0/bin/castnow";
    const cmd = spawn("sh", ["-c", `espeak --stdout "${safeStr}" | ${nodePath} ${castnowPath} --address ${IP} -`]);
    cmd.stderr.on("data", s => LOG.log(s.toString()));
  } catch (err) {
    LOG.log(err.toString());
  }
}

const now = () => {
  const ts = new Date();
  const minPrefix = ts.getMinutes() < 10 ? "o" : " ";
  const hours = ts.getHours() > 12 ? ts.getHours() - 12 : ts.getHours();
  return `${hours}${minPrefix}${ts.getMinutes()}`;
}