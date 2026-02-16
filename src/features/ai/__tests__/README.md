# Tests para Módulos de IA

Este directorio contiene tests automatizados para los módulos de inteligencia artificial de CELLVI 2.0.

## Estructura de Tests

```
src/features/ai/
├── lib/
│   ├── __tests__/
│   │   ├── routeOptimizer.test.ts      # Tests para optimización de rutas
│   │   ├── mediaPipeIntegration.test.ts # Tests para MediaPipe
│   │   └── claudeIntegration.test.ts    # Tests para Claude API
│   ├── routeOptimizer.ts
│   ├── mediaPipeIntegration.ts
│   └── claudeIntegration.ts
└── hooks/
    └── (tests se agregarán aquí)
```

## Ejecutar Tests

### Todos los tests
```bash
npm run test
```

### Tests específicos
```bash
# Solo tests de optimización de rutas
npm run test routeOptimizer

# Solo tests de MediaPipe
npm run test mediaPipe

# Solo tests de Claude
npm run test claude
```

### Con cobertura
```bash
npm run test:coverage
```

### En modo watch
```bash
npm run test:watch
```

## Cobertura de Tests

### Route Optimizer (routeOptimizer.test.ts)
✅ Cálculo de distancias entre coordenadas
✅ Generación de datos de demostración
✅ Algoritmo de optimización VRP
✅ Cálculo de métricas (distancia, costo, combustible, CO₂)
✅ Respeto de restricciones de capacidad
✅ Priorización de entregas
✅ Manejo de casos edge (inputs vacíos)

### MediaPipe Integration (mediaPipeIntegration.test.ts)
✅ Cálculo de Eye Aspect Ratio (EAR)
✅ Detección de ojos cerrados vs abiertos
✅ Cálculo de Mouth Aspect Ratio (MAR)
✅ Detección de bostezos
✅ Estimación de pose de cabeza (pitch, yaw, roll)
✅ Detección de giros de cabeza

### Claude Integration (claudeIntegration.test.ts)
✅ Generación de embeddings con OpenAI
✅ Consistencia de embeddings
✅ Búsqueda semántica en knowledge base
✅ Generación de respuestas con RAG
✅ Inclusión de fuentes relevantes
✅ Generación de acciones sugeridas
✅ Mantenimiento de historial de conversación
✅ Cálculo de confianza basado en relevancia

## Configuración de Test

Los tests utilizan:
- **Vitest**: Framework de testing
- **Testing Library**: Para tests de componentes React (futuro)
- **MSW**: Para mockear APIs (futuro)

## Agregar Nuevos Tests

### Estructura básica de un test

```typescript
import { describe, it, expect } from 'vitest';
import { functionToTest } from '../myModule';

describe('My Module', () => {
  describe('functionToTest', () => {
    it('should do something specific', () => {
      const result = functionToTest(input);
      expect(result).toBe(expectedOutput);
    });

    it('should handle edge cases', () => {
      const result = functionToTest(edgeCaseInput);
      expect(result).toBeDefined();
    });
  });
});
```

### Mejores prácticas

1. **Nombres descriptivos**: Usa nombres claros que describan qué se está probando
2. **Un concepto por test**: Cada test debe verificar una sola cosa
3. **Arrange-Act-Assert**: Organiza tus tests en estas tres secciones
4. **Tests independientes**: Cada test debe poder ejecutarse independientemente
5. **Mock solo lo necesario**: Usa mocks solo cuando sea absolutamente necesario

## Tests Pendientes

### Componentes React
- [ ] RouteOptimizerPanel.test.tsx
- [ ] FatigueMonitor.test.tsx
- [ ] ChatbotInterface.test.tsx

### Hooks de Supabase
- [ ] useRouteOptimization.test.ts
- [ ] useFatigueMonitoring.test.ts
- [ ] useChatbot.test.ts

### Integration Tests
- [ ] Flujo completo de optimización de rutas
- [ ] Sesión completa de monitoreo de fatiga
- [ ] Conversación completa de chatbot con RAG

### E2E Tests (Playwright)
- [ ] Crear ruta optimizada y verificar persistencia
- [ ] Iniciar sesión de monitoreo y generar alertas
- [ ] Chatear con el bot y verificar respuestas

## CI/CD

Los tests se ejecutan automáticamente en:
- ✅ Pre-commit hook (tests de unidad rápidos)
- ✅ Pull requests (suite completa)
- ✅ Push a main (suite completa + coverage)

## Recursos

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Test-Driven Development Guide](https://testdriven.io/)
