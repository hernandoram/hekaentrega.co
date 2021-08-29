exports.segmentarString = (base64, limite = 1000) => {
    if (!base64) return new Array(0);
    let initial = 0;
    let final = limite;
    let parts = Math.floor(base64.length / limite);
  
    let res = new Array();
  
    for(let i = 0; i < parts; i ++) {
      res.push(base64.substring(initial, final));
      initial += limite;
      final += limite;
    };
  
    res.push(base64.substring(initial));
  
    return res
}