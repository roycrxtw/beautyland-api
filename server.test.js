
/**
 * Project Beautyland API
 * Test for list-handler.js
 * @author Roy Lu(royvbtw) Jan 2018
 */

const server = require('./server.js');
const request = require('superagent');

describe('Test for index.js', () => {
  let app;
  beforeAll( async () => {
    try{
      app = server(3004);
      console.log(`beforeAll() finished.`);
    }catch(ex){
      console.log(`beforeAll() ex=`, ex);
    }
  });

  afterAll( () => {
    app.close();
  });

  describe('GET /not/found', () => {
    test('return 404 if the path has not found anything.', (done) => {
      expect.assertions(1);
      request.get('http://localhost:3004/foo/bar').end((error, res) => {
        expect(res.status).toBe(404);
        done();
      });
    });
  });

  describe('GET /readme', () => {
    test('should return status 200', (done) => {
      expect.assertions(1);
      request.get('http://localhost:3004/readme').end((error, res) => {
        expect(res.status).toBe(200);
        done();
      });
    });
  });

  describe('GET /about', () => {
    test('should return status 200 and a message within JSON', (done) => {
      expect.assertions(2);
      request.get('http://localhost:3004/about').end((error, res) => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
        done();
      });
    });
  });
});
