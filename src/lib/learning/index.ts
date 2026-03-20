// Ecosystem Learning Infrastructure - Main exports

export { 
  EcosystemLearningLogger, 
  learningLogger,
  type LearningLogAction 
} from './EcosystemLearningLogger';

export {
  withLearningLog,
  initializeServiceLearning,
  getServiceInsights,
  getAutonomyRoadmapSummary,
  generateWeeklyLearningReport,
  getToolBenchmarksSummary,
  syncFallbackLogs
} from './learningHelpers';

// Cron/Automation exports
export {
  runWeeklyLearningReview,
  scheduleWeeklyReview
} from '../cron/weeklyLearningReview';

// Integration exports
export {
  createTrackedFetch,
  trackedApis,
  executeN8nWorkflow,
  createN8nWorkflow,
  batchExecuteN8nWorkflows,
  n8nWorkflows,
  useLearningLogger,
  initializeGlobalTracking,
  // Mother Brain Connector
  MotherBrainConnector,
  feedExternalToMotherBrain,
  getIntelligenceDashboard,
  triggerExternalCycle,
  initializeExternalMonitoring,
} from './integrations';

// Automation exports
export { ExternalIntelligenceAutomator } from './automation';
