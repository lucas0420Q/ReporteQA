import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { ProjectSnapshot, ValidationError } from '../domain/types.js';
import { validateSnapshotIntegrity } from '../domain/snapshot.js';
import { config } from '../config.js';

/**
 * Maneja el almacenamiento en S3 con cifrado KMS
 */
export class S3Storage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly kmsKeyId?: string;

  constructor(
    bucket: string,
    region?: string,
    kmsKeyId?: string
  ) {
    this.bucket = bucket;
    this.kmsKeyId = kmsKeyId || undefined;
    this.client = new S3Client({
      region: region || process.env['AWS_REGION'] || config.defaults.awsRegion,
    });
  }

  /**
   * Sube un snapshot a S3 con cifrado KMS
   */
  public async saveSnapshot(snapshot: ProjectSnapshot): Promise<string> {
    // Validar integridad antes de subir
    const validation = validateSnapshotIntegrity(snapshot);
    if (!validation.isValid) {
      throw new ValidationError(
        `No se puede subir snapshot corrupto: ${validation.errors.join(', ')}`,
        validation
      );
    }

    const key = this.generateSnapshotKey(
      snapshot.projectName,
      snapshot.dateISO
    );

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: JSON.stringify(snapshot, null, 2),
      ContentType: 'application/json',
      ServerSideEncryption: config.s3.serverSideEncryption,
      SSEKMSKeyId: this.kmsKeyId,
      ChecksumAlgorithm: config.s3.checksumAlgorithm,
      StorageClass: config.s3.storageClass,
      Metadata: {
        projectName: snapshot.projectName,
        dateISO: snapshot.dateISO,
        itemCount: snapshot.items.length.toString(),
        uploadedAt: new Date().toISOString(),
      },
    });

    try {
      await this.client.send(command);
      console.info(
        `Snapshot subido a S3: ${this.bucket}/${key} (${snapshot.items.length} items)`
      );
      return key;
    } catch (error) {
      throw new Error(
        `Error subiendo snapshot a S3: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`
      );
    }
  }

  /**
   * Descarga un snapshot desde S3
   */
  public async readSnapshot(
    projectName: string,
    dateISO: string
  ): Promise<ProjectSnapshot | null> {
    const key = this.generateSnapshotKey(projectName, dateISO);

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      const response = await this.client.send(command);
      
      if (!response.Body) {
        return null;
      }

      const content = await this.streamToString(response.Body);
      const snapshot = JSON.parse(content) as ProjectSnapshot;

      // Validar integridad del snapshot descargado
      const validation = validateSnapshotIntegrity(snapshot);
      if (!validation.isValid) {
        throw new ValidationError(
          `Snapshot corrupto en S3: ${validation.errors.join(', ')}`,
          validation
        );
      }

      return snapshot;
    } catch (error) {
      if (error instanceof Error && error.name === 'NoSuchKey') {
        return null; // Archivo no existe
      }
      throw error;
    }
  }

  /**
   * Sube un reporte a S3
   */
  public async saveReport(
    content: string,
    projectName: string,
    dateISO: string,
    format: 'md' | 'csv' = 'md'
  ): Promise<string> {
    const key = this.generateReportKey(projectName, dateISO, format);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: content,
      ContentType: format === 'md' ? 'text/markdown' : 'text/csv',
      ServerSideEncryption: config.s3.serverSideEncryption,
      SSEKMSKeyId: this.kmsKeyId,
      ChecksumAlgorithm: config.s3.checksumAlgorithm,
      StorageClass: config.s3.storageClass,
      Metadata: {
        projectName,
        dateISO,
        format,
        uploadedAt: new Date().toISOString(),
      },
    });

    try {
      await this.client.send(command);
      console.info(`Reporte subido a S3: ${this.bucket}/${key}`);
      return key;
    } catch (error) {
      throw new Error(
        `Error subiendo reporte a S3: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`
      );
    }
  }

  /**
   * Sube un índice consolidado de reportes
   */
  public async saveReportIndex(
    content: string,
    dateISO: string
  ): Promise<string> {
    const key = this.generateIndexKey(dateISO);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: content,
      ContentType: 'text/markdown',
      ServerSideEncryption: config.s3.serverSideEncryption,
      SSEKMSKeyId: this.kmsKeyId,
      ChecksumAlgorithm: config.s3.checksumAlgorithm,
      StorageClass: config.s3.storageClass,
      Metadata: {
        type: 'report-index',
        dateISO,
        uploadedAt: new Date().toISOString(),
      },
    });

    try {
      await this.client.send(command);
      console.info(`Índice de reportes subido a S3: ${this.bucket}/${key}`);
      return key;
    } catch (error) {
      throw new Error(
        `Error subiendo índice a S3: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`
      );
    }
  }

  /**
   * Lista snapshots disponibles para un proyecto
   */
  public async listSnapshots(projectName: string): Promise<string[]> {
    const prefix = `snapshots/${this.sanitizeName(projectName)}/`;

    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
      MaxKeys: 1000,
    });

    try {
      const response = await this.client.send(command);
      
      if (!response.Contents) {
        return [];
      }

      return response.Contents
        .filter(obj => obj.Key && obj.Key.endsWith('.json'))
        .map(obj => {
          const key = obj.Key!;
          const filename = key.split('/').pop()!;
          return filename.replace('.json', '');
        })
        .sort()
        .reverse(); // Más recientes primero
    } catch (error) {
      throw new Error(
        `Error listando snapshots en S3: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`
      );
    }
  }

  /**
   * Elimina snapshots antiguos basado en política de retención
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
          const key = this.generateSnapshotKey(projectName, dateStr);
          const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
          });

          await this.client.send(command);
          deletedCount++;
        } catch (error) {
          console.warn(
            `Error eliminando snapshot ${dateStr} de S3:`,
            error instanceof Error ? error.message : 'Error desconocido'
          );
        }
      }
    }

    if (deletedCount > 0) {
      console.info(
        `Eliminados ${deletedCount} snapshots antiguos de ${projectName} en S3`
      );
    }

    return deletedCount;
  }

  /**
   * Obtiene estadísticas del bucket
   */
  public async getStorageStats(): Promise<{
    totalObjects: number;
    totalSizeMB: number;
    snapshotCount: number;
    reportCount: number;
  }> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      MaxKeys: 10000, // Límite para evitar timeouts
    });

    try {
      const response = await this.client.send(command);
      
      if (!response.Contents) {
        return {
          totalObjects: 0,
          totalSizeMB: 0,
          snapshotCount: 0,
          reportCount: 0,
        };
      }

      let totalSize = 0;
      let snapshotCount = 0;
      let reportCount = 0;

      for (const obj of response.Contents) {
        if (obj.Size) {
          totalSize += obj.Size;
        }

        if (obj.Key) {
          if (obj.Key.includes('/snapshots/')) {
            snapshotCount++;
          } else if (obj.Key.includes('/reports/')) {
            reportCount++;
          }
        }
      }

      return {
        totalObjects: response.Contents.length,
        totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
        snapshotCount,
        reportCount,
      };
    } catch (error) {
      console.warn(
        'Error obteniendo estadísticas de S3:',
        error instanceof Error ? error.message : 'Error desconocido'
      );
      return {
        totalObjects: 0,
        totalSizeMB: 0,
        snapshotCount: 0,
        reportCount: 0,
      };
    }
  }

  /**
   * Genera la clave S3 para un snapshot
   */
  private generateSnapshotKey(projectName: string, dateISO: string): string {
    const date = dateISO.split('T')[0];
    const safeName = this.sanitizeName(projectName);
    return `snapshots/${safeName}/${date}.json`;
  }

  /**
   * Genera la clave S3 para un reporte
   */
  private generateReportKey(
    projectName: string,
    dateISO: string,
    format: string
  ): string {
    const date = dateISO.split('T')[0];
    const safeName = this.sanitizeName(projectName);
    return `reports/${date}/${safeName}.${format}`;
  }

  /**
   * Genera la clave S3 para el índice de reportes
   */
  private generateIndexKey(dateISO: string): string {
    const date = dateISO.split('T')[0];
    return `reports/${date}/index.md`;
  }

  /**
   * Sanitiza un nombre para uso como clave S3
   */
  private sanitizeName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 50);
  }

  /**
   * Convierte un stream a string
   */
  private async streamToString(stream: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
  }
}