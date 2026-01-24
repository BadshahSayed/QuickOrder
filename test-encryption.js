const CryptoJS = require("crypto-js");

const key = "3862351407801163"; // 16 chars = 128 bits
const samples = [
    { plain: "10", expected: "muzVBtjaDrIVYv9WtZpJng==" }, // Amount
    { plain: "78", expected: "NoW5C7PeKlfFVNZBKFk3kQ==" }, // Submerchant
    { plain: "9", expected: "6tAUgQwCh8FuTwt0A18mnw==" }, // Paymode
    { plain: "123456", expected: "vsDgyq5NZdcUadSXIMAA4Q==" }, // Ref No
];

function encrypt(text) {
    const keyParsed = CryptoJS.enc.Utf8.parse(key);
    const encrypted = CryptoJS.AES.encrypt(text, keyParsed, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
}

console.log("Testing Encryption...");
samples.forEach(sample => {
    const result = encrypt(sample.plain);
    const match = result === sample.expected;
    console.log(`Plain: ${sample.plain}`);
    console.log(`Expected: ${sample.expected}`);
    console.log(`Actual:   ${result}`);
    console.log(`Match:    ${match ? "PASS" : "FAIL"}`);
    console.log("-------------------");
});
