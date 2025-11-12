/**
 * Generador de archivos TXT organizados en carpetas para el gerente
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

export type ReporteData = {
  fecha: string;
  zona_horaria: string;
  proyectos: Array<{
    nombre: string;
    matriz_pruebas: {
      nuevos: number;
      nuevos_CP: Array<{ id: string; titulo: string; estado: string }>;
      cambios: {
        total: number;
        pendiente: Array<{ id: string; titulo: string }>;
        en_curso: Array<{ id: string; titulo: string }>;
        finalizado: Array<{ id: string; titulo: string }>;
      };
    };
    incidencias: {
      nuevos: number;
      cambios: {
        total: number;
        pendiente: Array<{ id: string; titulo: string }>;
        devuelto: Array<{ id: string; titulo: string }>;
        en_curso: Array<{ id: string; titulo: string }>;
        finalizado: Array<{ id: string; titulo: string }>;
        resuelto: Array<{ id: string; titulo: string }>;
      };
    };
  }>;
};

export class GeneradorTxtParaGerente {
  private readonly reportesDir = './reportes-gerencia';
  
  constructor() {
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!existsSync(this.reportesDir)) {
      mkdirSync(this.reportesDir, { recursive: true });
    }
  }

  /**
   * Genera archivos TXT organizados desde el JSON
   */
  async generarReporteTxt(archivoJson?: string): Promise<string> {
    // Buscar el archivo JSON más reciente si no se especifica
    let datos: ReporteData;
    
    if (archivoJson && existsSync(archivoJson)) {
      datos = JSON.parse(readFileSync(archivoJson, 'utf8'));
    } else {
      // Buscar el archivo más reciente en reportes/
      const rutaJson = this.buscarArchivoJsonReciente();
      if (!rutaJson) {
        throw new Error('No se encontró archivo JSON de reporte');
      }
      datos = JSON.parse(readFileSync(rutaJson, 'utf8'));
    }

    console.log(`📊 Generando reporte TXT para gerencia - ${datos.fecha}`);

    // Crear directorio para esta fecha
    const dirFecha = join(this.reportesDir, `reporte-${datos.fecha}`);
    if (!existsSync(dirFecha)) {
      mkdirSync(dirFecha, { recursive: true });
    }

    // 1. Resumen ejecutivo
    this.generarResumenEjecutivo(datos, dirFecha);

    // 2. Detalle por proyecto
    this.generarDetalleProyectos(datos, dirFecha);

    // 3. Archivos individuales por proyecto
    this.generarArchivosIndividuales(datos, dirFecha);

    console.log(`✅ Reporte TXT generado en: ${dirFecha}`);
    return dirFecha;
  }

  private generarResumenEjecutivo(datos: ReporteData, dirFecha: string): void {
    const estadisticas = this.calcularEstadisticas(datos);
    
    const contenido = `
REPORTE EJECUTIVO QA - ${datos.fecha}
===============================================

📅 FECHA: ${datos.fecha}
🌍 ZONA HORARIA: ${datos.zona_horaria}
📊 PROYECTOS ACTIVOS: ${datos.proyectos.length}

📈 ESTADÍSTICAS GENERALES:
─────────────────────────────
• Total Casos de Prueba: ${estadisticas.totalCasos}
• Total Incidencias: ${estadisticas.totalIncidencias}
• Proyectos con Actividad: ${estadisticas.proyectosConActividad}

🎯 CASOS DE PRUEBA:
─────────────────────────────
• Pendientes: ${estadisticas.casosPendientes}
• En Curso: ${estadisticas.casosEnCurso}
• Finalizados: ${estadisticas.casosFinalizados}

🐛 INCIDENCIAS:
─────────────────────────────
• Pendientes: ${estadisticas.incidenciasPendientes}
• En Curso: ${estadisticas.incidenciasEnCurso}  
• Resueltas: ${estadisticas.incidenciasResueltas}
• Finalizadas: ${estadisticas.incidenciasFinalizadas}

📋 TOP 5 PROYECTOS POR ACTIVIDAD:
─────────────────────────────────
${estadisticas.top5Proyectos.map((p, i) => `${i + 1}. ${p.nombre}: ${p.totalActividad} items`).join('\n')}

🚨 PROYECTOS QUE REQUIEREN ATENCIÓN:
──────────────────────────────────────
${estadisticas.proyectosAtencion.length > 0 
  ? estadisticas.proyectosAtencion.map(p => `• ${p.nombre}: ${p.razon}`).join('\n')
  : '• Todos los proyectos están en buen estado'
}

`.trim();

    writeFileSync(join(dirFecha, '00-RESUMEN-EJECUTIVO.txt'), contenido, 'utf8');
  }

  private generarDetalleProyectos(datos: ReporteData, dirFecha: string): void {
    const contenido = `
DETALLE COMPLETO POR PROYECTO - ${datos.fecha}
=============================================

${datos.proyectos.map((proyecto, index) => `
${index + 1}. ${proyecto.nombre.toUpperCase()}
${'='.repeat(proyecto.nombre.length + 3)}

📋 MATRIZ DE PRUEBAS:
─────────────────────
• Total Casos: ${proyecto.matriz_pruebas.nuevos}
• Pendientes: ${proyecto.matriz_pruebas.cambios.pendiente.length}
• En Curso: ${proyecto.matriz_pruebas.cambios.en_curso.length}  
• Finalizados: ${proyecto.matriz_pruebas.cambios.finalizado.length}

🐛 INCIDENCIAS:
──────────────
• Total: ${proyecto.incidencias.nuevos}
• Pendientes: ${proyecto.incidencias.cambios.pendiente.length}
• En Curso: ${proyecto.incidencias.cambios.en_curso.length}
• Resueltas: ${proyecto.incidencias.cambios.resuelto.length}
• Finalizadas: ${proyecto.incidencias.cambios.finalizado.length}

📊 ESTADO GENERAL:
─────────────────
${this.evaluarEstadoProyecto(proyecto)}

`).join('\n')}`.trim();

    writeFileSync(join(dirFecha, '01-DETALLE-PROYECTOS.txt'), contenido, 'utf8');
  }

  private generarArchivosIndividuales(datos: ReporteData, dirFecha: string): void {
    // Crear subdirectorio para proyectos individuales
    const dirProyectos = join(dirFecha, 'proyectos-individuales');
    if (!existsSync(dirProyectos)) {
      mkdirSync(dirProyectos, { recursive: true });
    }

    datos.proyectos.forEach(proyecto => {
      const nombreArchivo = proyecto.nombre.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
      
      const contenido = `
PROYECTO: ${proyecto.nombre}
${'='.repeat(proyecto.nombre.length + 10)}
Fecha: ${datos.fecha}

🎯 RESUMEN:
──────────
• Casos de Prueba: ${proyecto.matriz_pruebas.nuevos}
• Incidencias: ${proyecto.incidencias.nuevos}
• Estado: ${this.evaluarEstadoProyecto(proyecto)}

📋 CASOS DE PRUEBA DETALLADOS:
═════════════════════════════

⏳ PENDIENTES (${proyecto.matriz_pruebas.cambios.pendiente.length}):
${proyecto.matriz_pruebas.cambios.pendiente.length > 0
  ? proyecto.matriz_pruebas.cambios.pendiente.map(c => `• ${c.id} - ${c.titulo}`).join('\n')
  : '• No hay casos pendientes'
}

🔄 EN CURSO (${proyecto.matriz_pruebas.cambios.en_curso.length}):
${proyecto.matriz_pruebas.cambios.en_curso.length > 0
  ? proyecto.matriz_pruebas.cambios.en_curso.map(c => `• ${c.id} - ${c.titulo}`).join('\n')
  : '• No hay casos en curso'
}

✅ FINALIZADOS (${proyecto.matriz_pruebas.cambios.finalizado.length}):
${proyecto.matriz_pruebas.cambios.finalizado.length > 0 
  ? proyecto.matriz_pruebas.cambios.finalizado.map(c => `• ${c.id} - ${c.titulo}`).join('\n')
  : '• No hay casos finalizados'
}

🐛 INCIDENCIAS DETALLADAS:
═════════════════════════

⏳ PENDIENTES (${proyecto.incidencias.cambios.pendiente.length}):
${proyecto.incidencias.cambios.pendiente.length > 0
  ? proyecto.incidencias.cambios.pendiente.map(i => `• ${i.id} - ${i.titulo}`).join('\n')
  : '• No hay incidencias pendientes'
}

� DEVUELTO (${proyecto.incidencias.cambios.devuelto ? proyecto.incidencias.cambios.devuelto.length : 0}):
${proyecto.incidencias.cambios.devuelto && proyecto.incidencias.cambios.devuelto.length > 0
  ? proyecto.incidencias.cambios.devuelto.map(i => `• ${i.id} - ${i.titulo}`).join('\n')
  : '• No hay incidencias devueltas'
}

�🔄 EN CURSO (${proyecto.incidencias.cambios.en_curso.length}):
${proyecto.incidencias.cambios.en_curso.length > 0
  ? proyecto.incidencias.cambios.en_curso.map(i => `• ${i.id} - ${i.titulo}`).join('\n')
  : '• No hay incidencias en curso'
}

🏁 FINALIZADAS (${proyecto.incidencias.cambios.finalizado ? proyecto.incidencias.cambios.finalizado.length : 0}):
${proyecto.incidencias.cambios.finalizado && proyecto.incidencias.cambios.finalizado.length > 0
  ? proyecto.incidencias.cambios.finalizado.map(i => `• ${i.id} - ${i.titulo}`).join('\n')
  : '• No hay incidencias finalizadas'
}

✅ RESUELTAS (${proyecto.incidencias.cambios.resuelto.length}):
${proyecto.incidencias.cambios.resuelto.length > 0
  ? proyecto.incidencias.cambios.resuelto.map(i => `• ${i.id} - ${i.titulo}`).join('\n')
  : '• No hay incidencias resueltas'
}

`.trim();

      writeFileSync(join(dirProyectos, `${nombreArchivo}.txt`), contenido, 'utf8');
    });
  }

  private calcularEstadisticas(datos: ReporteData) {
    const stats = {
      totalCasos: 0,
      totalIncidencias: 0,
      casosFinalizados: 0,
      casosEnCurso: 0,
      casosPendientes: 0,
      incidenciasPendientes: 0,
      incidenciasEnCurso: 0,
      incidenciasResueltas: 0,
      incidenciasFinalizadas: 0,
      proyectosConActividad: 0,
      top5Proyectos: [] as Array<{ nombre: string; totalActividad: number }>,
      proyectosAtencion: [] as Array<{ nombre: string; razon: string }>
    };

    const actividadProyectos: Array<{ nombre: string; totalActividad: number }> = [];

    datos.proyectos.forEach(proyecto => {
      const totalActividad = proyecto.matriz_pruebas.nuevos + proyecto.incidencias.nuevos;
      
      stats.totalCasos += proyecto.matriz_pruebas.nuevos;
      stats.totalIncidencias += proyecto.incidencias.nuevos;
      stats.casosFinalizados += proyecto.matriz_pruebas.cambios.finalizado.length;
      stats.casosEnCurso += proyecto.matriz_pruebas.cambios.en_curso.length;
      stats.casosPendientes += proyecto.matriz_pruebas.cambios.pendiente.length;
      stats.incidenciasPendientes += proyecto.incidencias.cambios.pendiente.length;
      stats.incidenciasEnCurso += proyecto.incidencias.cambios.en_curso.length;
      stats.incidenciasResueltas += proyecto.incidencias.cambios.resuelto.length;
      stats.incidenciasFinalizadas += proyecto.incidencias.cambios.finalizado.length;

      if (totalActividad > 0) {
        stats.proyectosConActividad++;
        actividadProyectos.push({ nombre: proyecto.nombre, totalActividad });
      }

      // Detectar proyectos que necesitan atención
      const incidenciasAltas = proyecto.incidencias.cambios.pendiente.length + proyecto.incidencias.cambios.en_curso.length;
      if (incidenciasAltas > 10) {
        stats.proyectosAtencion.push({
          nombre: proyecto.nombre,
          razon: `${incidenciasAltas} incidencias activas`
        });
      }
    });

    // Top 5 proyectos por actividad
    stats.top5Proyectos = actividadProyectos
      .sort((a, b) => b.totalActividad - a.totalActividad)
      .slice(0, 5);

    return stats;
  }

  private evaluarEstadoProyecto(proyecto: any): string {
    const totalCasos = proyecto.matriz_pruebas.nuevos;
    const casosFinalizados = proyecto.matriz_pruebas.cambios.finalizado.length;
    const incidenciasActivas = proyecto.incidencias.cambios.pendiente.length + proyecto.incidencias.cambios.en_curso.length;

    if (totalCasos === 0) return '🔘 Sin actividad de testing';
    
    const porcentajeCompleto = totalCasos > 0 ? (casosFinalizados / totalCasos) * 100 : 0;
    
    if (porcentajeCompleto >= 80 && incidenciasActivas <= 5) return '🟢 Excelente estado';
    if (porcentajeCompleto >= 60 && incidenciasActivas <= 10) return '🟡 En progreso normal';
    if (incidenciasActivas > 15) return '🔴 Requiere atención - Muchas incidencias';
    if (porcentajeCompleto < 40) return '🟠 Progreso lento';
    
    return '🟡 En desarrollo';
  }

  private buscarArchivoJsonReciente(): string | null {
    const dirReportes = './reportes';
    if (!existsSync(dirReportes)) return null;

    // Buscar archivos reporte-real-*.json
    const archivos = readdirSync(dirReportes)
      .filter((file: string) => file.startsWith('reporte-real-') && file.endsWith('.json'))
      .sort()
      .reverse();

    return archivos.length > 0 ? join(dirReportes, archivos[0]) : null;
  }
}