const translation = {
    typePayment: [null, PAGO_CONTRAENTREGA, CONTRAENTREGA, CONVENCIONAL],
    typePaymentInt: {
        [PAGO_CONTRAENTREGA]: 1,
        [CONTRAENTREGA]: 2,
        [CONVENCIONAL]: 3,
    }
}

class TranslatorFromApi {
    constructor(dataSentApi, dataFromApi) {
        this.dataSentApi = dataSentApi;
        this.dataFromApi = dataFromApi;
        
        this.type = translation.typePayment[dataSentApi.typePayment];
        this.alto = dataSentApi.height;
        this.ancho = dataSentApi.width;
        this.largo = dataSentApi.long;
        this.dane_ciudadR = dataSentApi.daneCityOrigin;
        this.dane_ciudadD = dataSentApi.daneCityDestination;
        

        this.valor = dataFromApi.valueDeposited;
        this.costoEnvio = dataFromApi.total;
        this.seguro = dataFromApi.declaredValue;
        this.flete = this.dataFromApi.flete
        this.sobreflete = dataFromApi.transportCommission;
        this.seguroMercancia = dataFromApi.assured;
        this.transportadora = dataFromApi.entity.toUpperCase();
        this.version = parseInt(dataFromApi.version);
    }

    get factorDeConversion() {
        switch(this.transportadora) {
            case transportadoras.INTERRAPIDISIMO.cod:
                return 1 / 6000;
            case transportadoras.SERVIENTREGA.cod:
                return 222 / 1e6;
            default:
                return 222 / 1e6;
                
        }
    }

    get kgTomado() {
        return Math.max(this.dataSentApi, this.pesoVolumen);
    }

    get volumen() {
        return [this.alto, this.ancho, this.largo].reduce((a,b) => a * b);
    }

    //Devuelve el paso generado del volumen, debido al factor dec conversión
    get pesoVolumen() {
        let peso_con_volumen = this.volumen * this.factorDeConversion;
        peso_con_volumen = Math.ceil(Math.floor(peso_con_volumen * 10) / 10);

        return peso_con_volumen;
    }

    get costoDevolucion() {
        switch (this.transportadora) {
          case transportadoras.SERVIENTREGA.cod:
            return this.costoEnvio;
          case transportadoras.INTERRAPIDISIMO.cod:
            return this.flete + this.seguroMercancia + this.sobreflete + 1000;
          case transportadoras.ENVIA.cod:
            return (this.flete + this.seguroMercancia + 1000) * 2;
          case transportadoras.COORDINADORA.cod:
            return (this.flete + this.seguroMercancia + 1000) * 2;
        }
    }

    get getDetails() {
        const details = {
            peso_real: this.dataSentApi.weight,
            flete: this.flete,
            comision_heka: this.dataFromApi.hekaCommission,
            comision_adicional: this.dataFromApi.additional_commission,
            comision_trasportadora: this.sobreflete + this.seguroMercancia,
            peso_liquidar: this.kgTomado,
            peso_con_volumen: this.pesoVolumen,
            total: this.costoEnvio,
            recaudo: this.valor,
            seguro: this.seguro,
            costoDevolucion: this.version === 1 ? this.dataFromApi.costReturnHeka : this.dataFromApi.costReturn,
            cobraDevolucion: this.version === 1,
            versionCotizacion: this.version
        };
    
        if (ControlUsuario.esPuntoEnvio)
            details.comision_punto = this.dataFromApi.commissionPoint;
    
        if (this.sobreflete_oficina)
            details.sobreflete_oficina = this.sobreflete_oficina; // TODO: Falta validar cuando comience a migrar los temas de oficina
    
        return details;
    }
}


export {translation, TranslatorFromApi}