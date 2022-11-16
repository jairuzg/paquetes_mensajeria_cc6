const express = require('express');
const app = express();
const cors = require('cors');
app.use(express.json());
app.use(cors(
    {
        "origin": "*",
        "methods": "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
        "preflightContinue": false,
        "optionsSuccessStatus": 204
    }
));
const {body, validationResult, oneOf} = require('express-validator');

const {insertarGrua} = require('./db/gruas');
const {
    insertarBus,
    obtenerTodosLosBuses,
    eliminarBusPorId,
    actualizarBusPorId,
    obtenerBusPorId
} = require('./db/bus_mensajeria');
const {
    insertarZonaCobertura,
    listarTodasLasZonasCobertura, obtenerZonaPorId, eliminarZonaPorId, modificarZonaPorId
} = require('./db/zona_cobertura');
const {
    transicionarCotiAPagado,
    actualizarEstadoOrdenFirestore, obtenerCotizacionPorOdenEnFirestore, obtenerCotizacionPorOdenID
} = require('./db/cotizacion');
const {heartBeat} = require('./db/heartbeat');
const {insertarPago, mandarPagoAFirestore, obtenerPagoDeLaDBLocalPorOrdenID} = require("./db/pago");
const {
    encontrarZonaCercanaAPuntoRecogida
} = require("./distribuidor_paqueteria/distribuidor");
const constants = require("./common/constants");
const {
    enviarOrdenAFirebase,
    guardarOrdenEnDBLocal,
    transformarCotizacionAOrden
} = require("./servicios/servicio_ordenes");

app.get('/', (req, res) => {
    res.status(200).send({
        success: true,
        message: "Servicio de paqueteria para Taller CC6"
    });
});

app.post('/grua',
    body('marca').notEmpty().isString(),
    body('modelo').notEmpty(),
    body('precioKilometro').isDecimal(),
    body('capacidadPeso').isDecimal(),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        let grua = req.body;
        insertarGrua(grua);
        return res.status(201).send({
            success: "true",
            message: "Grua insertada con exito",
        });
    });

app.get('/buses', (req, res) => {
    obtenerTodosLosBuses(function (err, buses) {
        if (buses) {
            return res.status(200).send(buses);
        } else {
            return res.status(400).send({
                success: false,
                message: "Ocurrio un error al momento de obtener los buses",
                errors: err
            });
        }
    });
});

app.get('/bus/:busMensajeria',
    (req, res) => {
        obtenerBusPorId(req.params.busMensajeria, (err, bus) => {
            if (bus) {
                return res.status(200).send(bus);
            } else {
                return res.status(400).send({
                    success: false,
                    message: "Hubo un error al tratar de obtener el bus con ID " + req.params.busMensajeria,
                    errors: err
                });
            }
        });
    });

app.post('/bus',
    body('marca').notEmpty().isString(),
    body('modelo').notEmpty(),
    body('capacidadPeso').isDecimal(),
    body('zonaCobertura').isNumeric(),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        let bus = req.body;
        insertarBus(bus, function (err, isOk) {
            if (isOk) {
                return res.status(201).send({
                    success: "true",
                    message: "Bus agregado con exito",
                });
            } else {
                return res.status(400).send({
                    success: "false",
                    message: "Ocurrio un error al intentar agregar el bus",
                    errors: err
                });
            }
        });
    });

app.patch('/bus/:busMensajeria', oneOf([
        body('marca').isString().exists(),
        body('modelo').isString().exists(),
        body('capacidadPeso').isDecimal().exists(),
        body('zonaCobertura').isNumeric().exists()
    ]),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        let busMensajeria = req.body;
        busMensajeria.busMensajeria = req.params.busMensajeria;
        actualizarBusPorId(busMensajeria, function (err, isOk) {
            if (isOk) {
                return res.status(201).send({
                    success: true,
                    message: "Bus modificado con exito",
                });
            } else {
                return res.status(400).send({
                    success: false,
                    message: "Ocurrio un error al intentar modificar el bus",
                    errors: err
                });
            }
        });
    });

app.delete('/bus/:busMensajeria',
    (req, res) => {
        eliminarBusPorId(req.params.busMensajeria, (err, isOk) => {
            if (isOk) {
                return res.status(200).send({
                    success: true,
                    message: "Bus eliminado con exito"
                });
            } else {
                return res.status(400).send({
                    success: false,
                    message: "Hubo un error al tratar de eliminar el bus con ID " + req.params.busMensajeria,
                    errors: err
                });
            }
        });
    });

app.get('/zonas', (req, res) => {
    listarTodasLasZonasCobertura((error, zonas) => {
        if (zonas) {
            return res.status(200).send(zonas);
        } else {
            return res.status(400).send({
                success: false,
                message: "ocurrio un error al tratar de lsitar todas las zonas de cobertura disponibles",
                errors: error
            });
        }
    });
});

app.get('/zona/:zonaCobertura',
    (req, res) => {
        obtenerZonaPorId(req.params.zonaCobertura, function (err, zona) {
            if (zona) {
                return res.status(200).send(zona);
            } else {
                return res.status(400).json({errors: err});
            }
        });
    });

app.delete('/zona/:zonaCobertura',
    (req, res) => {
        eliminarZonaPorId(req.params.zonaCobertura, (err, isOk) => {
            if (isOk) {
                return res.status(200).send({
                    success: true,
                    message: "Zona de cobertura eliminada con exito"
                });
            } else {
                return res.status(400).send({
                    success: false,
                    message: "Hubo un error al intentar eliminar la zona de cobertura con ID " + req.params.zonaCobertura,
                    errors: err
                });
            }
        });
    });

app.post('/zona',
    body('latitud').isDecimal().notEmpty(),
    body('longitud').isDecimal().notEmpty(),
    body('radio').isDecimal().notEmpty(),
    body('descripcion').isString(),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        let zona = req.body;
        insertarZonaCobertura(zona, function (err, insertId) {
            if (!err) {
                return res.status(201).send({
                    success: "true",
                    message: "Zona de cobertura agregada con exito, ID: " + insertId,
                });
            } else {
                return res.status(400).json({errors: err});
            }
        });
    });

app.patch('/zona/:zonaCobertura',
    oneOf([
        body('latitud').isDecimal().exists(),
        body('longitud').isDecimal().exists(),
        body('radio').isDecimal().exists(),
        body('descripcion').isString().exists()
    ]),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        let zona = req.body;
        zona.zonaCobertura = req.params.zonaCobertura;

        modificarZonaPorId(zona, function (err, isOk) {
            if (isOk) {
                return res.status(200).send({
                    success: true,
                    message: "Zona de cobertura modificada con exito, ID: " + zona.zonaCobertura,
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Hubo un error al intentar modificar la zona de cobertura con ID " + zona.zonaCobertura,
                    errors: err
                });
            }
        });
    });

app.post('/delivery',
    body("orderId").isString().notEmpty(),
    body("quantityArticles").isNumeric(),
    body("totalWeight").isDecimal(),
    body("totalPrice").isDecimal(),
    body("pickupLatitud").isDecimal(),
    body("pickupLongitud").isDecimal(),
    body("deliveryLatitud").isDecimal(),
    body("deliveryLongitud").isDecimal(),
    body("clientName").isString().optional(),
    body("firebaseId").isString().optional(),
    (req, res) => {
        console.log("Requesting a new ORDER ", req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(errors);
            return res.status(400).json({errors: errors.array()});
        }

        let cotizacion = {
            ordenID: req.body.orderId,
            cantidadArticulos: req.body.quantityArticles,
            pesoTotal: req.body.totalWeight,
            precioTotal: req.body.totalPrice,
            recogidaLatitud: req.body.pickupLatitud,
            recogidaLongitud: req.body.pickupLongitud,
            destinoLatitud: req.body.deliveryLatitud,
            destinoLongitud: req.body.deliveryLongitud,
            nombreRecibe: req.body.clientName,
            firebaseId: req.body.firebaseId ? req.body.firebaseId : ""
        }

        enviarOrdenAFirebase(cotizacion).then((data) => {
            console.log("la coti luego de enviar a firebase", data.cotizacion)
            req.body.firebaseId = data.cotizacion.firebaseId;
            if (data.cotizacion.servidor != constants.SERVIDOR_ACTUAL) {
                console.log("Distribucion: Comparando servidores, destino " + data.cotizacion.servidor + " servidor actual " + constants.SERVIDOR_ACTUAL);
                return res.redirect(307, constants.SERVIDORES_DIST[data.cotizacion.servidor].HOST + "/delivery");
            }
            guardarOrdenEnDBLocal(data.cotizacion, (orderResp) => {
                console.log('que trae orderResp ', orderResp);
                return res.status(orderResp.code).send(orderResp.data);
            });
        });

    });

app.get('/orden/:ordenID', function (req, res) {
    let ordenID = req.body.ordenID ? req.body.ordenID : req.params.ordenID;
    obtenerCotizacionPorOdenEnFirestore(ordenID).then(cotiFirestore => {
        delete cotiFirestore.firestoreId;
        return res.status(200).send(cotiFirestore);
    });
});

app.get('/ordenLocal/:ordenID', function (req, res) {
    let ordenID = req.body.ordenID ? req.body.ordenID : req.params.ordenID;
    obtenerCotizacionPorOdenID(ordenID, (error, orden) => {
        if (orden) {
            return res.status(200).send(transformarCotizacionAOrden(orden));
        }
    });
});

app.post('/orden',
    body("ordenID").isString().notEmpty(),
    function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(errors);
            return res.status(400).json({errors: errors.array()});
        }
        obtenerCotizacionPorOdenEnFirestore(req.body.ordenID).then(cotiFirestore => {
            delete cotiFirestore.firestoreId;
            return res.status(200).send(cotiFirestore);
        });
    });

app.get('/pagoLocal/:ordenID', (req, res) => {
    obtenerPagoDeLaDBLocalPorOrdenID(req.params.ordenID, (errors, pago) => {
        if (pago) {
            return res.status(200).send(pago);
        } else {
            return res.status(400).send({
                success: false,
                message: "Ocurrio un error al tratar de encontrar el pago con ordenID " + req.params.ordenID,
                errors: errors
            })
        }
    });
});

app.post('/pago',
    body("ordenID").notEmpty().isString(),
    body("numeroCC").isString().notEmpty(),
    body("mesExp").isString().notEmpty(),
    body("anioExp").isString().notEmpty(),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        obtenerCotizacionPorOdenEnFirestore(req.body.ordenID).then(cotiFirestore => {
            const servidor = cotiFirestore.servidor;
            if (servidor != constants.SERVIDOR_ACTUAL) {
                console.log("Servidor actual", constants.SERVIDOR_ACTUAL, "servidor de la orden ", servidor);
                console.log("se necesita distribuir la creacion del pago")
                return res.redirect(307, constants.SERVIDORES_DIST[servidor].HOST + "/pago");
            } else {
                transicionarCotiAPagado(req.body, function (err, isOk) {
                    if (isOk) {
                        actualizarEstadoOrdenFirestore(cotiFirestore.firestoreId);
                        insertarPago(req.body, function (err2, pago) {
                            if (pago) {
                                mandarPagoAFirestore(pago);
                                return res.status(200).send({
                                    success: true,
                                    message: "Pago realizado con exito para la orden " + req.body.ordenID
                                });
                            } else {
                                return res.status(200).send({
                                    success: true,
                                    message: "Pago realizado con exito para la orden " + req.body.ordenID + " pero no se pudo guardar la informacion para historial ",
                                    errors: err2
                                });
                            }
                        })
                    } else {
                        return res.status(400).send({
                            success: false,
                            message: "Hubo un inconveniente al realizar su pago",
                            error: err
                        });
                    }
                });
            }
        })
    });

app.post('/test', (req, res) => {
    encontrarZonaCercanaAPuntoRecogida(req.body.latitud, req.body.longitud, "A");
    return res.status(200).send({});
});
app.get('/healthCheck', (req, res) => {
    heartBeat(function (err, isOk) {
        if (isOk) {
            return res.status(200).send();
        } else {
            return res.status(500).send();
        }
    });
});

const port = 8000;
app.listen(port, () => {
    console.log("server listening on port " + port);
});
