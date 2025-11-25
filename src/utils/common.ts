/**
 * @fileoverview Utilidades comunes del sistema
 * @description Funciones reutilizables para normalización, validación y transformación
 */

import type { EstadoGeneral, MatrizPruebasEstado, IncidenciaEstado } from '../types/common.js';

/**
 * Normalización de estados (mapeo de alias a forma estándar)
 */
const ESTADO_NORMALIZACION: Record<string, EstadoGeneral> = {
  'Curso': 'En curso',
  'En Curso': 'En curso',
  'en curso': 'En curso',
  'EN_CURSO': 'En curso',
  'Pendiente': 'Pendiente',
  'PENDIENTE': 'Pendiente',
  'Finalizado': 'Finalizado',
  'FINALIZADO': 'Finalizado',
  'Devuelto': 'Devuelto',
  'DEVUELTO': 'Devuelto',
  'Resuelto': 'Resuelto',
  'RESUELTO': 'Resuelto'
};

/**
 * Normaliza texto removiendo diacríticos, espacios extra y convirtiendo a lowercase
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remover diacríticos
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');  // Normalizar espacios múltiples
}

/**
 * Normaliza un estado desde cualquier variante a la forma estándar
 */
export function normalizeEstado(estado: string): EstadoGeneral | null {
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
  
  // Si no hay coincidencia, retornar null
  console.warn(`⚠️ Estado no reconocido: "${estado}"`);
  return null;
}

/**
 * Valida si un estado es válido para Matriz de Pruebas
 */
export function isValidMatrizEstado(estado: EstadoGeneral): estado is MatrizPruebasEstado {
  return ['Pendiente', 'En curso', 'Finalizado'].includes(estado);
}

/**
 * Valida si un estado es válido para Incidencias
 */
export function isValidIncidenciaEstado(estado: EstadoGeneral): estado is IncidenciaEstado {
  return ['Pendiente', 'Devuelto', 'En curso', 'Finalizado', 'Resuelto'].includes(estado);
}

/**
 * Extrae el número de ID de un título (CP-01 → "1", RI-123 → "123")
 * @param titulo Título del item (ej: "CP-01", "RI - 123")
 * @returns ID numérico como string, o "0" si no se encuentra patrón
 */
export function extractIdNumber(titulo: string): string {
  const match = titulo.match(/(?:CP|RI)\s*-?\s*(\d+)/i);
  if (match) {
    return parseInt(match[1], 10).toString(); // Remover ceros a la izquierda
  }
  return "0";
}

/**
 * Ordena items por número de ID de forma numérica
 * @param idA ID numérico como string
 * @param idB ID numérico como string  
 * @returns Resultado de comparación para sort
 */
export function sortByIdNumber(idA: string, idB: string): number {
  const numA = parseInt(idA, 10);
  const numB = parseInt(idB, 10);
  return numA - numB;
}

/**
 * Genera prefijo para registro según tipo
 * - CASO → "CP"
 * - INCIDENCIA → "RI"
 */
export function getTypPrefix(tipo: 'CASO' | 'INCIDENCIA'): 'CP' | 'RI' {
  return tipo === 'CASO' ? 'CP' : 'RI';
}

/**
 * Trunca un ID para logging seguro
 * @param id ID completo
 * @param maxLength Longitud máxima (default: 8)
 * @returns ID truncado con '...'
 */
export function truncateId(id: string, maxLength: number = 8): string {
  if (id.length <= maxLength) {
    return id;
  }
  return id.substring(0, maxLength) + '...';
}

/**
 * Clasifica estado de matriz de pruebas en categorías estándar
 */
export type MatrizBucket = 'pendiente' | 'en_curso' | 'finalizado';

export function bucketMatriz(estado: string): MatrizBucket | null {
  const normalized = normalizeText(estado);
  
  if (['pendiente', 'pending', 'todo', 'to do'].includes(normalized)) {
    return 'pendiente';
  }
  if (['en curso', 'curso', 'in progress', 'progress', 'doing', 'active'].includes(normalized)) {
    return 'en_curso';
  }
  if (['finalizado', 'cerrado', 'done', 'completed', 'finished', 'complete'].includes(normalized)) {
    return 'finalizado';
  }
  
  return null;
}

/**
 * Clasifica estado de incidencias en categorías estándar
 */
export type IncidenciaBucket = 'pendiente' | 'devuelto' | 'en_curso' | 'finalizado' | 'resuelto';

export function bucketIncidencia(estado: string): IncidenciaBucket | null {
  const normalized = normalizeText(estado);
  
  if (['pendiente', 'pending', 'todo', 'to do', 'open', 'new'].includes(normalized)) {
    return 'pendiente';
  }
  if (['devuelto', 'returned', 'rejected', 'reopened'].includes(normalized)) {
    return 'devuelto';
  }
  if (['en curso', 'curso', 'in progress', 'progress', 'doing', 'active', 'assigned'].includes(normalized)) {
    return 'en_curso';
  }
  if (['finalizado', 'cerrado', 'done', 'completed', 'finished', 'complete', 'closed'].includes(normalized)) {
    return 'finalizado';
  }
  if (['resuelto', 'resolved', 'fixed', 'solved'].includes(normalized)) {
    return 'resuelto';
  }
  
  return null;
}
