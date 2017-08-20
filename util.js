
/**
 * Project Beautyland API
 * @author Roy lu
 */


'use strict';

var request = require('request');
var debug = require('debug')('util');
var cheerio = require('cheerio');
var requestImageSize = require('request-image-size');

module.exports.loadHtml = loadHtml;
module.exports.htmlToText = htmlToText;
module.exports.getImageSize = getImageSize;


/**
 * Get target html content for specified url
 * @param {string} url The target url which will be processed.
 * @return {Promise} Resolve if status code is 200 and the length of html content > 0.
 */
function loadHtml(url){
	return new Promise( (resolve, reject) => {
		request(url, function(err, response, body){
			if(err){
				return reject({error: err, url: url});
			}
			let statusCode = response.statusCode;
			if(response && statusCode === 200 && body.length > 0){
				return resolve({statusCode: statusCode, body: body});
			}else if(response && statusCode === 200 && body.length === 0){
				return reject({
					message: 'Content length is 0 after loadHtml(). Please check.', 
					statusCode: statusCode,
					url: url
				});
			}else{
				return reject({
					message: 'Wrong status code', 
					statusCode: statusCode,
					url: url
				});
			}
		});
	});
}

/**
 * A utility which is used to parse html content to plain text.
 * @param {string} Plain text of html content.
 */
function htmlToText(html){
	if(html.length === 0){
		return false;
	}
	let $ = cheerio.load(html);
	return $('body').text();
}


async function getImageSize(url){
	try{
		let r = await requestImageSize(url);
		return r;
	}catch(ex){
		console.log(ex);	//#todo
	}
}