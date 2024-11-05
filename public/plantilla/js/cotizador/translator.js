import { v0 } from "../config/api.js";

const translation = {
    typePayment: [null, PAGO_CONTRAENTREGA, CONTRAENTREGA, CONVENCIONAL],
    typePaymentInt: {
        [PAGO_CONTRAENTREGA]: 1,
        [CONTRAENTREGA]: 2,
        [CONVENCIONAL]: 3,
    }
}

class TranslatorFromApi {
    FACHADA_FLETE = 1000;

    constructor(dataSentApi, dataFromApi) {
        this.dataSentApi = dataSentApi;
        this.dataFromApi = dataFromApi;
        
        this.type = translation.typePayment[dataSentApi.typePayment];
        this.alto = dataSentApi.height;
        this.ancho = dataSentApi.width;
        this.largo = dataSentApi.long;
        this.dane_ciudadR = dataSentApi.daneCityOrigin;
        this.dane_ciudadD = dataSentApi.daneCityDestination;
        

        this.valor = dataFromApi.transportCollection;
        this.costoEnvio = dataFromApi.total;
        this.seguro = dataFromApi.declaredValue;
        this.sobreflete = dataFromApi.transportCommission;
        this.seguroMercancia = dataFromApi.assured;
        this.codTransp = dataFromApi.entity.toUpperCase();
        this.transportadora = dataFromApi.entity.toUpperCase();
        this.version = parseInt(dataFromApi.version);
        this.costoDevolucion = dataFromApi.cost_return_heka;
        this.costoDevolucionOriginal = dataFromApi.cost_return;
        this.comisionAdicionalHeka = this.dataFromApi.additional_commission
    }

    /** Es el flete que cobra la transportadora, normalmente el api lo devuelve con 1000 pesos adicionales
     * que están puestos sobre la variable {@link FACHADA_FLETE}, por lo tanto se le resta para sumarlo a 
     * la {@link comision_heka | comisión heka}
     * ya que esto es lo que realmente se guardará en base de datos
     */
    get flete() {
      const fleteApi = this.type === PAGO_CONTRAENTREGA ? this.dataFromApi.flete - this.FACHADA_FLETE : this.dataFromApi.flete;

      // Se le resta la comisión adicional, para que se guarde el flete natural, sin alteraciones, por fuera ase debe mostrar el flete que venga del api sin alteracioines
      return fleteApi - this.comisionAdicionalHeka;
    }

    /** Es la comisión que le corresponde a Heka por el diligenciamiento y gestión de dicho envío
     * Desde el api viene con 1000 pesos menos (que se están adicionando al {@link flete | flete de la transportadora})
     * por lo que internamente se le suma los mismos {@link FACHADA_FLETE | 1000} pesos para que se guarde en la base de datos
    */
    get comision_heka() {
      return this.type === PAGO_CONTRAENTREGA ? this.dataFromApi.hekaCommission + this.FACHADA_FLETE : this.dataFromApi.hekaCommission;
    }

    /** Variable que se caracteriza por identificar si la guía posee una deuda
     * Al ser falso es porque no existe deuda de ningún tipo
     * Al ser positivo es porque la guía posee un saldo a favor que puede ser de beneficio para el usuario (Esto nunca se ha aplicado)
     * Al ser negativo es porque el pago de la guía aún no ha sido repartido
     */
    get debe() {
        switch(this.type) {
            case CONVENCIONAL:
                return 0;
            case PAGO_CONTRAENTREGA: case CONTRAENTREGA:
                return -this.costoEnvio;
            default:
                return 0;
        }
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
      const pesoEnviado = this.dataSentApi.weight;
      const pesoMinimo = transportadoras[this.transportadora].limitesPeso[0]; // tomamos el mínimo de peso configurado para la transportadora
      return Math.max(pesoEnviado, pesoMinimo, this.pesoVolumen);
    }

    get volumen() {
        return [this.alto, this.ancho, this.largo].reduce((a,b) => a * b);
    }

    //Devuelve el paso generado del volumen, debido al factor dec conversión
    get pesoVolumen() {
        if(![transportadoras.INTERRAPIDISIMO.cod, transportadoras.SERVIENTREGA.cod].includes(this.transportadora)) return this.dataSentApi.weight;
        let peso_con_volumen = this.volumen * this.factorDeConversion;
        peso_con_volumen = Math.ceil(Math.floor(peso_con_volumen * 10) / 10);

        return peso_con_volumen;
    }
    /** Heka cobra devolución sobre la guía si es de versión 1
     * o si siendo de la versión 2, es diferente al pago contraentrega
     * 
     * Es decir, las guíass creadas con versión 2 que sean pago contraentrega no cobran devolución
     */
    get cobraDevolucion() {
      const esVersion1 = this.version === 1;
      const version2PagoContraentrega = this.version === 2 && this.type !== PAGO_CONTRAENTREGA;
      return esVersion1 || version2PagoContraentrega;
    }

    get getDetails() {
        const details = {
            peso_real: this.dataSentApi.weight,
            flete: this.flete,
            comision_heka: this.comision_heka,
            comision_adicional: this.dataFromApi.additional_commission,
            comision_trasportadora: this.sobreflete + this.seguroMercancia,
            peso_liquidar: this.kgTomado,
            peso_con_volumen: this.pesoVolumen,
            total: this.costoEnvio,
            recaudo: this.valor,
            seguro: this.seguro,
            costoDevolucion: this.cobraDevolucion ? this.costoDevolucion : this.costoDevolucionOriginal, // this.version === 2 ? this.costoDevolucionOriginal : this.costoDevolucion,
            cobraDevolucion: this.cobraDevolucion,
            versionCotizacion: this.version
        };
    
        if (ControlUsuario.esPuntoEnvio)
            details.comision_punto = this.dataFromApi.commission_point;
    
        if (this.sobreflete_oficina)
            details.sobreflete_oficina = this.sobreflete_oficina; // TODO: Falta validar cuando comience a migrar los temas de oficina
    
        return details;
    }
}

function converToOldQuoterData(dataNew) {
    return {
        seguro: dataNew.declaredValue,
        valor: dataNew.collectionValue,
        peso: dataNew.weight,
        type: translation.typePayment[dataNew.typePayment],
        dane_ciudadR: dataNew.daneCityOrigin,
        dane_ciudadD: dataNew.daneCityDestination,
        sumar_envio: dataNew.withshippingCost
    }
}

const excludeFromTester = [transportadoras.HEKA.cod, transportadoras.TCC.cod];
async function demoPruebaCotizadorAntiguo(dataNew) {
  const data = converToOldQuoterData(dataNew);
  console.log("MY DATA: ", data);
  if(data.type === CONTRAENTREGA) {
    data.valor = 1; // Para que se parezca más al pago a destino en el cotizador original 
  }

  const FACHADA_FLETE = 1000;

  //itero entre las transportadoras activas para calcular el costo de envío particular de cada una
  await Promise.all(
    Object.keys(transportadoras).filter(t => !excludeFromTester.includes(t)).map(async (transp) => {
      // Este factor será usado para hacer variaciones de precios entre
      // flete trasportadora y sobreflete heka para intercambiar valores
      let factor_conversor = 0;

      let seguro = data.seguro,
        recaudo = data.valor;
      let transportadora = transportadoras[transp];

      if (transp === "TCC") {
        return null;
      }

      if (transp === "SERVIENTREGA" || transp === "INTERRAPIDISIMO") {
        seguro = recaudo ? recaudo : seguro;
      }

      if (data.peso > transportadora.limitesPeso[1]) return null;
      let valor = Math.max(
        seguro,
        transportadora.limitesValorDeclarado(data.peso)[0]
      );

      let cotizador = new CalcularCostoDeEnvio(valor, data.type);

      if (["ENVIA", "COORDINADORA", "HEKA"].includes(transp)) {
        cotizador.valor = recaudo;
        cotizador.seguro = Math.max(
          seguro,
          transportadora.limitesValorDeclarado(data.peso)[0]
        );
      }

      cotizador.kg_min = transportadora.limitesPeso[0];

      const cotizacion = await cotizador.putTransp(transp, {
        dane_ciudadR: data.dane_ciudadR,
        dane_ciudadD: data.dane_ciudadD
      });


      if (data.sumar_envio || data.type === CONTRAENTREGA) {
        // Cuanndo la guía en "PAGO DESTINO", no es necesario sumar nada, ya que la utilidad está en que no se le devuelve nada al cliente (exeptuando a inter, porque no nos dejó alternativa, sin embargo se proteje con la ganancia a Heka)
        // En cambio la opción para sumar destino si sumaría el valor a recaudar que se ingrese, ya que la idea es que dicha cantidad quede intacta
        cotizacion.sumarCostoDeEnvio = data.sumar_envio ? cotizacion.valor : 0;

        if (transp === "INTERRAPIDISIMO") {
          const minimoEnvio = transportadora.valorMinimoEnvio(
            cotizacion.kgTomado
          );
          const diferenciaMinima = minimoEnvio - cotizacion.valor;
          if (diferenciaMinima > 0)
            cotizacion.sumarCostoDeEnvio = diferenciaMinima;

          //Se le resta 1000 [FACHADA_FLETE] para evitar que se cruce con el valor constante que se añade sobre "this.sobreflete_heka += 1000"
          const diferenciaActualRecaudoEnvio =
            cotizacion.valor - cotizacion.costoEnvio - FACHADA_FLETE;
          if (diferenciaActualRecaudoEnvio > 0 && data.type === CONTRAENTREGA) {
            factor_conversor = diferenciaActualRecaudoEnvio;
            cotizacion.set_sobreflete_heka =
              cotizacion.sobreflete_heka + diferenciaActualRecaudoEnvio;
          }
        }
      }

      let descuento;
      if (cotizacion.descuento) {
        const percent = Math.round(
          ((cotizacion.costoEnvioPrev - cotizacion.costoEnvio) * 100) /
            cotizacion.costoEnvioPrev
        );
        descuento = percent;
      }

      //Para cargar el sobreflete heka antes;
      const costoEnvio = cotizacion.costoEnvio
      cotizacion.debe = data.type === CONVENCIONAL ? 0 : - costoEnvio;
      
      let sobreFleteHekaEdit = cotizacion.sobreflete_heka;
      let fleteConvertido = cotizacion.flete;
      if (
        ["ENVIA", "INTERRAPIDISIMO", "COORDINADORA", "SERVIENTREGA"].includes(
          transp
        ) &&
        data.type === PAGO_CONTRAENTREGA
      ) {
        factor_conversor = FACHADA_FLETE;
      }

      // Se procura sumar esta comisión adicional sobre el flete (visual) que se muestra sobre el cotizador
      // Pero no se retorna a la comisión heka, ya que se guarda por aparte
      fleteConvertido += cotizacion.comisionHekaAdicional; // Para los precios antiguos, esto devolvería cero
      if (factor_conversor > 0) {
        sobreFleteHekaEdit -= factor_conversor;
        fleteConvertido += factor_conversor;
      }


      if (!transportadora.cotizacionOld) transportadora.cotizacionOld = new Object();
      transportadora.cotizacionOld[data.type] = cotizacion;

    })
  );
}


function testComparePrices(type) {
  let cantidadErrores = 0;
  let casosAnalizados = 0;
  let pruebasCorrectas = 0;
  const result = Object.values(transportadoras).filter(t => !excludeFromTester.includes(t.cod)).map(transport => {
      console.log("\nComparando resultados Transportadora: " + transport.cod);
      console.groupCollapsed(transport.cod);

      if(!transport.cotizacion) {
          console.log("La transportaddora no está controlada por api");
          console.groupEnd(transport.cod);
          return;
      }
      
      const preciosApi = transport.cotizacion[type];
      const preciosViejos = transport.cotizacionOld[type];
      const valoresImportantes = [
          ["debe", "_-costoEnvio", "Deuda guía"], 
          ["costoEnvio", "total", "Costo del envío"], 
          ["valor", "transportCollection", "Valor de recaudo"], 
          ["seguro", "declaredValue", "Valor declarado"],
          ["type", "_type", "Tipo de envío"], 
          ["kgTomado", "_MAX(weight, pesoVol)", "Peso que se liquida"],
          ["dane_ciudadR", "_daneCityOrigin", "Ciudad Origen"], 
          ["dane_ciudadD", "_daneCityDestination", "Ciudad Destino"], 
          ["sobreflete", "transportCommission", "Comisión transportadora"],
          ["seguroMercancia", "assured", "Seguro mercancía"],
          ["costoDevolucion", "cost_return_heka", "Costo Devolucion (V1)"],
          ["costoDevolucionOriginal", "cost_return", "Costo Devolucion (V2)"],

          ["getDetails", "__Details", "Detalles"]
      ];
      
      const valoresImportantesGetDetails = [
          ["peso_real", "_(INNER) weight", "Peso Introducido (ignorar con Servi)"],
          ["flete", "flete", "Flete de la transportadora"],
          ["comision_heka", "hekaCommission", "Comisión Heka"],
          ["comision_adicional", "additional_commission", "Comisión adicional Heka"],
          ["comision_trasportadora", "_transportCommission + assured", "Comisión total de la transportadora"],
          ["peso_liquidar", "_(INNER) kgTomado", "Peso a liquidar"],
          ["peso_con_volumen", "_INNER CALCULATION", "Peso resultante del volumen"],
          ["costoDevolucion", "_cost_return_heka | cost_return", "Costo de devolución"],
          ["cobraDevolucion", "_version = 1", "Cobra devolución?"],
          ["versionCotizacion", "version", "Versión de cotización"],
          ["comision_punto", "commission_point", "Comisión del punto"]
      ];

      const getMessage = (oldValue, newValue, origin, valueOrigin) => `\n - Esperando: ${oldValue} \n - Obtenido: ${newValue} \n - Origen: ${origin} = ${valueOrigin}`;
      const getValueOrigin = (origin) => {
          const isDescription = origin.startsWith("_");
          return {
              key: isDescription ? origin.replace("_", "") : origin,
              value: isDescription ? "---" : preciosApi.dataFromApi[origin]
          }
      }

      valoresImportantes.forEach(([key, origin, descriptor]) => {
          const newValue = preciosApi[key];
          const oldValue = preciosViejos[key];

          if(key === "getDetails") {
            console.groupCollapsed("DETALLES");
            valoresImportantesGetDetails.forEach(([key, origin, descriptor2]) => {
                const newInnerValue = newValue[key];
                const oldInnerValue = oldValue[key];
                casosAnalizados++;
                const assertCondition = newInnerValue === oldInnerValue;
                const valueOrigin = getValueOrigin(origin);
                const message = getMessage(oldInnerValue, newInnerValue, valueOrigin.key, valueOrigin.value);
                if(assertCondition) {
                  pruebasCorrectas++;
                    console.log(`%c PASS ${descriptor} > ${descriptor2} ${message}`, "color:green");
                } else {
                  console.log(`%c NOT PASS ${descriptor} > ${descriptor2} ${message}`, "color:red");
                  cantidadErrores++;
                }
            })
            console.groupEnd("DETALLES");
          } else {
            casosAnalizados++;
              const assertCondition = newValue === oldValue;
              const valueOrigin = getValueOrigin(origin);
              const message = getMessage(oldValue, newValue, valueOrigin.key, valueOrigin.value);
              if(assertCondition) {
                pruebasCorrectas++;
                console.log(`%c PASS ${descriptor}: ${message}`, "color:green");
              } else {
                console.log(`%c NOT PASS ${descriptor}: ${message}`, "color:red");
                cantidadErrores++;
              }
          }
      });
      console.groupEnd(transport.cod);

      return [preciosViejos, preciosApi];
  });


  console.group("RESUMEN");
  console.log("Errores Totales: ", cantidadErrores);
  console.log("Pruebas Pasadas: ", pruebasCorrectas);
  console.log("Casos asimilados: ", casosAnalizados);
  console.log("Porcentaje de similitud: ", Math.round(pruebasCorrectas * 100 / casosAnalizados) + "%");
  console.groupEnd("RESUMEN");

  return result;
}

function createExcelComparativePrices(objInput, arrOutput) {
  const base = {
    ciudad_origen: objInput.ciudadOrigen,
    ciudad_destino: objInput.ciudadDestino,
    tipo_envio: translation.typePayment[objInput.typePayment],
    recaudo: objInput.collectionValue,
    declarado: objInput.declaredValue,
    peso: objInput.weight
  }

  const result = [];
  arrOutput.forEach(([cotiA, cotiB]) => {
    const objtResult = {
      transportadora: cotiA.codTransp,
      flete_a: cotiA.flete,
      flete_b: cotiB.flete,
      comision_transp_a: cotiA.sobreflete,
      comision_transp_b: cotiB.sobreflete,
      comision_heka_a: cotiA.getDetails.comision_heka,
      comision_heka_b: cotiB.getDetails.comision_heka,
      seguro_mercancia_a: cotiA.seguroMercancia,
      seguro_mercancia_b: cotiB.seguroMercancia,
      costo_envio_a: cotiA.costoEnvio,
      costo_envio_b: cotiB.costoEnvio,
    }

    result.push(Object.assign({}, base, objtResult));
  });

  console.log(result);
  
  if(!result.length) throw new Error("No se pudo generar el informe");
  const keys = Object.keys(result[0]).reduce((a,b) => {a[b] = b; return a}, {});

  const descargadorDeInforme = () => descargarInformeExcel(keys, result, `Cotización_${base.tipo_envio}_${objInput.daneCityOrigin}_${objInput.daneCityDestination}`);

  if(!window.XLSX) {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/xlsx/dist/xlsx.full.min.js";
    script.onload = () => {descargadorDeInforme()}
    document.head.appendChild(script);
  } else {
    descargadorDeInforme();
  }
  
}

async function cotizadorTemporalTransportadoraHeka(dataSentApi) {
  const data = {
    peso: dataSentApi.weight,
    alto: dataSentApi.height,
    largo: dataSentApi.long,
    ancho: dataSentApi.width,
    valorSeguro: dataSentApi.declaredValue,
    valorRecaudo: dataSentApi.collectionValue,
    idDaneCiudadOrigen: dataSentApi.daneCityOrigin,
    idDaneCiudadDestino: dataSentApi.daneCityDestination,
    tipo: translation.typePayment[dataSentApi.typePayment],
  };

  const response = await fetch(v0.pathCotizador, {
    method: "Post",
    headers: { "Content-Type": "Application/json" },
    body: JSON.stringify(data),
  })
    .then((R) => {
      return R.json();
    })
    .catch((R) => ({ error: true, body: "Error del servidor" }));

  if (response.error) {
    return {
      entity: "heka",
      message: response.body
    };
  }

  let comision_heka = datos_personalizados.comision_heka;
  let constante_heka = datos_personalizados.constante_pagoContraentrega;

  if (dataSentApi.typePayment === 3) {
    comision_heka = 1;
    constante_heka = datos_personalizados.constante_convencional;
  }

  return {
    entity: "heka",
    deliveryTime: "1-2",
    declaredValue: dataSentApi.declaredValue,
    flete: response.body.valorFlete,
    valueDeposited: 6925,
    transportCommission: response.body.sobreFlete,
    hekaCommission: Math.ceil((dataSentApi.collectionValue * comision_heka) / 100) + constante_heka,
    transportCollection: dataSentApi.collectionValue,
    onlyToAddress: false,
    assured: 0,
    annotations: "",
    total: 18075,
    version: "1",
    cost_return_heka: 0,
    cost_return: 0,
    additional_commission: 0,
    commissionPoint: 0,
  };
}

export {translation, TranslatorFromApi, demoPruebaCotizadorAntiguo, testComparePrices, createExcelComparativePrices, cotizadorTemporalTransportadoraHeka}