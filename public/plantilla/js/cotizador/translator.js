const translation = {
    typePayment: [null, PAGO_CONTRAENTREGA, CONTRAENTREGA, CONVENCIONAL]
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
            comision_adicional: 0, // TODO: Esta información no la tenemos, pero para la V1 del cotizador sabemos que da cero (LO DEVOVERÁ EL API)
            comision_trasportadora: this.sobreflete + this.seguroMercancia,
            peso_liquidar: this.kgTomado,
            peso_con_volumen: this.pesoVolumen,
            total: this.costoEnvio,
            recaudo: this.valor,
            seguro: this.seguro,
            costoDevolucion: this.costoDevolucion, // TODO: Validar como tomaremos en cuenta los atributos de las devoluciones (LO DEVOVERÁ EL API)
            cobraDevolucion: false, // TODO: Validar como tomaremos en cuenta los atributos de las devoluciones (LO DEVOVERÁ EL API)
            versionCotizacion: 1 // TODO: Validar como tomar en cuenta la versión (técnicamente podemos tomarlo a partir de los datos de usuario, pero todo dependerá como conectaremos el cotizador) (LO DEVOVERÁ EL API)
        };
    
        if (ControlUsuario.esPuntoEnvio)
            details.comision_punto = this.comision_punto; // TODO: posiblemente tenga que venir com orespuesta del api (LO DEVOVERÁ EL API)
    
        if (this.sobreflete_oficina)
            details.sobreflete_oficina = this.sobreflete_oficina; // TODO: Falta validar cuando comience a migrar los temas de oficina
    
        return details;
    }
}


export {translation, TranslatorFromApi}