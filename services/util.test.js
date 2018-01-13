
/* eslint no-unused-expressions: "off" */

const fs = require('fs');

const util = require('./util.js');

describe('Testing for util.js', () => {
  //this.timeout(5000);

  describe('util.fetchHtml(url)', () => {
    test('reject false when url is invalid', async () => {
      expect.assertions(2);
      let url = '';
      //const result = await util.fetchHtml(url);
      await expect(util.fetchHtml(url)).rejects.toHaveProperty('error');

      url = 'http://foobar.foobar';
      await expect(util.fetchHtml(url)).rejects.toHaveProperty('error');
    });
  });

  describe('util.fetchHtml(): Get HTML contents by url', () => {
    test('statusCode should be 200', async () => {
      let url = 'https://www.google.com.tw';
      let result = await util.fetchHtml(url);
      expect(result.statusCode).toBe(200);

      url = 'https://www.ptt.cc/bbs/Beauty/index.html';
      result = await util.fetchHtml(url);
      expect(result.statusCode).toBe(200);
    });
  });


  describe('util.htmlToText(): Get plain text from specified html content', () => {
    test('should return false if html is empty', () => {
      const result = util.htmlToText('');
      expect(result).toBeFalsy();
    });

    test('should return false if the html is null', () => {
      const html = null;
      const result = util.htmlToText(html);
      expect(result).toBeFalsy();
    });

    test('should return expected text length', () => {
      const sampleFileLength = 726;
      const htmlBody = fs.readFileSync('./test/example-post.html', 'utf8');
      const text = util.htmlToText(htmlBody);
      expect(text.length).toBe(sampleFileLength);
    });
	});


  describe('util.getImageSize(url): Get image size for a given url', () => {
    test('should return expected width and height', async () => {
      const imageUrl = 'http://i.imgur.com/78f9eAs.jpg';
      const expectedWidth = 1280, expectedHeight = 720;
      const result = await util.getImageSize(imageUrl);
      expect(result.width).toBe(expectedWidth);
      expect(result.height).toBe(expectedHeight);
    });
  });
});

