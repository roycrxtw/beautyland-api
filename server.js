
/**
 * Project Beautyland API
 * @author Roy Lu(royxnatw)
 */

const express = require('express');
const bodyParser = require('body-parser');

const log = require('services/log-service').init('accessLog');

async function createServer(port) {
  try {
    log.info('App started.');
    const app = express();
    app.use(express.static(__dirname + '/public'));

    // Setup CORS middleware
    const cors = require('cors');
    app.use(cors());

    app.use(bodyParser.json());
    app.use(require('./controllers/routers'));

    log.info('createServer() init finished.');

    return app.listen(port = 3004, function() {
      log.info(`Beautyland-API is listening on ${port}`);
    });
  } catch(ex) {
    log.error({args: arguments, ex: ex.stack}, 'Error in index.init()');
  }
}

module.exports = createServer;
