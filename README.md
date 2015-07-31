AWS CloudFront URL Signature Utility (Signed Cookies)  
===================


Generating signed cookies for CloudFront links is a little more tricky than for S3. It's because signature generation for S3 URLs is handled a bit differently than CloudFront URLs and this functionality is not currently supported by the [aws-sdk](https://github.com/aws/aws-sdk-js) library for JavaScript. In case you also need to do this, I've created this simple utility to make things easier. Inspired by https://github.com/jasonsims/aws-cloudfront-sign

## Usage
### Requirements
* Node.js >=0.10.0 or io.js latest
* Active CloudFront distribution with origin configured

### Configuring CloudFront
1. Create a CloudFront distribution
2. Configure your origin with the following settings:

   **Origin Domain Name:** {your-s3-bucket}  
   **Restrict Bucket Access:** Yes  
   **Grant Read Permissions on Bucket:** Yes, Update Bucket Policy  
3. Create CloudFront Key Pair.


### Options
* `expireTime` (**Optional** - Default: 30s) - The time when the URL should
   expire. Accepted values are
   * number - Time in milliseconds (`new Date().getTime() + 30000`)
   * moment - Valid [momentjs][moment_docs] object (`moment().add(1, 'day')`)
   * Date - Javascript Date object (`new Date(2016, 0, 1)`)
* `keypairId` - The access key ID from your Cloudfront keypair
* `privateKeyString` || `privateKeyPath` - The private key from your Cloudfront
   keypair. It can be provided as either a string or a path to the .pem file.
  **Note:** When providing the private key as a string, ensure that the newline
  character is also included.

  ```js
  var privateKeyString =
    '-----BEGIN RSA PRIVATE KEY-----\n'
    'MIIJKAIBAAKCAgEAwGPMqEvxPYQIffDimM9t3A7Z4aBFAUvLiITzmHRc4UPwryJp\n'
    'EVi3C0sQQKBHlq2IOwrmqNiAk31/uh4FnrRR1mtQm4x4IID58cFAhKkKI/09+j1h\n'
    'tuf/gLRcOgAXH9o3J5zWjs/y8eWTKtdWv6hWRxuuVwugciNckxwZVV0KewO02wJz\n'
    'jBfDw9B5ghxKP95t7/B2AgRUMj+r47zErFwo3OKW0egDUpV+eoNSBylXPXXYKvsL\n'
    'AlznRi9xNafFGy9tmh70pwlGG5mVHswD/96eUSuLOZ2srcNvd1UVmjtHL7P9/z4B\n'
    'KdODlpb5Vx+54+Fa19vpgXEtHgfAgGW9DjlZMtl4wYTqyGAoa+SLuehjAQsxT8M1\n'
    'BXqfMJwE7D9XHjxkqCvd93UGgP+Yxe6H+HczJeA05dFLzC87qdM45R5c74k=\n'
    '-----END RSA PRIVATE KEY-----'
  ```
  Also, here are some examples if prefer to store your private key as a string
  but within an environment variable.
  ```sh
  # Local env example
  CF_PRIVATE_KEY="$(cat your-private-key.pem)"

  # Heroku env
  heroku config:set CF_PRIVATE_KEY="$(cat your-private-key.pem)"  
  ```

## Examples
### Creating a signed URL
```js
var cf = require('aws-cloudfront-sign-cookies')
var options = {keypairId: 'APKAJM2FEVTI7BNPCY4A', privateKeyPath: '/foo/bar'}
var signedCookiesObject = cf.getSignedUrl('http://xxxxxxx.cloudfront.net/*', options);
console.log('Signed URL: ' + signedCookiesObject);
```



[moment_docs]: http://momentjs.com/docs
