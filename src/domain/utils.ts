import { EstadoGeneral, ESTADO_NORMALIZACION, MatrizPruebasEstado, IncidenciaEstado } from './types.js';

/**
 * Normaliza un estado desde cualquier variante a la forma estándar
 */
export function normalizarEstado(estado: string): EstadoGeneral | null {
  const estadoLimpio = estado.trim();
  
  // Buscar coincidencia exacta primero
  if (estadoLimpio in ESTADO_NORMALIZACION) {
    return ESTADO_NORMALIZACION[estadoLimpio];
  }
  
  // Buscar coincidencia case-insensitive
  const estadoLower = estadoLimpio.toLowerCase();
  for (const [alias, normal] of Object.entries(ESTADO_NORMALIZACION)) {
    if (alias.toLowerCase() === estadoLower) {
      return normal;
    }
  }
  
  // Si no hay coincidencia, intentar mapeo directo para estados válidos
  const estadosValidosMatriz: MatrizPruebasEstado[] = ['Pendiente', 'En curso', 'Finalizado'];
  const estadosValidosIncidencia: IncidenciaEstado[] = ['Pendiente', 'Devuelto', 'En curso', 'Finalizado', 'Resuelto'];
  
  // Buscar en estados válidos (case-insensitive)
  for (const estado of [...estadosValidosMatriz, ...estadosValidosIncidencia]) {
    if (estado.toLowerCase() === estadoLower) {
      return estado;
    }
  }
  
  console.warn(`⚠️ Estado no reconocido: "${estado}". Usando como-está.`);
  return null;
}

/**
 * Valida si un estado es válido para Matriz de Pruebas
 */
export function esEstadoValidoMatriz(estado: EstadoGeneral): estado is MatrizPruebasEstado {
  return ['Pendiente', 'En curso', 'Finalizado'].includes(estado);
}

/**
 * Valida si un estado es válido para Incidencias
 */
export function esEstadoValidoIncidencia(estado: EstadoGeneral): estado is IncidenciaEstado {
  return ['Pendiente', 'Devuelto', 'En curso', 'Finalizado', 'Resuelto'].includes(estado);
}

/**
 * Convierte estado a formato de display según requerimiento
 * - "En curso" -> "Curso" para reportes
 */
export function estadoParaDisplay(estado: EstadoGeneral): string {
  if (estado === 'En curso') {
    return 'Curso';
  }
  return estado;
}

/**
 * Genera prefijo para registro según tipo
 * - CASO -> "CP"
 * - INCIDENCIA -> "RI"
 */
export function prefijoTipo(tipo: 'CASO' | 'INCIDENCIA'): 'CP' | 'RI' {
  return tipo === 'CASO' ? 'CP' : 'RI';
}