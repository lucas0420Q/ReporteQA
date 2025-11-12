import {
  ProjectSnapshot,
  MinimalItem,
  ProjectSnapshotSchema,
} from './types.js';
import { format } from 'date-fns';
import crypto from 'crypto';

/**
 * Construye un snapshot de un proyecto para un día específico
 */
export function buildSnapshot(
  projectName: string,
  casos: MinimalItem[],
  incidencias: MinimalItem[],
  dateISO?: string
): ProjectSnapshot {
  const snapshot: ProjectSnapshot = {
    projectName: projectName.trim(),
    dateISO: dateISO || new Date().toISOString(),
    items: [...casos, ...incidencias].sort((a, b) => a.id.localeCompare(b.id)),
  };

  // Validar el snapshot antes de retornarlo
  return ProjectSnapshotSchema.parse(snapshot);
}

/**
 * Valida la integridad de un snapshot verificando los hashes
 */
export function validateSnapshotIntegrity(snapshot: ProjectSnapshot): {
  isValid: boolean;
  invalidItems: string[];
  errors: string[];
} {
  const errors: string[] = [];
  const invalidItems: string[] = [];

  // Validar estructura básica
  try {
    ProjectSnapshotSchema.parse(snapshot);
  } catch (error) {
    errors.push(`Estructura de snapshot inválida: ${
      error instanceof Error ? error.message : 'Error desconocido'
    }`);
    return { isValid: false, invalidItems, errors };
  }

  // Validar hashes de items
  for (const item of snapshot.items) {
    const expectedHash = createItemHash({
      id: item.id,
      title: item.title,
      status: item.status,
      lastEdited: item.lastEdited,
      type: item.type,
    });

    if (item.hash !== expectedHash) {
      invalidItems.push(item.id);
      errors.push(
        `Hash inválido para item ${item.id}: esperado ${expectedHash}, encontrado ${item.hash}`
      );
    }
  }

  // Verificar duplicados
  const ids = snapshot.items.map(item => item.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    errors.push(`IDs duplicados encontrados: ${duplicates.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    invalidItems,
    errors,
  };
}

/**
 * Crea estadísticas resumidas de un snapshot
 */
export function getSnapshotStats(snapshot: ProjectSnapshot): {
  totalItems: number;
  casosPorEstado: Record<string, number>;
  incidenciasPorEstado: Record<string, number>;
  ultimaModificacion: string;
} {
  const casos = snapshot.items.filter(item => item.type === 'CASO');
  const incidencias = snapshot.items.filter(item => item.type === 'INCIDENCIA');

  const casosPorEstado: Record<string, number> = {};
  const incidenciasPorEstado: Record<string, number> = {};

  casos.forEach(caso => {
    casosPorEstado[caso.status] = (casosPorEstado[caso.status] || 0) + 1;
  });

  incidencias.forEach(incidencia => {
    incidenciasPorEstado[incidencia.status] = 
      (incidenciasPorEstado[incidencia.status] || 0) + 1;
  });

  // Encontrar la última modificación
  const ultimaModificacion = snapshot.items
    .map(item => item.lastEdited)
    .sort()
    .pop() || snapshot.dateISO;

  return {
    totalItems: snapshot.items.length,
    casosPorEstado,
    incidenciasPorEstado,
    ultimaModificacion,
  };
}

/**
 * Filtra un snapshot para incluir solo items modificados después de una fecha
 */
export function filterSnapshotByDate(
  snapshot: ProjectSnapshot,
  fromDateISO: string
): ProjectSnapshot {
  const fromDate = new Date(fromDateISO);
  
  const filteredItems = snapshot.items.filter(item => {
    const itemDate = new Date(item.lastEdited);
    return itemDate >= fromDate;
  });

  return buildSnapshot(
    snapshot.projectName,
    filteredItems.filter(item => item.type === 'CASO'),
    filteredItems.filter(item => item.type === 'INCIDENCIA'),
    snapshot.dateISO
  );
}

/**
 * Genera un filename consistente para un snapshot
 */
export function generateSnapshotFilename(
  projectName: string,
  dateISO: string,
  extension = 'json'
): string {
  const date = format(new Date(dateISO), 'yyyy-MM-dd');
  const safeName = projectName
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .toLowerCase();
  
  return `${safeName}_${date}.${extension}`;
}

/**
 * Crea un hash SHA-256 para un item (función helper)
 */
function createItemHash(item: Omit<MinimalItem, 'hash'>): string {
  const data = `${item.id}|${item.title}|${item.status}|${item.lastEdited}|${item.type}`;
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Compara dos snapshots y retorna si son equivalentes
 */
export function compareSnapshots(
  snapshot1: ProjectSnapshot,
  snapshot2: ProjectSnapshot
): {
  areEqual: boolean;
  differences: {
    projectName: boolean;
    itemCount: boolean;
    itemChanges: string[];
  };
} {
  const differences = {
    projectName: snapshot1.projectName !== snapshot2.projectName,
    itemCount: snapshot1.items.length !== snapshot2.items.length,
    itemChanges: [] as string[],
  };

  // Crear mapas para comparación eficiente
  const items1Map = new Map(snapshot1.items.map(item => [item.id, item]));
  const items2Map = new Map(snapshot2.items.map(item => [item.id, item]));

  // Encontrar items que cambiaron o son nuevos/eliminados
  const allIds = new Set([...items1Map.keys(), ...items2Map.keys()]);
  
  for (const id of allIds) {
    const item1 = items1Map.get(id);
    const item2 = items2Map.get(id);

    if (!item1 && item2) {
      differences.itemChanges.push(`Nuevo: ${id}`);
    } else if (item1 && !item2) {
      differences.itemChanges.push(`Eliminado: ${id}`);
    } else if (item1 && item2 && item1.hash !== item2.hash) {
      differences.itemChanges.push(`Modificado: ${id}`);
    }
  }

  const areEqual = 
    !differences.projectName && 
    !differences.itemCount && 
    differences.itemChanges.length === 0;

  return { areEqual, differences };
}

/**
 * Convierte un snapshot a formato compacto (solo IDs y hashes)
 */
export function toCompactSnapshot(snapshot: ProjectSnapshot): {
  projectName: string;
  dateISO: string;
  itemHashes: Record<string, string>;
  totalItems: number;
} {
  const itemHashes: Record<string, string> = {};
  
  snapshot.items.forEach(item => {
    itemHashes[item.id] = item.hash;
  });

  return {
    projectName: snapshot.projectName,
    dateISO: snapshot.dateISO,
    itemHashes,
    totalItems: snapshot.items.length,
  };
}