/**
 * Utilidades para manejo de fechas y días hábiles
 * Días hábiles = Lunes a Viernes (excluye fines de semana)
 */

export interface FechaHora {
  fecha: string;        // YYYY-MM-DD
  hora: string;         // HH:MM:SS
  fecha_hora: string;   // YYYY-MM-DD HH:MM:SS
  timestamp: number;    // Unix timestamp
}

/**
 * Obtiene la fecha y hora actual en zona horaria especificada
 */
export function obtenerFechaHoraActual(timezone: string = 'America/Asuncion'): FechaHora {
  const now = new Date();
  
  // Formatear en timezone específico
  const opciones: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  const formatter = new Intl.DateTimeFormat('es-PY', opciones);
  const partes = formatter.formatToParts(now);
  
  const año = partes.find(p => p.type === 'year')?.value || '';
  const mes = partes.find(p => p.type === 'month')?.value || '';
  const dia = partes.find(p => p.type === 'day')?.value || '';
  const hora = partes.find(p => p.type === 'hour')?.value || '';
  const minuto = partes.find(p => p.type === 'minute')?.value || '';
  const segundo = partes.find(p => p.type === 'second')?.value || '';
  
  const fecha = `${año}-${mes}-${dia}`;
  const horaStr = `${hora}:${minuto}:${segundo}`;
  
  return {
    fecha,
    hora: horaStr,
    fecha_hora: `${fecha} ${horaStr}`,
    timestamp: now.getTime()
  };
}

/**
 * Verifica si una fecha es día hábil (lunes a viernes)
 */
export function esDiaHabil(fecha: Date): boolean {
  const diaSemana = fecha.getDay();
  // 0 = Domingo, 6 = Sábado
  return diaSemana >= 1 && diaSemana <= 5;
}

/**
 * Obtiene el día hábil anterior a una fecha dada
 * Si la fecha es lunes, devuelve el viernes anterior
 */
export function obtenerDiaHabilAnterior(fecha: Date): Date {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() - 1);
  
  // Si cae en fin de semana, retroceder hasta el viernes
  while (!esDiaHabil(resultado)) {
    resultado.setDate(resultado.getDate() - 1);
  }
  
  return resultado;
}

/**
 * Obtiene la fecha N días hábiles atrás
 */
export function obtenerFechaDiasHabilesAtras(diasHabiles: number, desde?: Date): Date {
  let fecha = desde ? new Date(desde) : new Date();
  let diasRestantes = diasHabiles;
  
  while (diasRestantes > 0) {
    fecha.setDate(fecha.getDate() - 1);
    if (esDiaHabil(fecha)) {
      diasRestantes--;
    }
  }
  
  return fecha;
}

/**
 * Convierte Date a formato YYYY-MM-DD
 */
export function formatearFecha(fecha: Date): string {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

/**
 * Convierte Date a formato YYYY-MM-DD HH:MM:SS
 */
export function formatearFechaHora(fecha: Date): string {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const hora = String(fecha.getHours()).padStart(2, '0');
  const minuto = String(fecha.getMinutes()).padStart(2, '0');
  const segundo = String(fecha.getSeconds()).padStart(2, '0');
  return `${año}-${mes}-${dia} ${hora}:${minuto}:${segundo}`;
}

/**
 * Parsea string YYYY-MM-DD a Date
 */
export function parsearFecha(fechaStr: string): Date {
  const [año, mes, dia] = fechaStr.split('-').map(Number);
  return new Date(año, mes - 1, dia);
}

/**
 * Calcula días hábiles entre dos fechas (no incluye la fecha final)
 */
export function contarDiasHabiles(desde: Date, hasta: Date): number {
  let contador = 0;
  const actual = new Date(desde);
  
  while (actual < hasta) {
    if (esDiaHabil(actual)) {
      contador++;
    }
    actual.setDate(actual.getDate() + 1);
  }
  
  return contador;
}
