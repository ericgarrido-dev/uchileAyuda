/**
 * Validador de RUT Chileno
 */

export function formatRut(rut: string): string {
  // Eliminar caracteres no permitidos
  const cleaned = rut.replace(/[^0-9kK]/g, '');

  if (cleaned.length === 0) return '';

  // Separar número y dígito verificador
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1).toUpperCase();

  // Formatear con puntos y guión
  let formatted = '';
  let count = 0;

  for (let i = body.length - 1; i >= 0; i--) {
    if (count === 3) {
      formatted = '.' + formatted;
      count = 0;
    }
    formatted = body[i] + formatted;
    count++;
  }

  return formatted + '-' + dv;
}

export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '');
}

export function calculateDV(rut: string): string {
  const cleaned = cleanRut(rut).slice(0, -1);

  let sum = 0;
  let multiplier = 2;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    sum += parseInt(cleaned[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const dv = 11 - remainder;

  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
}

export function validateRut(rut: string): boolean {
  const cleaned = cleanRut(rut);

  if (cleaned.length < 2) return false;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1).toUpperCase();

  // Validar que el cuerpo sea numérico
  if (!/^\d+$/.test(body)) return false;

  // Validar longitud razonable (7-8 dígitos más DV)
  if (body.length < 7 || body.length > 8) return false;

  // Calcular y comparar dígito verificador
  const calculatedDV = calculateDV(cleaned);

  return dv === calculatedDV;
}

export interface RutValidationResult {
  isValid: boolean;
  message?: string;
  formatted?: string;
}

export function validateAndFormat(rut: string): RutValidationResult {
  if (!rut || rut.trim() === '') {
    return {
      isValid: false,
      message: 'El RUT es requerido',
    };
  }

  const cleaned = cleanRut(rut);

  if (cleaned.length < 2) {
    return {
      isValid: false,
      message: 'RUT incompleto',
    };
  }

  if (cleaned.length < 8) {
    return {
      isValid: false,
      message: 'RUT incompleto. Debe tener al menos 7 dígitos',
    };
  }

  const isValid = validateRut(rut);

  if (!isValid) {
    return {
      isValid: false,
      message: 'RUT inválido. Verifica el dígito verificador',
    };
  }

  return {
    isValid: true,
    formatted: formatRut(rut),
  };
}
