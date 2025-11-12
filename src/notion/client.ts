import { Client } from '@notionhq/client';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { ConfigurationError } from '../domain/types.js';
import { config } from '../config.js';

/**
 * Factory para crear clientes de Notion con mejor testabilidad
 */
export class NotionClientFactory {
  private static tokenCache: string | null = null;
  private static clientCache: Client | null = null;

  /**
   * Crea una nueva instancia del cliente Notion configurado
   */
  public static async createClient(): Promise<Client> {
    const token = await this.getToken();
    return new Client({
      auth: token,
      notionVersion: config.notion.apiVersion,
      timeoutMs: config.notion.timeoutMs,
    });
  }

  /**
   * Obtiene una instancia cached del cliente (para compatibilidad)
   */
  public static async getClient(): Promise<Client> {
    if (!this.clientCache) {
      this.clientCache = await this.createClient();
    }
    return this.clientCache;
  }

  /**
   * Obtiene el token de Notion de forma segura
   */
  private static async getToken(): Promise<string> {
    if (this.tokenCache) {
      return this.tokenCache;
    }

    // Prioridad 1: AWS Secrets Manager
    const secretsName = process.env['AWS_SECRETS_NAME'];
    if (secretsName) {
      try {
        this.tokenCache = await this.getTokenFromSecretsManager(secretsName);
        console.info(
          `Token obtenido desde AWS Secrets Manager: ${secretsName}`
        );
        return this.tokenCache;
      } catch (error) {
        console.warn(
          'Error obteniendo token desde Secrets Manager, intentando archivo local:',
          error instanceof Error ? error.message : 'Error desconocido'
        );
      }
    }

    // Prioridad 2: Archivo token.txt local (para desarrollo)
    try {
      this.tokenCache = await this.getTokenFromFile();
      console.info('Token obtenido desde archivo local token.txt');
      return this.tokenCache;
    } catch (error) {
      // Silencioso, intentar variable de entorno
    }

    // Prioridad 3: Variable de entorno (fallback)
    const envToken = process.env['NOTION_TOKEN'];
    if (!envToken) {
      throw new ConfigurationError(
        'NOTION_TOKEN no encontrado en:\n' +
        '1. AWS Secrets Manager (AWS_SECRETS_NAME)\n' +
        '2. Archivo local ./token.txt\n' +
        '3. Variable de entorno NOTION_TOKEN'
      );
    }

    this.tokenCache = envToken;
    console.info('Token obtenido desde variable de entorno');
    return this.tokenCache;
  }

  /**
   * Obtiene el token desde archivo local token.txt
   */
  private static async getTokenFromFile(): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const tokenPath = path.join(process.cwd(), 'token.txt');
    
    try {
      const tokenContent = await fs.readFile(tokenPath, 'utf8');
      const token = tokenContent.trim();
      
      if (!token) {
        throw new ConfigurationError('Archivo token.txt está vacío');
      }
      
      // Validar formato básico del token
      if (!token.startsWith('ntn_') && !token.startsWith('secret_')) {
        throw new ConfigurationError(
          'Token en archivo token.txt debe comenzar con "ntn_" o "secret_"'
        );
      }
      
      return token;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new ConfigurationError('Archivo token.txt no encontrado');
      }
      throw error;
    }
  }

  /**
   * Obtiene el token desde AWS Secrets Manager
   */
  private static async getTokenFromSecretsManager(
    secretName: string
  ): Promise<string> {
    const region = process.env['AWS_REGION'] || config.defaults.awsRegion;
    const client = new SecretsManagerClient({ region });

    try {
      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });

      const response = await client.send(command);

      if (!response.SecretString) {
        throw new ConfigurationError(
          `Secret ${secretName} no contiene SecretString`
        );
      }

      // El secret puede ser un JSON con la clave 'NOTION_TOKEN' o directamente el token
      try {
        const secretObj = JSON.parse(response.SecretString) as Record<
          string,
          unknown
        >;
        const token = secretObj.NOTION_TOKEN;

        if (typeof token !== 'string') {
          throw new ConfigurationError(
            `NOTION_TOKEN en secret ${secretName} debe ser string`
          );
        }

        return token;
      } catch {
        // Si no es JSON válido, asumir que es directamente el token
        return response.SecretString;
      }
    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw error;
      }
      throw new ConfigurationError(
        `Error obteniendo secret ${secretName}: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`
      );
    }
  }

  /**
   * Valida que el token sea funcional realizando una consulta básica
   */
  public static async validateToken(): Promise<boolean> {
    try {
      const client = await this.getClient();
      
      // Intentar listar usuarios para validar el token
      await client.users.list({ page_size: 1 });
      return true;
    } catch (error) {
      console.error(
        'Token de Notion inválido:',
        error instanceof Error ? error.message : 'Error desconocido'
      );
      return false;
    }
  }

  /**
   * Limpia las instancias cached (útil para tests o rotación de tokens)
   */
  public static reset(): void {
    this.clientCache = null;
    this.tokenCache = null;
  }

  /**
   * Obtiene información básica del workspace para logging seguro
   */
  public static async getWorkspaceInfo(): Promise<{
    workspaceId: string;
    botId: string;
  }> {
    try {
      const client = await this.getClient();
      const botUser = await client.users.me({});

      return {
        workspaceId: botUser.name || 'unknown',
        botId: botUser.id.substring(0, config.logging.maxIdDisplayLength),
      };
    } catch (error) {
      throw new ConfigurationError(
        `Error obteniendo información del workspace: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`
      );
    }
  }
}

/**
 * Alias para compatibilidad con código existente
 * @deprecated Usar NotionClientFactory en su lugar
 */
export const NotionSecureClient = NotionClientFactory;