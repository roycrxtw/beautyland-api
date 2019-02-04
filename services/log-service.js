
/**
 * Project Beautyland
 * Log service
 * @author Roy Lu
 */

const bunyan = require('bunyan');

const config = require('config/main-config');

module.exports.init = init;

function init(name) {
  const log = bunyan.createLogger({
    name,
    streams: getLogSettings(),
  });
  return log;
}

function getLogSettings() {
  if (config.env === 'production') {
    return [
      {level: config.log.level, path: config.log.dbPath}, 
      {level: 'error', path: config.log.errorPath},
    ];
  } else {
    return [
      {level: 'debug', stream: process.stdout},
      {level: 'debug', path: config.log.dbPath},
    ];
  }
}
