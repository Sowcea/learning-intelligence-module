// API Wrapper exports
export { createTrackedFetch, trackedApis } from './apiWrapper';

// N8n Wrapper exports
export {
  executeN8nWorkflow,
  createN8nWorkflow,
  batchExecuteN8nWorkflows,
  n8nWorkflows,
  type N8nWorkflowResult,
  type N8nWorkflowConfig,
} from './n8nWrapper';

// React hook for easy integration
export { useLearningLogger } from './useLearningLogger';

// Mother Brain Connector
export {
  MotherBrainConnector,
  feedExternalToMotherBrain,
  getIntelligenceDashboard,
  triggerExternalCycle,
  initializeExternalMonitoring
} from './MotherBrainConnector';

// Initialize global fetch tracking (optional)
export function initializeGlobalTracking() {
  if (typeof window !== 'undefined') {
    const { createTrackedFetch } = require('./apiWrapper');
    const originalFetch = window.fetch.bind(window);
    window.fetch = createTrackedFetch(originalFetch);
    console.log('🧠 Learning: Global API tracking initialized');
  }
}
