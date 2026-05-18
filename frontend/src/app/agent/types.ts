// Backend integration point: Replace with API types from your backend schema

export type MessageRole = 'user' | 'assistant';
export type MessageType = 'text' | 'summary' | 'list' | 'action_suggestion';
export type RelatedModule = 'rooms' | 'contracts' | 'tenants' | 'expenses' | 'reports' | 'posts' | 'general';

export type AutomationStatus = 'active' | 'paused' | 'error' | 'draft';
export type AutomationTriggerType = 'schedule' | 'event' | 'condition';
export type AutomationFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export type AlertSeverity = 'high' | 'medium' | 'info';
export type TaskStatus = 'completed' | 'running' | 'failed' | 'cancelled';
export type TaskType = 'ai_summary' | 'automation' | 'ai_generated' | 'scan' | 'digest';
export type TriggerSource = 'manual' | 'automation' | 'ai_suggestion' | 'schedule';

export interface SuggestedAction {
  label: string;
  actionType: 'navigate' | 'create_task' | 'send_reminder' | 'view_detail';
  href?: string;
}

export interface AgentConversationItem {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  messageType: MessageType;
  relatedModule?: RelatedModule;
  suggestedActions?: SuggestedAction[];
  listItems?: string[];
}

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  actionType: 'chat_prompt' | 'modal' | 'navigate';
  relatedModule: RelatedModule;
  prompt?: string;
  href?: string;
}

export interface AutomationItem {
  id: string;
  name: string;
  description: string;
  triggerType: AutomationTriggerType;
  frequency: AutomationFrequency;
  status: AutomationStatus;
  lastRunAt: string | null;
  nextRunAt: string | null;
  module: RelatedModule;
  isEnabled: boolean;
  runCount: number;
}

export interface AutomationFormData {
  name: string;
  description: string;
  triggerType: AutomationTriggerType | '';
  frequency: AutomationFrequency | '';
  runTime: string;
  module: RelatedModule | '';
  condition: string;
  action: string;
  notifyRecipient: string;
  notifyChannel: 'in_app' | 'email' | 'sms' | 'zalo' | '';
  enableImmediately: boolean;
}

export interface AgentAlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  actionLabel: string;
  relatedRoute: string;
  createdAt: string;
}

export interface AgentTaskHistoryItem {
  id: string;
  name: string;
  taskType: TaskType;
  triggerSource: TriggerSource;
  status: TaskStatus;
  createdAt: string;
  resultSummary: string;
  module: RelatedModule;
}

export interface WorkflowTemplateItem {
  id: string;
  name: string;
  description: string;
  trigger: string;
  outcome: string;
  module: RelatedModule;
  estimatedTime: string;
}

export interface AgentOverview {
  todayTasks: number;
  runningAutomations: number;
  pendingAlerts: number;
  aiAssisted: number;
  overdueTenantsCount: number;
  expiringContractsCount: number;
}
