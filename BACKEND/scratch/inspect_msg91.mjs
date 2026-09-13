const res = await fetch("https://verify.msg91.com/otp-provider.js");
const text = await res.text();
// search for JWT or token payload references
const matches = text.match(/token[^;]{0,50}/gi);
console.log('Token references sample:', matches?.slice(0, 10));
