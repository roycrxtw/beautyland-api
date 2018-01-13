
/**
 * Project Beautyland API
 * Test for list-handler.js
 * @author Roy Lu(royvbtw) Jan 2018
 */

/* eslint no-unused-expressions: "off" */

const fs = require('fs');

const handler = require('./list-handler.js');

const testUrls = [
  {url: 'http://imgur.com/70KeHU5', id: '70KeHU5', result: 'https://i.imgur.com/70KeHU5.jpg'},
  {url: 'https://imgur.com/70KeHU5', id: '70KeHU5', result: 'https://i.imgur.com/70KeHU5.jpg'},
  {url: 'https://imgur.com/bDZQIQK.jpg', id: 'bDZQIQK', result: 'https://i.imgur.com/bDZQIQK.jpg'},
  {url: 'http://m.imgur.com/70KeHU5', id: '70KeHU5', result: 'https://i.imgur.com/70KeHU5.jpg'},
  {url: 'http://i.imgur.com/70KeHU5', id: '70KeHU5', result: 'https://i.imgur.com/70KeHU5.jpg'},
  {url: 'http://i.imgur.com/13wpSFj.jpg', id: '13wpSFj', result: 'https://i.imgur.com/13wpSFj.jpg'},
  {url: 'http://imgur.com/a/Qai8x', id: false, result: null},
  {url: 'http://imgur.com/gallery/VCDXO', id: false, result: null},
  {url: 'https://royvbtw.uk/cats.jpg', id: false, result: null},
  {url: '', id: false, result: null}
];

const summarys = [
  {
    author: 'Ptt', 
    title: 'Re: [問題] ptt為什麼這麼強調推文節約空間呀', 
    link: 'https://www.ptt.cc/bbs/SYSOP/M.1070112105.A.CB8.html', 
    postId: 'M.1070112105.A.CB8'
  },
  {
    author: 's4d2ltcg', 
    title: '[正妹] 新垣結衣', 
    link: 'https://www.ptt.cc/bbs/Beauty/M.1439128210.A.BA6.html', 
    postId: 'M.1439128210.A.BA6'
    
  }
];

describe('Test for list-handler', () => {
  describe('handler.formatImgurUrl(url)', () => {
    test('should return expected url result', () => {
      testUrls.forEach(item => {
        let result = handler.formatImgurUrl(item.url);
        expect(result).toBe(item.result);
      });
    });
  });
  
  describe('handler.generatePost()', () => {
    test('should return null if summary is invalid', async () => {
      expect.assertions(1);
      let summary = '';
      const post = await handler.generatePost(summary);
      expect(post).toBeNull();
    });

    test('should return null for a given post without any images', async () => {
      expect.assertions(1);
      const post = await handler.generatePost(summarys[0]);
      expect(post).toBeNull();
    });

    test('should return expected post for a given post summary', async () => {
      jest.setTimeout(50000);
      expect.assertions(6);
      const post = await handler.generatePost(summarys[1]);
      expect(post.author).toBe('s4d2ltcg');
      expect(post.link).toBe('https://www.ptt.cc/bbs/Beauty/M.1439128210.A.BA6.html');
      expect(post.postId).toBe('M.1439128210.A.BA6');
      expect(post.title).toBe('[正妹] 新垣結衣');
      expect(post.images.length).toBe(10);
      expect(post.viewCount).toBe(0);
    });
  });

  describe('list-handler.getImgurId()', () => {
    test('should return expected imgur id', () => {
      let imgurId = '';
      testUrls.forEach( item => {
        imgurId = handler.getImgurId(item.url);
        expect(imgurId).toBe(item.id);
      });
    });
  });

  describe('handler.getImgurUrlsFromText(text)', () => {
    test('should return an empty array when the text arg is empty', () => {
      let text = '';
      let result = handler.getImgurUrlsFromText(text);
      expect(result.length).toBe(0);
    });
  });

  describe('list-hanlder.getImgurUrls()', function(){
    test('should return expected amount of imgur urls', function(){
      const plainText = fs.readFileSync('./test/example-plainText.txt', 'utf8');
      const urls = handler.getImgurUrlsFromText(plainText);
      expect(urls.length).toBe(8);
      expect(urls[5]).toBe('http://i.imgur.com/vNaLYyZ.jpg08');
    });
  });


  describe('list-handler.getPostId(): Get postId from a ptt url', function(){
    test('should return an expected post id.', function(){
      const url = 'https://www.ptt.cc/bbs/StupidClown/M.1501823338.A.A21.html';
      const expectedPostId = 'M.1501823338.A.A21';
      const postId = handler.getPostId(url);
      expect(postId).toBe(expectedPostId);

      let url2 = '/bbs/Gossiping/M.1501922938.A.4F6.html';
      let expectedPostId2 = 'M.1501922938.A.4F6';
      let postId2 = handler.getPostId(url2);
      expect(postId2).toBe(expectedPostId2);
    });
  });


  describe('list-handler.getList(): Get list from html', function(){
    let sample = null;
    beforeAll(function(){
      sample = fs.readFileSync('./test/sample-list.html', 'utf8');
    });

    test('should return expected list length', function(){
      const list = handler.getList(sample);
      expect(list.length).toBe(9);
    }); 

    test('should have expected result loaded from sample-list.html', async function(){
      const list = handler.getList(sample);
      expect(list[3].author).toBe('bbac99119');
      expect(list[3].title).toBe('[神人] 光陽showgirl');
      expect(list[3].postId).toBe('M.1502034628.A.9D5');
      expect(list[3].link).toBe('https://www.ptt.cc/bbs/Beauty/M.1502034628.A.9D5.html');
    });
  });	
});
