import axios from 'axios';

//Detecta automáticamente el entorno
const BASE_URL = __DEV__
  ? 'https://devticket.uchilefau.cl/api'   // desarrollo
  : 'https://ayuda.uchilefau.cl/api';     // producciónd

console.log('Entorno:', __DEV__ ? 'DESARROLLO' : 'PRODUCCIÓN');
console.log('API URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
      return Promise.reject(error.response.data);
    } else if (error.request) {
      console.error('No Response:', error.request);
      return Promise.reject({ message: 'Error de red' });
    } else {
      console.error('Error:', error.message);
      return Promise.reject(error.message);
    }
  }
);

export default api;