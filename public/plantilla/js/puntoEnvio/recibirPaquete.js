const html5QrCodeScaner = new Html5QrcodeScanner(
    "reader_flexii-guia", 
    { fps: 10, qrbox: {width: 250, height: 250} },
    false 
);

console.log("MODULE IMPORTED");
console.log(html5QrCodeScaner);
function onScanSuccess(decodedText, decodedResult) {
    // handle the scanned code as you like, for example:
    console.log(`Code matched = ${decodedText}`, decodedResult);
}

function onScanFailure(error) {
    // handle scan failure, usually better to ignore and keep scanning.
    // for example:
    // console.warn(`Code scan error = ${error}`);
}

// html5QrCodeScaner.render(onScanSuccess, onScanFailure);