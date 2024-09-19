const config = { 
    fps: 2, qrbox: {width: 250, height: 250}
    // rememberLastUsedCamera: false,
}

const idElement = "reader-flexii_guia";
const btnActivador = $("#activador_scanner-flexii_guia");

btnActivador.on("click", activationScanner);

function onScanSuccess(decodedText, decodedResult) {
    console.log(`Code matched = ${decodedText}`, decodedResult);
    stopScanning();
}

const html5QrCode = new Html5Qrcode(idElement);
console.log(html5QrCode);
function stopScanning() {
    html5QrCode.stop().then(() => {
        btnActivador.text("Reanudar escáner");
    });
}

function startScanning() {
    html5QrCode.start({facingMode: "environment"}, config, onScanSuccess)
    .then(() => {
        btnActivador.text("Detener escáner");
    });
}

function activationScanner() {
    if(html5QrCode.isScanning) {
        stopScanning();
    } else {
        startScanning();
    }
}
