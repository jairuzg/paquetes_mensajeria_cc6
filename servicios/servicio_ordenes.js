const {getDistance} = require("geolib");
const constants = require("../common/constants");
const {agregarCotizacion, guardarCotizacionEnFirebase, actualizarOrdenEnFirestore} = require("../db/cotizacion");
const {obtenerServidorCorrespondiente} = require("../distribuidor_paqueteria/distribuidor");
const {encontrarZonaCercaDeCoordenada} = require("../db/zona_cobertura");
const {encontrarBusPorZona} = require("../db/bus_zona");

function calcularPrecioDeEnvio(cotizacion) {
    const distanciaKm = getDistance(
        {latitude: cotizacion.recogidaLatitud, longitude: cotizacion.recogidaLongitud},
        {latitude: cotizacion.destinoLatitud, longitude: cotizacion.destinoLongitud}
    ) / 1000000;

    console.log("Distancia entre puntos recogida vs entrega ", distanciaKm);

    cotizacion.costoEnvio = (constants.PRECIO_KM * distanciaKm) + (constants.PRECIO_X_LIBRA * cotizacion.pesoTotal);
    cotizacion.tiempoEstimadoLlegada = distanciaKm / constants.VELOCIDAD_PROMEDIO;

    return cotizacion;
}

function servidorDistribucion(zona) {
    console.log("la zona para revisar distribucion es ", zona);
    let servidor = obtenerServidorCorrespondiente(zona.latitud, zona.longitud);
    return servidor;
}

async function enviarOrdenAFirebase(cotizacion) {
    cotizacion = calcularPrecioDeEnvio(cotizacion);
    cotizacion.servidor = servidorDistribucion({
        latitud: cotizacion.destinoLatitud,
        longitud: cotizacion.destinoLongitud
    });
    let error;
    let coti = transformarCotizacionAOrden(cotizacion);
    if (!cotizacion.firebaseId || cotizacion.firebaseId === "") {
        await guardarCotizacionEnFirebase(coti).then((data) => {
            if (data.errFb) {
                console.log("Hubo un error al tratar de guardar la cotizacion en la db central", errFb)
                error = errFb;
            } else {
                cotizacion.firebaseId = data.cotizacion.firebaseId;
                cotizacion.estado = constants.ORDEN_NUEVA;
            }
        });
    }

    return {error, cotizacion};
}

async function guardarOrdenEnDBLocal(cotizacion, callback) {
    await encontrarZonaCercaDeCoordenada(cotizacion.recogidaLatitud, cotizacion.recogidaLongitud, function (err, zonaCobertura) {
        if (zonaCobertura) {
            encontrarBusPorZona(zonaCobertura['zona_cobertura'], function (err2, busMensajeria) {
                if (!err2) {
                    cotizacion.busMensajeria = busMensajeria['bus_mensajeria'];
                    agregarCotizacion(cotizacion, function (err3, cotiRes) {
                        if (err3) {
                            callback({
                                data: {
                                    success: false,
                                    message: "No se pudo realizar la cotizacion ",
                                    errors: err3
                                },
                                code: 400
                            });
                        } else {
                            if (cotizacion.firebaseId && cotizacion.firebaseId !== "") {
                                actualizarOrdenEnFirestore(transformarCotizacionAOrden(cotiRes), cotizacion.firebaseId);
                            } else {
                                guardarCotizacionEnFirebase(transformarCotizacionAOrden(cotiRes));
                            }
                            callback({
                                code: 200,
                                data: transformarCotizacionAOrden(cotiRes)
                            });
                        }
                    })
                } else {
                    callback({
                        data: {
                            success: false,
                            message: "No se pudo encontrar algun bus que pueda cubrir la region ingresada",
                            errors: err2
                        },
                        code: 400
                    });
                }
            });
        } else {
            if (err) callback({
                data: {
                    success: false,
                    message: "No se pudo encontrar alguna zona de cobertura cerca de las coordenadas ingresadas"
                },
                code: 400
            });
        }
    });
}

function transformarCotizacionAOrden(orden) {
    return {
        "ordenID": orden.ordenID,
        "estado": (orden.estado && orden.estado !== "") ? orden.estado : constants.ORDEN_NUEVA,
        "cantidadArticulos": orden.cantidadArticulos,
        "fechaEntrega": orden.fechaEntrega ? orden.fechaEntrega : null,
        "ETA": orden.tiempoEstimadoLlegada,
        "costoEnvio": orden.precioTotal * constants.PERCENT_TAX,
        "costoPiezas": orden.precioTotal,
        "costoTotal": (orden.precioTotal + (orden.precioTotal * constants.PERCENT_TAX)),
        "servidor": orden.servidor
    }
}

module.exports = {
    enviarOrdenAFirebase: enviarOrdenAFirebase,
    guardarOrdenEnDBLocal: guardarOrdenEnDBLocal,
    transformarCotizacionAOrden: transformarCotizacionAOrden
}
