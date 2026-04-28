import axios from 'axios';

// Configuración básica de Axios con el nuevo baseURL
const api = axios.create({
    baseURL: 'https://devticket.uchilefau.cl/api',  // URL base común para todas las peticiones
    headers: {
        'Content-Type': 'application/json',
    },
});

// Manejo de errores globales
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // El servidor respondió con un error
            console.error('API Error:', error.response.data);
            return Promise.reject(error.response.data);
        } else if (error.request) {
            // No se recibió respuesta del servidor
            console.error('No Response:', error.request);
            return Promise.reject({ message: 'Error de red' });
        } else {
            // Otro tipo de error
            console.error('Error:', error.message);
            return Promise.reject(error.message);
        }
    }
);

export default api;