/**
 * Cloudfront URL signature utility.
 */

var url = require('url');
var crypto = require('crypto');
var fs = require('fs');
var util = require('util');
var _ = require('lodash');
var CannedPolicy = require('./CannedPolicy');

/**
 * Build an AWS signed URL.
 *
 * @param {String} CloudFront resource URL
 * @param {Object} Signature parameters
 * @return {String} Signed CloudFront URL
 */
function getSignedCookies(cfUrl, params) {
  // If an expiration time isn't set, default to 30 seconds.
  var defaultExpireTime = Math.round(new Date().getTime() + 30000);
  var expireTime = _getExpireTime(params) || defaultExpireTime;
  var policy = new CannedPolicy(cfUrl, expireTime);
  var sign = crypto.createSign('RSA-SHA1');
  var privateKeyString = params.privateKeyString;
  var parsedUrl;
  var pem;
  var signature;
  var base64policy;
  
  base64policy=new Buffer(policy.toJSON()).toString('base64');

  sign.update(policy.toJSON());

  // Stringify private key if supplied as a file path.
  if (params.privateKeyPath) {
    pem = fs.readFileSync(params.privateKeyPath);
    privateKeyString = pem.toString('ascii');
  }

  signature = sign.sign(privateKeyString, 'base64');

  // Parse the cloudfront URL so we can add the querystring values required by
  // AWS signed URLs. We need to assign an empty string to the `search`
  // property so that the object value of `.query` is used when `.format()`
  // is called.
  parsedUrl = url.parse(cfUrl, true);
  parsedUrl.search = '';
  _.extend(parsedUrl.query, {
    'Expires': policy.expireTime,
    'Signature': normalizeSignature(signature),
    'Key-Pair-Id': params.keypairId
  });

  // Return a formatted URL string with signature.
  //return parsedUrl.format();
  
  return { 'CloudFront-Policy':base64policy, 'CloudFront-Signature': normalizeSignature(signature),'CloudFront-Key-Pair-Id': params.keypairId }
}

/**
 * Build an AWS signed RTMP URL assuming your distribution supports this.
 *
 * @param {String} Cloudfront domain
 * @param {String} S3 key
 * @param {Object} Signature parameters
 * @return {Object} Cloudfront server path and stream name with RTMP formatting
 */

/**
 * Normalize all invalid AWS signature characters.
 *
 * For more information on AWS signatures, see
 * http://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-creating-signed-url-canned-policy.html
 *
 * @param {String}: Base64 encoded signature string
 */
function normalizeSignature(sig) {
  var badCharMap = {'+': '-', '=': '_', '/': '~'};
  Object.keys(badCharMap).forEach(function (badChar) {
    var re = new RegExp('\\' + badChar, 'g');
    sig = sig.replace(re, badCharMap[badChar]);
  });
  return sig;
}

/**
 * Return the expire time in milliseconds.
 *
 * This function will return the `expireTime` value in milliseconds. If the
 * value is not a number or a string it will use duck typing to determine if a
 * moment or Date object have been passed instead and call their appropriate
 * function.
 *
 * @see http://momentjs.com/docs
 *
 * @param {Object} opts - Options object containing the expireTime
 * @return {Number} expireTime - Expire time represented in milliseconds
 */
function _getExpireTime(opts) {
  if (!opts.expireTime) {return null;}
  var val = opts.expireTime;

  if (typeof val === 'number') {return Math.round(val);}
  if (typeof val === 'string') {return parseInt(val);}

  // If the value has a `.unix()` function then assume an instance of momentjs
  // was given and execute that method.
  if (typeof val.unix === 'function') {return val.unix() * 1000;}

  // If a Date object was given then convert it to milliseconds.
  if (val instanceof Date) {return Math.round(val.getTime());}

  // However, if the value provided did not match any of the supported types
  // then throw an error since we were unable to figure out a date to use.
  throw new Error('Invalid `expireTime` value');
}


exports.getSignedUrl = getSignedCookies;

exports.normalizeSignature = normalizeSignature;
exports._getExpireTime = _getExpireTime;
