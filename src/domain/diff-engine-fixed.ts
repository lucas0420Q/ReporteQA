/**
 * Motor de diffs corregido con guardias y estructura fija
 */

import { ItemMin, bucketMatriz, bucketIncid, normalize, MatrizBucket, IncidenciaBucket } from './utils-notion';

/**
 * Estructura fija para cambios de matriz de pruebas
 */
export type CambiosMatriz = {
  total: number;
  finalizado: { id: string; titulo: string }[];
  en_curso: { id: string; titulo: string }[];
  pendiente: { id: string; titulo: string }[];
};

/**
 * Estructura fija para cambios de incidencias  
 */
export type CambiosIncidencias = {
  total: number;
  pendiente: { id: string; titulo: string }[];
  devuelto: { id: string; titulo: string }[];
  en_curso: { id: string; titulo: string }[];
  finalizado: { id: string; titulo: string }[];
  resuelto: { id: string; titulo: string }[];
};

/**
 * Resultado de diff para matriz de pruebas
 */
export type DiffMatrizResult = {
  nuevos: number;
  nuevos_pendiente: { id: string; titulo: string; estado: 'Pendiente' }[];
  cambios: CambiosMatriz;
};

/**
 * Resultado de diff para incidencias
 */
export type DiffIncidenciasResult = {
  nuevos: number;
  cambios: CambiosIncidencias;
};

/**
 * Calcula diferencias para matriz de pruebas con guardias correctos
 */
export function diffCasos(ayer: ItemMin[] | null, hoy: ItemMin[]): DiffMatrizResult {
  // Inicializar estructura fija
  const cambios: CambiosMatriz = {
    total: 0,
    finalizado: [],
    en_curso: [],
    pendiente: []
  };
  
  const nuevos_pendiente: { id: string; titulo: string; estado: 'Pendiente' }[] = [];
  let nuevos = 0;

  // Guardia: si no hay snapshot previo (bootstrap), no calcular diffs
  if (!ayer || ayer.length === 0) {
    console.log('   Primer snapshot → no se calculan diffs (modo bootstrap)');
    return { nuevos: 0, nuevos_pendiente: [], cambios };
  }

  // Crear mapa de items previos por ID
  const prevById = new Map(ayer.map(x => [x.id, x]));
  
  for (const item of hoy) {
    const prev = prevById.get(item.id);
    
    if (!prev) {
      // Item nuevo
      nuevos++;
      const bucket = bucketMatriz(item.estado);
      if (bucket === 'pendiente') {
        nuevos_pendiente.push({ 
          id: item.id, 
          titulo: item.titulo, 
          estado: 'Pendiente' 
        });
      }
      continue;
    }
    
    // Verificar cambio de estado
    const estadoPrevNorm = normalize(prev.estado);
    const estadoActualNorm = normalize(item.estado);
    
    if (estadoPrevNorm !== estadoActualNorm) {
      const bucket = bucketMatriz(item.estado);
      if (bucket) {
        // Usar solo las claves existentes (nunca crear claves dinámicas)
        switch (bucket) {
          case 'pendiente':
            cambios.pendiente.push({ id: item.id, titulo: item.titulo });
            break;
          case 'en_curso':
            cambios.en_curso.push({ id: item.id, titulo: item.titulo });
            break;
          case 'finalizado':
            cambios.finalizado.push({ id: item.id, titulo: item.titulo });
            break;
        }
        cambios.total++;
      }
    }
  }
  
  return { nuevos, nuevos_pendiente, cambios };
}

/**
 * Calcula diferencias para incidencias con guardias correctos
 */
export function diffIncidencias(ayer: ItemMin[] | null, hoy: ItemMin[]): DiffIncidenciasResult {
  // Inicializar estructura fija
  const cambios: CambiosIncidencias = {
    total: 0,
    pendiente: [],
    devuelto: [],
    en_curso: [],
    finalizado: [],
    resuelto: []
  };
  
  let nuevos = 0;

  // Guardia: si no hay snapshot previo (bootstrap), no calcular diffs
  if (!ayer || ayer.length === 0) {
    console.log('   Primer snapshot → no se calculan diffs (modo bootstrap)');
    return { nuevos: 0, cambios };
  }

  // Crear mapa de items previos por ID
  const prevById = new Map(ayer.map(x => [x.id, x]));
  
  for (const item of hoy) {
    const prev = prevById.get(item.id);
    
    if (!prev) {
      // Item nuevo
      nuevos++;
      continue;
    }
    
    // Verificar cambio de estado
    const estadoPrevNorm = normalize(prev.estado);
    const estadoActualNorm = normalize(item.estado);
    
    if (estadoPrevNorm !== estadoActualNorm) {
      const bucket = bucketIncid(item.estado);
      if (bucket) {
        // Usar solo las claves existentes (nunca crear claves dinámicas)
        switch (bucket) {
          case 'pendiente':
            cambios.pendiente.push({ id: item.id, titulo: item.titulo });
            break;
          case 'devuelto':
            cambios.devuelto.push({ id: item.id, titulo: item.titulo });
            break;
          case 'en_curso':
            cambios.en_curso.push({ id: item.id, titulo: item.titulo });
            break;
          case 'finalizado':
            cambios.finalizado.push({ id: item.id, titulo: item.titulo });
            break;
          case 'resuelto':
            cambios.resuelto.push({ id: item.id, titulo: item.titulo });
            break;
        }
        cambios.total++;
      }
    }
  }
  
  return { nuevos, cambios };
}

/**
 * Validaciones de consistencia
 */
export function validateMatrizDiff(result: DiffMatrizResult, totalHoy: number): boolean {
  const { cambios, nuevos, nuevos_pendiente } = result;
  
  // La suma de cambios debe ser igual al total
  const sumaChanges = cambios.finalizado.length + cambios.en_curso.length + cambios.pendiente.length;
  if (sumaChanges !== cambios.total) {
    console.warn(`WARN: Suma de cambios (${sumaChanges}) ≠ total (${cambios.total})`);
    return false;
  }
  
  // Los nuevos pendientes no pueden ser más que los nuevos totales
  if (nuevos_pendiente.length > nuevos) {
    console.warn(`WARN: Nuevos pendientes (${nuevos_pendiente.length}) > nuevos totales (${nuevos})`);
    return false;
  }
  
  return true;
}

export function validateIncidenciasDiff(result: DiffIncidenciasResult, totalHoy: number): boolean {
  const { cambios, nuevos } = result;
  
  // La suma de cambios debe ser igual al total
  const sumaChanges = cambios.pendiente.length + cambios.devuelto.length + 
                      cambios.en_curso.length + cambios.finalizado.length + 
                      cambios.resuelto.length;
  if (sumaChanges !== cambios.total) {
    console.warn(`WARN: Suma de cambios (${sumaChanges}) ≠ total (${cambios.total})`);
    return false;
  }
  
  return true;
}