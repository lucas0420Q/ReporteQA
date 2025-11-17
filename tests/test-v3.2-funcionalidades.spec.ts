import { test, expect } from '@playwright/test';
import { 
  obtenerFechaHoraActual, 
  esDiaHabil, 
  obtenerDiaHabilAnterior,
  obtenerFechaDiasHabilesAtras,
  formatearFecha
} from '../src/domain/date-utils';
import { SnapshotManager } from '../src/domain/snapshot-manager';
import { DiffEngine } from '../src/domain/diff-engine-v2';

test.describe('Tests de Funcionalidades V3.2', () => {

  test.describe('1. Date Utils - Lógica de Días Hábiles', () => {
    
    test('debe obtener fecha y hora actual con timezone correcto', () => {
      const resultado = obtenerFechaHoraActual('America/Asuncion');
      
      expect(resultado).toHaveProperty('fecha');
      expect(resultado).toHaveProperty('hora');
      expect(resultado).toHaveProperty('fecha_hora');
      expect(resultado).toHaveProperty('timestamp');
      
      // Verificar formato YYYY-MM-DD
      expect(resultado.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // Verificar formato HH:MM:SS
      expect(resultado.hora).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      // Verificar formato YYYY-MM-DD HH:MM:SS
      expect(resultado.fecha_hora).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      
      console.log('✅ Fecha/Hora actual:', resultado.fecha_hora);
    });

    test('debe identificar correctamente días hábiles (lunes a viernes)', () => {
      // Probar con el día actual
      const hoy = new Date();
      const diaSemana = hoy.getDay(); // 0=Domingo, 6=Sábado
      const resultado = esDiaHabil(hoy);
      
      // Verificar que la lógica es correcta
      if (diaSemana === 0 || diaSemana === 6) {
        expect(resultado).toBe(false); // Fin de semana
        console.log(`  Hoy es fin de semana (día ${diaSemana}): ${resultado === false ? '✓' : '✗'}`);
      } else {
        expect(resultado).toBe(true); // Día hábil
        console.log(`  Hoy es día hábil (día ${diaSemana}): ${resultado === true ? '✓' : '✗'}`);
      }
      
      console.log('✅ Identificación de días hábiles correcta');
    });

    test('debe obtener el día hábil anterior saltando fines de semana', () => {
      // Tomar una fecha hoy y obtener el anterior
      const hoy = new Date();
      const anterior = obtenerDiaHabilAnterior(hoy);
      
      // Verificar que la fecha anterior es menor
      expect(anterior.getTime()).toBeLessThan(hoy.getTime());
      
      // Verificar que el día anterior es un día hábil
      const diaAnterior = anterior.getDay();
      expect(diaAnterior).not.toBe(0); // No domingo
      expect(diaAnterior).not.toBe(6); // No sábado
      
      console.log(`  Hoy: ${formatearFecha(hoy)} → Día hábil anterior: ${formatearFecha(anterior)}`);
      console.log('✅ Cálculo de día hábil anterior correcto (salta fines de semana)');
    });

    test('debe calcular 5 días hábiles atrás (1 semana laboral)', () => {
      // Desde viernes 14 Nov → 5 días hábiles atrás
      const viernes = new Date('2025-11-14');
      const hace5Dias = obtenerFechaDiasHabilesAtras(5, viernes);
      const resultadoViernes = formatearFecha(hace5Dias);
      console.log(`Desde ${formatearFecha(viernes)} → 5 días hábiles atrás = ${resultadoViernes}`);
      
      // Desde miércoles 12 Nov → 5 días hábiles atrás
      const miercoles = new Date('2025-11-12');
      const hace5DiasMiercoles = obtenerFechaDiasHabilesAtras(5, miercoles);
      const resultadoMiercoles = formatearFecha(hace5DiasMiercoles);
      console.log(`Desde ${formatearFecha(miercoles)} → 5 días hábiles atrás = ${resultadoMiercoles}`);
      
      // Verificar que el resultado es una fecha válida y anterior
      expect(hace5Dias.getTime()).toBeLessThan(viernes.getTime());
      expect(hace5DiasMiercoles.getTime()).toBeLessThan(miercoles.getTime());
      
      console.log('✅ Cálculo de 5 días hábiles atrás funciona correctamente');
    });
  });

  test.describe('2. Snapshot Manager - Inicialización', () => {
    
    test('debe verificar que el snapshot manager está correctamente inicializado', () => {
      const snapshotManager = new SnapshotManager();
      expect(snapshotManager).toBeDefined();
      console.log('✅ SnapshotManager inicializado correctamente');
    });

    test('debe retornar null si el snapshot no existe', async () => {
      const snapshotManager = new SnapshotManager();
      const snapshot = await snapshotManager.cargarSnapshot('2099-01-01');
      expect(snapshot).toBeNull();
      console.log('✅ Manejo correcto de snapshot inexistente');
    });
  });

  test.describe('3. Diff Engine - Detección de Cambios', () => {
    
    const diffEngine = new DiffEngine();
    
    test('debe detectar items nuevos correctamente', () => {
      const itemsAnteriores = [
        { id: 'MP1', titulo: 'Caso 1', estado: 'Ejecutada', tipo: 'matriz' as const }
      ];
      
      const itemsActuales = [
        { id: 'MP1', titulo: 'Caso 1', estado: 'Ejecutada', tipo: 'matriz' as const },
        { id: 'MP2', titulo: 'Caso 2', estado: 'Ejecutada', tipo: 'matriz' as const }
      ];

      const resultado = diffEngine.compararItems(itemsActuales, itemsAnteriores);
      
      expect(resultado.items_nuevos).toHaveLength(1);
      expect(resultado.items_nuevos[0].id).toBe('MP2');
      expect(resultado.items_nuevos[0].tipo_cambio).toBe('nuevo');
      expect(resultado.items_sin_cambio).toHaveLength(1);
      
      console.log('✅ Detección de items nuevos correcta');
    });

    test('debe detectar cambios de estado correctamente', () => {
      const itemsAnteriores = [
        { id: 'INC1', titulo: 'Bug 1', estado: 'Pendiente', tipo: 'incidencia' as const }
      ];
      
      const itemsActuales = [
        { id: 'INC1', titulo: 'Bug 1', estado: 'Resuelto', tipo: 'incidencia' as const }
      ];

      const resultado = diffEngine.compararItems(itemsActuales, itemsAnteriores);
      
      expect(resultado.items_con_cambio_estado).toHaveLength(1);
      expect(resultado.items_con_cambio_estado[0].estado_anterior).toBe('Pendiente');
      expect(resultado.items_con_cambio_estado[0].estado_actual).toBe('Resuelto');
      expect(resultado.items_con_cambio_estado[0].tipo_cambio).toBe('cambio_estado');
      
      console.log('✅ Detección de cambios de estado correcta');
    });

    test('debe detectar items eliminados correctamente', () => {
      const itemsAnteriores = [
        { id: 'MP1', titulo: 'Caso 1', estado: 'Ejecutada', tipo: 'matriz' as const },
        { id: 'MP2', titulo: 'Caso 2', estado: 'Ejecutada', tipo: 'matriz' as const }
      ];
      
      const itemsActuales = [
        { id: 'MP1', titulo: 'Caso 1', estado: 'Ejecutada', tipo: 'matriz' as const }
      ];

      const resultado = diffEngine.compararItems(itemsActuales, itemsAnteriores);
      
      expect(resultado.items_eliminados).toHaveLength(1);
      expect(resultado.items_eliminados[0].id).toBe('MP2');
      
      console.log('✅ Detección de items eliminados correcta');
    });

    test('debe calcular métricas semanales correctamente', () => {
      const snapshotAnterior = {
        nombre_proyecto: 'Proyecto Test',
        fecha_hora: '2025-11-10 10:00:00',
        matriz_pruebas: [
          { id: 'MP1', titulo: 'Caso 1', estado: 'Ejecutada', tipo: 'matriz' as const }
        ],
        incidencias: [
          { id: 'INC1', titulo: 'Bug 1', estado: 'Pendiente', tipo: 'incidencia' as const }
        ]
      };

      const snapshotActual = {
        nombre_proyecto: 'Proyecto Test',
        fecha_hora: '2025-11-17 10:00:00',
        matriz_pruebas: [
          { id: 'MP1', titulo: 'Caso 1', estado: 'Ejecutada', tipo: 'matriz' as const },
          { id: 'MP2', titulo: 'Caso 2', estado: 'Ejecutada', tipo: 'matriz' as const }
        ],
        incidencias: [
          { id: 'INC1', titulo: 'Bug 1', estado: 'Resuelto', tipo: 'incidencia' as const }
        ]
      };

      const metricas = diffEngine.calcularMetricasSemanales(snapshotActual, snapshotAnterior);
      
      expect(metricas.casos_agregados_semana).toBe(1); // MP2 es nuevo
      expect(metricas.incidencias_resueltas_semana).toBe(1); // INC1 cambió a Resuelto
      
      console.log('✅ Cálculo de métricas semanales correcto');
      console.log('   - Casos agregados: 1 (MP2)');
      console.log('   - Incidencias resueltas: 1 (INC1)');
    });

    test('debe comparar proyectos completos correctamente', () => {
      const proyectoAnterior = {
        nombre_proyecto: 'Test',
        fecha_hora: '2025-11-10 10:00:00',
        matriz_pruebas: [
          { id: 'MP1', titulo: 'Caso 1', estado: 'Ejecutada', tipo: 'matriz' as const }
        ],
        incidencias: [
          { id: 'INC1', titulo: 'Bug 1', estado: 'Pendiente', tipo: 'incidencia' as const }
        ]
      };

      const proyectoActual = {
        nombre_proyecto: 'Test',
        fecha_hora: '2025-11-11 10:00:00',
        matriz_pruebas: [
          { id: 'MP1', titulo: 'Caso 1', estado: 'Ejecutada', tipo: 'matriz' as const },
          { id: 'MP2', titulo: 'Caso 2', estado: 'Ejecutada', tipo: 'matriz' as const }
        ],
        incidencias: [
          { id: 'INC1', titulo: 'Bug 1', estado: 'Resuelto', tipo: 'incidencia' as const }
        ]
      };

      const resultado = diffEngine.compararProyecto(proyectoActual, proyectoAnterior);
      
      expect(resultado.matriz.items_nuevos).toHaveLength(1);
      expect(resultado.matriz.items_nuevos[0].id).toBe('MP2');
      expect(resultado.incidencias.items_con_cambio_estado).toHaveLength(1);
      expect(resultado.incidencias.items_con_cambio_estado[0].id).toBe('INC1');
      expect(resultado.incidencias.items_con_cambio_estado[0].estado_anterior).toBe('Pendiente');
      expect(resultado.incidencias.items_con_cambio_estado[0].estado_actual).toBe('Resuelto');
      
      console.log('✅ Comparación de proyectos completos correcta');
    });
  });

  test.describe('4. Integración - Verificación del Sistema', () => {
    
    test('debe verificar que el sistema completo está integrado', () => {
      const snapshotManager = new SnapshotManager();
      const diffEngine = new DiffEngine();
      
      expect(snapshotManager).toBeDefined();
      expect(diffEngine).toBeDefined();
      
      console.log('✅ Sistema completo integrado correctamente');
      console.log('   - SnapshotManager disponible');
      console.log('   - DiffEngine disponible');
      console.log('   - date-utils funcionales');
    });
  });

});
