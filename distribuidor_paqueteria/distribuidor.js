const {zonas} = require('./zonas_ciudad');
const request = require('request');
const constants = require("./../common/constants");

const gradosARadianes = (grados) => {
    return grados * Math.PI / 180;
};

const calcularDistanciaEntreDosCoordenadas = (lat1, lon1, lat2, lon2) => {
    // Convertir todas las coordenadas a radianes
    lat1 = gradosARadianes(lat1);
    lon1 = gradosARadianes(lon1);
    lat2 = gradosARadianes(lat2);
    lon2 = gradosARadianes(lon2);
    // Aplicar fórmula
    const RADIO_TIERRA_EN_KILOMETROS = 6371;
    let diferenciaEntreLongitudes = (lon2 - lon1);
    let diferenciaEntreLatitudes = (lat2 - lat1);
    let a = Math.pow(Math.sin(diferenciaEntreLatitudes / 2.0), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(diferenciaEntreLongitudes / 2.0), 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return RADIO_TIERRA_EN_KILOMETROS * c;
};

const encontrarZonaCercanaAPuntoRecogida = (lat, long) => {
    let distancias = [];
    zonas.forEach(zona => {
        let distancia = calcularDistanciaEntreDosCoordenadas(lat, long, zona.latitud, zona.longitud);
        distancias.push(distancia);
    })
    let distanciaMinima = Math.min(...distancias);
    return zonas[distancias.indexOf(distanciaMinima)];
};

const obtenerServidorCorrespondiente = (lat, long) => {
    const zonaCercana = encontrarZonaCercanaAPuntoRecogida(lat, long);
    return zonaCercana.servidor;
};

module.exports = {
    obtenerServidorCorrespondiente: obtenerServidorCorrespondiente
}