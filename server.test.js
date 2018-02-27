
/**
 * Project Beautyland API
 * Test for list-handler.js
 * @author Roy Lu(royxnatw) Jan 2018
 */

const request = require('superagent');
const MongoClient = require('mongodb').MongoClient;
const connectionOptions = {
  keepAlive: 300000,
  connectTimeoutMS: 50000
}; 

const server = require('./server.js');
const preparedPosts = require('./test/sample-posts');
const sampleCount = preparedPosts.length;
const config = require('./config/main.config');
const TEST_DB_URL = config.testDbUrl;
const SECRET_KEY = config.secretKey;

let db = null;
let testCollection = null;


describe('Test for index.js', () => {
  let app;
  beforeAll( async () => {
    app = server(3004);
      
    // Set up a connection directly to testing database
    db = await MongoClient.connect(TEST_DB_URL, connectionOptions);
    testCollection = db.collection('test-posts');
    testCollection.remove({});

    // await testCollection.insertMany(preparedPosts);
    // //   expect(err).toBeNull();
    // //   expect(result.result.n).toBe(3);
    // //   done();
    // // });
  });

  beforeEach((done) => {
    // Insert test documents into database
    testCollection.insertMany(preparedPosts, (err, result) => {
      expect(err).toBeNull();
      expect(result.result.n).toBe(sampleCount);
      done();
    });
  });

  afterEach((done) => {   // Clear up test documents.
    testCollection.remove({}, function(err, result){
      done();
    });
  });

  afterAll( (done) => {
    db.close(true);
    app.close();
    done();
  });

  describe('GET /not/found', () => {
    test('return 404 if the path has not found anything.', (done) => {
      //expect.assertions(1);
      request.get('http://localhost:3004/foo/bar').end((error, res) => {
        expect(res.status).toBe(404);
        done();
      });
    });
  });

  describe('/posts/:id GET > Get the post data', () => {
    test('should return 200 if the post does exist', (done) => {
      request.get('http://localhost:3004/posts/test.id.teemo').end((error, res) => {
        expect(res.status).toBe(200);
        expect(res.body.postId).toBe('test.id.teemo');
        expect(res.body.author).toBe('Teemo');
        expect(res.body.viewCount).toBe(56 + 1);
        expect(res.body.visibility).toBe(undefined);
        done();
      });
    });

    test('should return 200 and all fields of the post if authorised', (done) => {
      request.get('http://localhost:3004/posts/test.id.teemo')
      .set('secret-key', SECRET_KEY)
      .end((error, res) => {
        expect(res.status).toBe(200);
        expect(res.body.postId).toBe('test.id.teemo');
        expect(res.body.author).toBe('Teemo');
        expect(res.body.viewCount).toBe(56 + 1);
        expect(res.body.visibility).toBe(true);
        done();
      });
    });

    test('should return 404 if the post does not exist', (done) => {
      request.get('http://localhost:3004/posts/test.id.ghost').end((error, res) => {
        expect(res.status).toBe(404);
        done();
      });
    });
  });

  describe('GET /', () => {
    test('should return 200 with expected array of posts', (done) => {
      //expect.assertions(1);
      request.get('http://localhost:3004/').end((error, res) => {
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBe(sampleCount - 1);    // since post[0] is invisible
        done();
      });
    });
  });

  describe('/trends GET > Get the trends page', () => {
    test('should return status 200 and an array of posts', (done) => {
      request.get('http://localhost:3004/trends').end((error, res) => {
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBe(3);
        expect(res.body[0].author).toBe('hype2');
        expect(res.body[1].author).toBe('hype0');
        expect(res.body[2].author).toBe('hype1');
        done();
      });
    });
  });

  describe('GET /readme', () => {
    test('should return status 200', (done) => {
      //expect.assertions(1);
      request.get('http://localhost:3004/readme').end((error, res) => {
        expect(res.status).toBe(200);
        done();
      });
    });
  });

  describe('GET /about', () => {
    test('should return status 200 and a message within JSON', (done) => {
      //expect.assertions(2);
      request.get('http://localhost:3004/about').end((error, res) => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
        done();
      });
    });
  });

  describe('GET /samples', () => {
    test('should return status 200 and an array of posts', (done) => {
      request.get('http://localhost:3004/samples').end((error, res) => {
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBe(sampleCount - 1);
        done();
      });
    });
  });


  describe('DELETE /posts/:id/visibility >> Turn off the visibility for the given postId', () => {
    test('should return 401 if the authorisation is invalid', (done) => {
      request.delete('http://localhost:3004/posts/whatever/visibility')
      .set('secret-key', 'testkey')
      .end( (err, res) => {
        expect(res.status).toBe(401);
        done();
      });
    });

    test('should return 404 if the post does not exist', (done) => {
      request.delete('http://localhost:3004/posts/whatever/visibility')
      .set('secret-key', SECRET_KEY)
      .end( (err, res) => {
        expect(res.status).toBe(404);
        done();
      });
    });

    test('should return 200 if the post exist and the operation success', (done) => {
      request.delete('http://localhost:3004/posts/test.id.teemo/visibility')
      .set('secret-key', SECRET_KEY)
      .end( (err, res) => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
        done();
      });
    });
  });

  describe('/posts/:id DELETE > Delete the specified post', () => {
    test('should return 401 if it provides an invalid secret key', (done) => {
      //expect.assertions(2);
      request.delete('http://localhost:3004/posts/whatever').end((error, res) => {
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message');
        done();
      });
    });

    test('should return 404 if trying to delete a non-existing post', (done) => {
      request.delete('http://localhost:3004/posts/foobar')
      .set('secret-key', SECRET_KEY)
      .end((error, res) => {
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message');
        done();
      });
    });

    test('should return 200 if delete a post successfully', (done) => {
      request.delete('http://localhost:3004/posts/test.id.teemo')
      .set('secret-key', SECRET_KEY)
      .end((error, res) => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
        done();
      });
    });
  });
});
