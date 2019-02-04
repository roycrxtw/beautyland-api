
const DatabaseService = require('./database-service');

const MongoClient = require('mongodb').MongoClient;
const connectionOptions = {
  keepAlive: 300000,
  connectTimeoutMS: 50000
}; 

// Use a local mongodb to test the database-service.js
const TEST_DB_URL = require('../config/main-config').testDbUrl;
let db = null;
let testCollection = null;
let dbService = null;

const preparedPosts = require('../test/sample-posts');
const sampleCount = preparedPosts.length;

describe('Testing for database-service', () => {
  //this.timeout(15000);
  jest.setTimeout(15000);

  beforeAll(async function() {
    dbService = DatabaseService.init(TEST_DB_URL);	// init for DatabaseService
    await dbService.connect();
    
    // Set up a connection directly to testing database
    db = await MongoClient.connect(TEST_DB_URL, connectionOptions);
    testCollection = db.collection('test-posts');
    testCollection.remove({});
  });

  beforeEach(function(done) {
    // Insert test documents into database
    testCollection.insertMany(preparedPosts, function(err, result) {
      expect(err).toBeNull();
      expect(result.result.n).toBe(sampleCount);
      done();
    });
  });

  afterEach(function(done) {
    // Clear up test documents.
    testCollection.remove({}, function(err, result) {
      expect(err).toBeNull();
      done();
    });
  });

  afterAll(function(done) {
    db.close(true);
    dbService.close();
    done();
  });

  describe('Check the status of testing database', () => {
    it('should contain testing url in dbService.info()', () => {
      expect(dbService.info().dburl).toBe(TEST_DB_URL);
    });

    it('should contain isConnect === true in dbService.info()', () => {
      expect(dbService.info().isConnected).toBeTruthy();
    });
  });


  describe('Check the test collection status', function() {
    test(`should contain ${sampleCount} testing documents`, async() => {
      //expect.assertions(1);
      const count = await testCollection.count();
      expect(count).toBe(sampleCount);
    });
  });


  describe('database-service.isConnected()', function() {
    test('should return true', async function() {
      let flag = await dbService.isConnected();
      expect(flag).toBe(true);
    });
  });


  describe('database-service.checkPostExists()', function() {
    test('should return true/false if the post does/does\'t exist.', async function() {
      let flag = await dbService.checkPostExists('test.id.thrall');
      expect(flag).toBe(true);

      flag = await dbService.checkPostExists('test.id.voljin');
      expect(flag).toBe(false);
    });
  });


  describe('database-service.savePost(): Save post into database', () =>{
    test('should return ok if everything is fine', async () => {
      const preparedPost = {
        author: 'roy',
        postId: 'test.id.roy',
        title: 'A greeting from Roy',
        postDate: '8/07',
        link: 'https://www.ptt.cc/bbs/Beauty/test.id.roy.html',
        viewCount: 21,
        createdAt: new Date(),
        imgUrls: ['http://i.imgur.com/G8mgxvB.jpg', 'http://i.imgur.com/aQOUYt3.jpg']
      };
      const result = await dbService.savePost(preparedPost, 'test');
      expect(result).toBe(true);
    });

    test('should return false if the post already exists', async () => {
      const preparedPost = {
        author: 'BAD Teemo',
        postId: 'test.id.teemo',
        title: 'whatever',
        postDate: '8/07',
        link: 'https://www.ptt.cc/bbs/Beauty/test.id.badteemo.html',
        viewCount: 21,
        createdAt: new Date(),
        imgUrls: ['http://i.imgur.com/G8mgxvB.jpg', 'http://i.imgur.com/aQOUYt3.jpg']
      };
      const result = await dbService.savePost(preparedPost);
      expect(result).toBeFalsy();
      const doc = await testCollection.findOne({postId: 'test.id.teemo'});
      expect(doc).toEqual(preparedPosts[1]);
    });
  });


  describe('database-service.readPost(postId): Read post from database', function() {
    test('should return expected post document.', async () => {
      const post = await dbService.readPost('test.id.teemo');
      expect(post.author).toBe(preparedPosts[1].author);
      expect(post.postId).toBe(preparedPosts[1].postId);
      expect(post.title).toBe(preparedPosts[1].title);
      expect(post.link).toBe(preparedPosts[1].link);
      expect(post.visibility).toBe(undefined);
      expect(post.images).toEqual(preparedPosts[1].images);
    });

    test('should return null if the post is invisible', async () => {
      const post = await dbService.readPost('test.id.noc');
      expect(post).toBeNull();
    });


    test('should return null if the post does not exist', async () => {
      const post = await dbService.readPost('test.id.ghost');
      expect(post).toBeNull();
    });

    test('should return the hidden post when it is admin', async () => {
      const post = await dbService.readPost('test.id.noc', {isAdmin: true});
      expect(post.author).toBe(preparedPosts[0].author);
      expect(post.postId).toBe(preparedPosts[0].postId);
      expect(post.title).toBe(preparedPosts[0].title);
      expect(post.link).toBe(preparedPosts[0].link);
      expect(post.visibility).toBe(false);
      expect(post.images).toEqual(preparedPosts[0].images);
    });
  });


  describe('db-service.readPosts(query, opts): Read posts from database', function() {
    test('should return null if there is no any result.', async () => {
      const posts = await dbService.readPosts({
        query: {author: 'nobody'}
      });
      expect(posts).toBeNull();
    });

    test('should return 2 post documents.', async () => {
      let timeFrom = new Date('2010-01-01T00:00:00.000Z');
      let timeTo = new Date('2017-02-01T00:00:00.000Z');
      let posts = await dbService.readPosts({
        query: {createdAt: {$gte: timeFrom, $lt: timeTo}}
      });
      expect(posts.length).toBe(2);
      expect(posts[0].author).toBe('Teemo');
      expect(posts[1].author).toBe('Sona');
    });

    // test('should return only visible post', async () => {
    //   const posts = await dbService.readPosts();
    //   expect(Array.isArray(posts)).toBe(true);
    //   expect(posts.length).toBe(preparedPosts.length - 1);  // Since there is only 1 invisible sample
    // });
  });

  describe('database-service.readRandomPosts(): Read random posts from database', function() {
    test('should return a random result', async () => {
      const posts = await dbService.readRandomPosts({size: 2, collectionName: 'test'});
      expect(posts.length).toBe(2);
    });
  });


  describe('database-service.deletePost(postId): Delete a post from database', () => {
    test('should return true if the post exists', async () => {
      const result = await dbService.deletePost('test.id.teemo');
      expect(result).toBe(true);
    });
    
    test('should return false if the post does not exist', async () => {
      // to delete teemo again
      const result = await dbService.deletePost('test.id.ghost');
      expect(result).toBeFalsy();
    });
  });

  describe('database-service.updatePostVisibility(postId, visibility): set visibility', () =>{
    test('should return false if the post does not exist', async () => {
      const result = await dbService.updatePostVisibility('test.id.ghost', true);
      expect(result).toBe(false);
    });

    test('should return true if the visibility successfully updated to false', async () => {
      const result = await dbService.updatePostVisibility('test.id.teemo', false);
      expect(result).toBeTruthy();
      const doc = await testCollection.findOne({postId: 'test.id.teemo'});
      expect(doc.author).toBe(preparedPosts[1].author);
      expect(doc.title).toBe(preparedPosts[1].title);
      expect(doc.link).toBe(preparedPosts[1].link);
      expect(doc.images).toEqual(preparedPosts[1].images);
      expect(doc.postId).toBe(preparedPosts[1].postId);
      expect(doc.visibility).toBe(false);
    });
    
    test('should return true if update is successfully', async () => {
      const result = await dbService.updatePostVisibility('test.id.teemo', true);
      expect(result).toBeTruthy();
      const doc = await testCollection.findOne({postId: 'test.id.teemo'});
      expect(doc.author).toBe(preparedPosts[1].author);
      expect(doc.title).toBe(preparedPosts[1].title);
      expect(doc.link).toBe(preparedPosts[1].link);
      expect(doc.images).toEqual(preparedPosts[1].images);
      expect(doc.postId).toBe(preparedPosts[1].postId);
      expect(doc.visibility).toBe(true);
    });
  });

  describe('db-service.updatePostViewCount(postId): Update post click count by 1', function() {
    test('should return true if postId exists', async () => {
      const result = await dbService.updatePostViewCount('test.id.teemo');
      expect(result).toBe(true);
    });

    test('should return false if the post does not exist', async () => {
      const result = await dbService.updatePostViewCount('test.id.ghost');
      expect(result).toBe(false);
    });

    test('should have an expected view count if process finished', async function() {
      await dbService.updatePostViewCount('test.id.teemo');

      const result = await testCollection.findOne({postId: 'test.id.teemo'});
      expect(result.viewCount).toBe(57);
    });
  });
});
