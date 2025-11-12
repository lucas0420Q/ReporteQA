import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { ProjectSnapshot, ValidationError } from '../domain/types.js';
import { validateSnapshotIntegrity } from '../domain/snapshot.js';

/**
 * Maneja el almacenamiento local de snapshots y reportes
 */
export class FileSystemStorage {
  constructor(private readonly baseDir: string = './data') {}

  /**
   * Lee un snapshot desde el sistema de archivos
   */
  public async readSnapshot(
    projectName: string,
    dateISO: string
  ): Promise<ProjectSnapshot | null> {
    try {
      const filename = this.generateSnapshotPath(projectName, dateISO);
      const content = await fs.readFile(filename, 'utf-8');
      const snapshot = JSON.parse(content) as ProjectSnapshot;

      // Validar integridad del snapshot
      const validation = validateSnapshotIntegrity(snapshot);
      if (!validation.isValid) {
        throw new ValidationError(
          `Snapshot corrupto: ${validation.errors.join(', ')}`,
          validation
        );
      }

      return snapshot;
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return null; // Archivo no existe
      }
      throw error;
    }
  }

  /**
   * Guarda un snapshot en el sistema de archivos
   */
  public async saveSnapshot(snapshot: ProjectSnapshot): Promise<void> {
    // Validar integridad antes de guardar
    const validation = validateSnapshotIntegrity(snapshot);
    if (!validation.isValid) {
      throw new ValidationError(
        `No se puede guardar snapshot corrupto: ${validation.errors.join(
          ', '
        )}`,
        validation
      );
    }

    const filename = this.generateSnapshotPath(
      snapshot.projectName,
      snapshot.dateISO
    );

    await this.ensureDirectoryExists(dirname(filename));
    await this.writeFileSafe(filename, JSON.stringify(snapshot, null, 2));

    console.info(
      `Snapshot guardado: ${snapshot.projectName} (${snapshot.items.length} items)`
    );
  }

  /**
   * Lista todos los snapshots disponibles para un proyecto
   */
  public async listSnapshots(projectName: string): Promise<string[]> {
    try {
      const projectDir = join(this.baseDir, 'snapshots', this.sanitizeName(projectName));
      const files = await fs.readdir(projectDir);
      
      return files
        .filter((file: string) => file.endsWith('.json'))
        .map((file: string) => file.replace('.json', ''))
        .sort()
        .reverse(); // Más recientes primero
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Elimina snapshots antiguos basado en una política de retención
   */
  public async cleanupOldSnapshots(
    projectName: string,
    keepDays = 30
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);

    const snapshots = await this.listSnapshots(projectName);
    let deletedCount = 0;

    for (const dateStr of snapshots) {
      const snapshotDate = new Date(dateStr);
      if (snapshotDate < cutoffDate) {
        try {
          const filename = this.generateSnapshotPath(projectName, dateStr);
          await fs.unlink(filename);
          deletedCount++;
        } catch (error) {
          console.warn(
            `Error eliminando snapshot ${dateStr}:`,
            error instanceof Error ? error.message : 'Error desconocido'
          );
        }
      }
    }

    if (deletedCount > 0) {
      console.info(
        `Eliminados ${deletedCount} snapshots antiguos de ${projectName}`
      );
    }

    return deletedCount;
  }

  /**
   * Guarda un reporte en formato Markdown
   */
  public async saveReport(
    content: string,
    projectName: string,
    dateISO: string,
    format: 'md' | 'csv' = 'md'
  ): Promise<string> {
    const filename = this.generateReportPath(projectName, dateISO, format);
    await this.ensureDirectoryExists(dirname(filename));
    await this.writeFileSafe(filename, content);

    console.info(`Reporte guardado: ${filename}`);
    return filename;
  }

  /**
   * Guarda un índice consolidado de reportes
   */
  public async saveReportIndex(
    content: string,
    dateISO: string
  ): Promise<string> {
    const filename = this.generateIndexPath(dateISO);
    await this.ensureDirectoryExists(dirname(filename));
    await this.writeFileSafe(filename, content);

    console.info(`Índice de reportes guardado: ${filename}`);
    return filename;
  }

  /**
   * Crea el directorio si no existe
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true, mode: 0o700 });
    } catch (error) {
      if (
        !(
          error instanceof Error &&
          'code' in error &&
          error.code === 'EEXIST'
        )
      ) {
        throw error;
      }
    }
  }

  /**
   * Escribe un archivo de forma segura (atómico)
   */
  private async writeFileSafe(
    filePath: string,
    content: string
  ): Promise<void> {
    const tempPath = filePath + '.tmp';
    
    try {
      await fs.writeFile(tempPath, content, { 
        encoding: 'utf-8', 
        mode: 0o600 
      });
      await fs.rename(tempPath, filePath);
    } catch (error) {
      // Limpiar archivo temporal si existe
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignorar errores de limpieza
      }
      throw error;
    }
  }

  /**
   * Genera la ruta para un snapshot
   */
  private generateSnapshotPath(projectName: string, dateISO: string): string {
    const date = dateISO.split('T')[0]; // Obtener solo la fecha
    const safeName = this.sanitizeName(projectName);
    return join(this.baseDir, 'snapshots', safeName, `${date}.json`);
  }

  /**
   * Genera la ruta para un reporte
   */
  private generateReportPath(
    projectName: string,
    dateISO: string,
    format: string
  ): string {
    const date = dateISO.split('T')[0];
    const safeName = this.sanitizeName(projectName);
    return join(this.baseDir, 'reports', date, `${safeName}.${format}`);
  }

  /**
   * Genera la ruta para el índice de reportes
   */
  private generateIndexPath(dateISO: string): string {
    const date = dateISO.split('T')[0];
    return join(this.baseDir, 'reports', date, 'index.md');
  }

  /**
   * Sanitiza un nombre para uso como nombre de archivo
   */
  private sanitizeName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .toLowerCase()
      .substring(0, 50); // Limitar longitud
  }

  /**
   * Obtiene estadísticas del almacenamiento
   */
  public async getStorageStats(): Promise<{
    totalSnapshots: number;
    totalReports: number;
    diskUsageMB: number;
    oldestSnapshot: string | null;
    newestSnapshot: string | null;
  }> {
    try {
      const snapshotsDir = join(this.baseDir, 'snapshots');
      const reportsDir = join(this.baseDir, 'reports');

      let totalSnapshots = 0;
      let totalReports = 0;
      let totalSize = 0;
      let oldestSnapshot: string | null = null;
      let newestSnapshot: string | null = null;

      // Contar snapshots
      try {
        const projects = await fs.readdir(snapshotsDir);
        for (const project of projects) {
          const projectDir = join(snapshotsDir, project);
          const stats = await fs.stat(projectDir);
          if (stats.isDirectory()) {
            const files = await fs.readdir(projectDir);
            for (const file of files) {
              if (file.endsWith('.json')) {
                totalSnapshots++;
                const filePath = join(projectDir, file);
                const fileStats = await fs.stat(filePath);
                totalSize += fileStats.size;

                const date = file.replace('.json', '');
                if (!oldestSnapshot || date < oldestSnapshot) {
                  oldestSnapshot = date;
                }
                if (!newestSnapshot || date > newestSnapshot) {
                  newestSnapshot = date;
                }
              }
            }
          }
        }
      } catch {
        // Directorio no existe, continuar
      }

      // Contar reportes
      try {
        const reportDates = await fs.readdir(reportsDir);
        for (const date of reportDates) {
          const dateDir = join(reportsDir, date);
          const stats = await fs.stat(dateDir);
          if (stats.isDirectory()) {
            const files = await fs.readdir(dateDir);
            totalReports += files.filter(
              (file: string) => file.endsWith('.md') || file.endsWith('.csv')
            ).length;

            for (const file of files) {
              const filePath = join(dateDir, file);
              const fileStats = await fs.stat(filePath);
              totalSize += fileStats.size;
            }
          }
        }
      } catch {
        // Directorio no existe, continuar
      }

      return {
        totalSnapshots,
        totalReports,
        diskUsageMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
        oldestSnapshot,
        newestSnapshot,
      };
    } catch (error) {
      console.warn(
        'Error obteniendo estadísticas de almacenamiento:',
        error instanceof Error ? error.message : 'Error desconocido'
      );
      return {
        totalSnapshots: 0,
        totalReports: 0,
        diskUsageMB: 0,
        oldestSnapshot: null,
        newestSnapshot: null,
      };
    }
  }
}