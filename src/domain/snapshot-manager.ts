/**
 * Sistema de Snapshots para comparaciones diarias y semanales
 * Guarda el estado completo de items para poder comparar cambios
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { ItemMin } from './utils-notion.js';
import { formatearFecha, parsearFecha, obtenerDiaHabilAnterior, obtenerFechaDiasHabilesAtras } from './date-utils.js';

export interface SnapshotItem {
  id: string;           // ID extraído (CP-01 → "01")
  titulo: string;       // Título completo
  estado: string;       // Estado actual
  tipo: 'matriz' | 'incidencia';
}

export interface ProyectoSnapshot {
  nombre_proyecto: string;
  fecha_hora: string;
  matriz_pruebas: SnapshotItem[];
  incidencias: SnapshotItem[];
}

export interface SnapshotCompleto {
  fecha_hora: string;
  zona_horaria: string;
  proyectos: ProyectoSnapshot[];
}

export class SnapshotManager {
  private readonly snapshotsDir = './snapshots';

  constructor() {
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!existsSync(this.snapshotsDir)) {
      mkdirSync(this.snapshotsDir, { recursive: true });
    }
  }

  /**
   * Guarda un snapshot completo de todos los proyectos
   */
  guardarSnapshot(snapshot: SnapshotCompleto): void {
    // Extraer solo la fecha (YYYY-MM-DD) del fecha_hora
    const fecha = snapshot.fecha_hora.split(' ')[0];
    const nombreArchivo = `snapshot-${fecha}.json`;
    const rutaArchivo = join(this.snapshotsDir, nombreArchivo);
    
    writeFileSync(rutaArchivo, JSON.stringify(snapshot, null, 2), 'utf8');
    console.log(`   📸 Snapshot guardado: ${rutaArchivo}`);
  }

  /**
   * Carga un snapshot de una fecha específica
   */
  cargarSnapshot(fecha: string): SnapshotCompleto | null {
    const nombreArchivo = `snapshot-${fecha}.json`;
    const rutaArchivo = join(this.snapshotsDir, nombreArchivo);
    
    if (!existsSync(rutaArchivo)) {
      return null;
    }

    try {
      const contenido = readFileSync(rutaArchivo, 'utf8');
      return JSON.parse(contenido) as SnapshotCompleto;
    } catch (error) {
      console.error(`   [!] Error cargando snapshot ${fecha}:`, (error as Error).message);
      return null;
    }
  }

  /**
   * Busca el snapshot del último día hábil anterior disponible
   */
  buscarSnapshotDiaHabilAnterior(fechaActual?: Date): SnapshotCompleto | null {
    const fecha = fechaActual || new Date();
    let fechaBusqueda = obtenerDiaHabilAnterior(fecha);
    
    // Buscar hasta 10 días hábiles atrás como máximo
    for (let i = 0; i < 10; i++) {
      const fechaStr = formatearFecha(fechaBusqueda);
      const snapshot = this.cargarSnapshot(fechaStr);
      
      if (snapshot) {
        console.log(`   Snapshot encontrado: ${fechaStr}`);
        return snapshot;
      }
      
      fechaBusqueda = obtenerDiaHabilAnterior(fechaBusqueda);
    }
    
    console.log(`   [!] No se encontró snapshot del día hábil anterior`);
    return null;
  }

  /**
   * Busca el snapshot de hace N días hábiles
   */
  buscarSnapshotDiasHabilesAtras(diasHabiles: number, desde?: Date): SnapshotCompleto | null {
    const fechaObjetivo = obtenerFechaDiasHabilesAtras(diasHabiles, desde);
    let fechaBusqueda = fechaObjetivo;
    
    // Buscar en +/- 3 días por si no existe el snapshot exacto
    for (let offset = 0; offset <= 3; offset++) {
      // Primero buscar fecha exacta
      if (offset === 0) {
        const fechaStr = formatearFecha(fechaBusqueda);
        const snapshot = this.cargarSnapshot(fechaStr);
        if (snapshot) {
          console.log(`   Snapshot encontrado (${diasHabiles} días hábiles atrás): ${fechaStr}`);
          return snapshot;
        }
      } else {
        // Buscar antes
        const fechaAntes = new Date(fechaObjetivo);
        fechaAntes.setDate(fechaAntes.getDate() - offset);
        const fechaAntesStr = formatearFecha(fechaAntes);
        const snapshotAntes = this.cargarSnapshot(fechaAntesStr);
        if (snapshotAntes) {
          console.log(`   Snapshot encontrado (aprox ${diasHabiles} días hábiles): ${fechaAntesStr}`);
          return snapshotAntes;
        }
        
        // Buscar después
        const fechaDespues = new Date(fechaObjetivo);
        fechaDespues.setDate(fechaDespues.getDate() + offset);
        const fechaDespuesStr = formatearFecha(fechaDespues);
        const snapshotDespues = this.cargarSnapshot(fechaDespuesStr);
        if (snapshotDespues) {
          console.log(`   Snapshot encontrado (aprox ${diasHabiles} días hábiles): ${fechaDespuesStr}`);
          return snapshotDespues;
        }
      }
    }
    
    console.log(`   [!] No se encontró snapshot de hace ${diasHabiles} días hábiles`);
    return null;
  }

  /**
   * Lista todos los snapshots disponibles
   */
  listarSnapshots(): string[] {
    if (!existsSync(this.snapshotsDir)) {
      return [];
    }

    const archivos = readdirSync(this.snapshotsDir);
    return archivos
      .filter(archivo => archivo.startsWith('snapshot-') && archivo.endsWith('.json'))
      .map(archivo => archivo.replace('snapshot-', '').replace('.json', ''))
      .sort();
  }

  /**
   * Convierte ItemMin a SnapshotItem
   */
  static convertirASnapshotItem(
    item: ItemMin, 
    tipo: 'matriz' | 'incidencia',
    extraerId: (titulo: string) => string
  ): SnapshotItem {
    return {
      id: extraerId(item.titulo),
      titulo: item.titulo,
      estado: item.estado,
      tipo
    };
  }
}
