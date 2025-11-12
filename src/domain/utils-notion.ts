/**
 * Utilidades robustas para manejo de datos de Notion
 */

export type ItemMin = {
  id: string;
  titulo: string;
  estado: string;
};

export type MatrizBucket = 'pendiente' | 'en_curso' | 'finalizado';
export type IncidenciaBucket = 'pendiente' | 'devuelto' | 'en_curso' | 'finalizado' | 'resuelto';

/**
 * Configuración para leer propiedades de Notion
 */
export type PropertyConfig = {
  tituloProps: string[];
  estadoProps: string[];
};

/**
 * Normaliza texto removiendo diacríticos, espacios extra y pasando a lowercase
 */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remover diacríticos
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');  // Normalizar espacios múltiples
}

/**
 * Clasifica estado de matriz de pruebas en buckets estándar
 */
export function bucketMatriz(estado: string): MatrizBucket | null {
  const v = normalize(estado);
  
  if (['pendiente', 'pending', 'todo', 'to do'].includes(v)) return 'pendiente';
  if (['en curso', 'curso', 'in progress', 'progress', 'doing', 'active'].includes(v)) return 'en_curso';
  if (['finalizado', 'cerrado', 'done', 'completed', 'finished', 'complete'].includes(v)) return 'finalizado';
  
  return null;
}

/**
 * Clasifica estado de incidencias en buckets estándar
 */
export function bucketIncid(estado: string): IncidenciaBucket | null {
  const v = normalize(estado);
  
  if (['pendiente', 'pending', 'todo', 'to do', 'open', 'new'].includes(v)) return 'pendiente';
  if (['devuelto', 'returned', 'rejected', 'reopened'].includes(v)) return 'devuelto';
  if (['en curso', 'curso', 'in progress', 'progress', 'doing', 'active', 'assigned'].includes(v)) return 'en_curso';
  if (['finalizado', 'cerrado', 'done', 'completed', 'finished', 'complete', 'closed'].includes(v)) return 'finalizado';
  if (['resuelto', 'resolved', 'fixed', 'solved'].includes(v)) return 'resuelto';
  
  return null;
}

/**
 * Extrae texto de una propiedad title de Notion
 */
function extractTitleText(titleProp: any): string | null {
  try {
    if (!titleProp || typeof titleProp !== 'object') return null;
    
    if (titleProp.type === 'title' && Array.isArray(titleProp.title)) {
      const text = titleProp.title
        .map((t: any) => t?.plain_text || '')
        .join('')
        .trim();
      return text || null;
    }
    
    return null;
  } catch (error) {
    console.warn('Error extrayendo título:', error);
    return null;
  }
}

/**
 * Extrae valor de una propiedad select/multi_select de Notion
 */
function extractSelectValue(selectProp: any): string | null {
  try {
    if (!selectProp || typeof selectProp !== 'object') return null;
    
    // Propiedad select
    if (selectProp.type === 'select' && selectProp.select) {
      return selectProp.select.name || null;
    }
    
    // Propiedad status (similar a select)
    if (selectProp.type === 'status' && selectProp.status) {
      return selectProp.status.name || null;
    }
    
    // Propiedad multi_select (tomar el primer valor)
    if (selectProp.type === 'multi_select' && Array.isArray(selectProp.multi_select)) {
      const first = selectProp.multi_select[0];
      return first?.name || null;
    }
    
    return null;
  } catch (error) {
    console.warn('Error extrayendo select:', error);
    return null;
  }
}

/**
 * Convierte una página de Notion a ItemMin usando configuración robusta
 */
export function toItemMin(
  page: any, 
  cfg: PropertyConfig
): ItemMin | null {
  try {
    if (!page || typeof page !== 'object' || !page.id || !page.properties) {
      return null;
    }
    
    const properties = page.properties;
    
    // Buscar título en las propiedades configuradas
    let titulo = '';
    for (const propName of cfg.tituloProps) {
      const titleText = extractTitleText(properties[propName]);
      if (titleText) {
        titulo = titleText;
        break;
      }
    }
    
    // Si no encontró título, buscar en propiedades de tipo title
    if (!titulo) {
      for (const [key, prop] of Object.entries(properties)) {
        if (typeof prop === 'object' && prop !== null && (prop as any).type === 'title') {
          const titleText = extractTitleText(prop);
          if (titleText) {
            titulo = titleText;
            break;
          }
        }
      }
    }
    
    if (!titulo) {
      console.warn(`Página ${page.id.substring(0, 8)}... sin título válido`);
      return null;
    }
    
    // Buscar estado en las propiedades configuradas
    let estado = '';
    for (const propName of cfg.estadoProps) {
      const selectValue = extractSelectValue(properties[propName]);
      if (selectValue) {
        estado = selectValue;
        break;
      }
    }
    
    // Si no encontró estado, buscar en propiedades de tipo select/status
    if (!estado) {
      for (const [key, prop] of Object.entries(properties)) {
        if (typeof prop === 'object' && prop !== null) {
          const propObj = prop as any;
          if (['select', 'status', 'multi_select'].includes(propObj.type)) {
            const selectValue = extractSelectValue(prop);
            if (selectValue) {
              estado = selectValue;
              break;
            }
          }
        }
      }
    }
    
    // Fallback para estado
    if (!estado) {
      estado = 'Pendiente';
    }
    
    return {
      id: page.id,
      titulo,
      estado
    };
  } catch (error) {
    console.warn(`Error procesando página ${page?.id || 'unknown'}:`, error);
    return null;
  }
}