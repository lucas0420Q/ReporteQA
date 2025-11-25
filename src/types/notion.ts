/**
 * @fileoverview Tipos específicos para la API de Notion
 * @description Interfaces y tipos para trabajar con respuestas de Notion API
 */

/**
 * Tipos específicos para Notion API (reemplaza any usage)
 */
export interface NotionPageResponse {
  id: string;
  created_time: string;
  last_edited_time: string;
  properties: Record<string, NotionProperty>;
}

export interface NotionProperty {
  id: string;
  type: string;
  title?: NotionTitleContent[];
  rich_text?: NotionRichTextContent[];
  select?: NotionSelectValue | null;
  multi_select?: NotionSelectValue[];
  status?: NotionStatusValue | null;
}

export interface NotionTitleContent {
  type: 'text';
  text: {
    content: string;
  };
  plain_text: string;
}

export interface NotionRichTextContent {
  type: 'text';
  text: {
    content: string;
  };
  plain_text: string;
}

export interface NotionSelectValue {
  id: string;
  name: string;
  color?: string;
}

export interface NotionStatusValue {
  id: string;
  name: string;
  color?: string;
}

export interface NotionBlockResponse {
  id: string;
  type: string;
  child_database?: {
    title: string;
  };
}

/**
 * Configuración para leer propiedades de Notion de forma robusta
 */
export interface PropertyConfig {
  tituloProps: string[];  // Nombres de propiedades para título
  estadoProps: string[];  // Nombres de propiedades para estado
}
