// Backend integration point: Replace with real API calls to your LLM/backend service
import {
  AgentOverview,
  AgentConversationItem,
  QuickActionItem,
  AutomationItem,
  AutomationFormData,
  AgentAlertItem,
  AgentTaskHistoryItem,
  WorkflowTemplateItem,
} from './types';
import {
  mockAgentOverview,
  mockConversations,
  mockQuickActions,
  mockAutomations,
  mockAlerts,
  mockTaskHistory,
  mockWorkflowTemplates,
} from './mockAgentData';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

let conversationsState: AgentConversationItem[] = [...mockConversations];
let automationsState: AutomationItem[] = [...mockAutomations];

// Mock AI responses for common prompts
const generateMockResponse = (userMessage: string): AgentConversationItem => {
  const id = `msg-${Date.now()}`;
  const now = new Date().toISOString();

  const lower = userMessage.toLowerCase();

  if (lower.includes('phòng trống') || lower.includes('tổng hợp phòng')) {
    return {
      id,
      role: 'assistant',
      content: 'Tôi đã kiểm tra tình trạng phòng hiện tại. Dưới đây là tổng hợp các phòng đang trống:',
      createdAt: now,
      messageType: 'list',
      relatedModule: 'rooms',
      listItems: [
        '🏠 Phòng A103 — Khu A — Trống 22 ngày — Giá 2.500.000 đ/tháng',
        '🏠 Phòng B204 — Khu B — Trống 20 ngày — Giá 2.800.000 đ/tháng',
      ],
      suggestedActions: [
        { label: 'Tạo bài đăng ngay', actionType: 'navigate', href: '/post-management' },
        { label: 'Xem quản lý phòng', actionType: 'navigate', href: '/room-management' },
      ],
    };
  }

  if (lower.includes('nợ') || lower.includes('chưa thanh toán') || lower.includes('công nợ')) {
    return {
      id,
      role: 'assistant',
      content: 'Tôi đã kiểm tra dữ liệu công nợ. Hiện có **3 khách thuê** chưa thanh toán tiền phòng với tổng số tiền còn nợ là **7.800.000 đ**:',
      createdAt: now,
      messageType: 'list',
      relatedModule: 'tenants',
      listItems: [
        '🏠 Phòng A101 — Nguyễn Thị Lan — Nợ 2.600.000 đ (quá hạn 15 ngày)',
        '🏠 Phòng B203 — Trần Văn Minh — Nợ 2.800.000 đ (quá hạn 8 ngày)',
        '🏠 Phòng C305 — Lê Thị Hoa — Nợ 2.400.000 đ (quá hạn 3 ngày)',
      ],
      suggestedActions: [
        { label: 'Gửi nhắc nhở tất cả', actionType: 'send_reminder' },
        { label: 'Xem danh sách khách thuê', actionType: 'navigate', href: '/tenant-management' },
        { label: 'Tạo tác vụ follow-up', actionType: 'create_task' },
      ],
    };
  }

  if (lower.includes('hợp đồng') || lower.includes('hết hạn')) {
    return {
      id,
      role: 'assistant',
      content: 'Tôi đã quét toàn bộ hợp đồng đang hiệu lực. Có **4 hợp đồng** sẽ hết hạn trong 30 ngày tới:',
      createdAt: now,
      messageType: 'list',
      relatedModule: 'contracts',
      listItems: [
        '📋 HĐ-2024-018 — Phòng A102 — Nguyễn Văn An — Hết hạn 20/07/2024 (còn 5 ngày)',
        '📋 HĐ-2024-022 — Phòng B201 — Phạm Thị Bích — Hết hạn 25/07/2024 (còn 10 ngày)',
        '📋 HĐ-2024-031 — Phòng C301 — Hoàng Văn Đức — Hết hạn 01/08/2024 (còn 17 ngày)',
        '📋 HĐ-2024-035 — Phòng A205 — Vũ Thị Mai — Hết hạn 10/08/2024 (còn 26 ngày)',
      ],
      suggestedActions: [
        { label: 'Xem tất cả hợp đồng', actionType: 'navigate', href: '/contract-management' },
        { label: 'Tạo nhắc gia hạn', actionType: 'create_task' },
      ],
    };
  }

  if (lower.includes('chi phí') || lower.includes('tóm tắt chi')) {
    return {
      id,
      role: 'assistant',
      content: 'Tôi đã tổng hợp chi phí tháng này. Dưới đây là phân tích chi tiết:',
      createdAt: now,
      messageType: 'list',
      relatedModule: 'expenses',
      listItems: [
        '💡 Điện nước: 4.200.000 đ (22.7%)',
        '🔧 Sửa chữa: 3.800.000 đ (20.5%)',
        '🌐 Internet: 1.500.000 đ (8.1%)',
        '🧹 Vệ sinh: 2.000.000 đ (10.8%)',
        '👤 Lương / quản lý: 6.000.000 đ (32.4%)',
        '📦 Khác: 1.000.000 đ (5.4%)',
        '━━━ Tổng: 18.500.000 đ',
      ],
      suggestedActions: [
        { label: 'Xem chi tiết chi phí', actionType: 'navigate', href: '/expenses' },
        { label: 'Xem báo cáo', actionType: 'navigate', href: '/reports' },
      ],
    };
  }

  if (lower.includes('bài đăng') || lower.includes('đăng bài') || lower.includes('lấp đầy')) {
    return {
      id,
      role: 'assistant',
      content: 'Tôi đã tạo gợi ý nội dung bài đăng cho 2 phòng đang trống. Dưới đây là mẫu bài đăng cho phòng A103:',
      createdAt: now,
      messageType: 'text',
      relatedModule: 'posts',
      suggestedActions: [
        { label: 'Xem bài đăng', actionType: 'navigate', href: '/post-management' },
        { label: 'Tạo bài đăng mới', actionType: 'navigate', href: '/post-management' },
      ],
    };
  }

  if (lower.includes('báo cáo') || lower.includes('vận hành') || lower.includes('tình hình')) {
    return {
      id,
      role: 'assistant',
      content: 'Đây là báo cáo nhanh tình hình vận hành tuần này:',
      createdAt: now,
      messageType: 'list',
      relatedModule: 'reports',
      listItems: [
        '🏠 Tổng phòng: 20 — Đang thuê: 18 — Trống: 2 (Lấp đầy: 90%)',
        '💰 Doanh thu tuần: 18.500.000 đ',
        '📉 Chi phí tuần: 4.850.000 đ',
        '📋 Hợp đồng sắp hết hạn: 4',
        '⚠️ Khách thuê quá hạn: 3 (Tổng nợ: 7.800.000 đ)',
        '📢 Phòng trống chưa đăng bài: 2',
      ],
      suggestedActions: [
        { label: 'Xem báo cáo đầy đủ', actionType: 'navigate', href: '/reports' },
      ],
    };
  }

  // Default response
  return {
    id,
    role: 'assistant',
    content: `Tôi đã nhận yêu cầu: "${userMessage}". Đây là tính năng đang được phát triển. Hiện tại tôi có thể hỗ trợ bạn với: tổng hợp công nợ, kiểm tra hợp đồng sắp hết hạn, tóm tắt chi phí, gợi ý bài đăng, và báo cáo vận hành. Bạn muốn tôi hỗ trợ gì?`,
    createdAt: now,
    messageType: 'text',
    relatedModule: 'general',
    suggestedActions: [
      { label: 'Xem tổng quan', actionType: 'navigate', href: '/dashboard' },
    ],
  };
};

export async function getAgentOverview(): Promise<AgentOverview> {
  await delay(600);
  return { ...mockAgentOverview };
}

export async function getAgentConversations(): Promise<AgentConversationItem[]> {
  await delay(400);
  return [...conversationsState];
}

export async function sendAgentMessage(content: string): Promise<AgentConversationItem> {
  await delay(800);
  const userMsg: AgentConversationItem = {
    id: `msg-user-${Date.now()}`,
    role: 'user',
    content,
    createdAt: new Date().toISOString(),
    messageType: 'text',
  };
  conversationsState = [...conversationsState, userMsg];

  await delay(1200);
  const assistantMsg = generateMockResponse(content);
  conversationsState = [...conversationsState, assistantMsg];
  return assistantMsg;
}

export async function getQuickActions(): Promise<QuickActionItem[]> {
  await delay(300);
  return [...mockQuickActions];
}

export async function getAutomations(): Promise<AutomationItem[]> {
  await delay(500);
  return [...automationsState];
}

export async function createAutomation(payload: AutomationFormData): Promise<AutomationItem> {
  await delay(800);
  const newItem: AutomationItem = {
    id: `auto-${Date.now()}`,
    name: payload.name,
    description: payload.description,
    triggerType: payload.triggerType as AutomationItem['triggerType'],
    frequency: payload.frequency as AutomationItem['frequency'],
    status: payload.enableImmediately ? 'active' : 'draft',
    lastRunAt: null,
    nextRunAt: payload.enableImmediately ? new Date(Date.now() + 86400000).toISOString() : null,
    module: payload.module as AutomationItem['module'],
    isEnabled: payload.enableImmediately,
    runCount: 0,
  };
  automationsState = [...automationsState, newItem];
  return newItem;
}

export async function updateAutomation(id: string, payload: Partial<AutomationItem>): Promise<AutomationItem> {
  await delay(400);
  automationsState = automationsState.map((a) => (a.id === id ? { ...a, ...payload } : a));
  return automationsState.find((a) => a.id === id)!;
}

export async function toggleAutomation(id: string): Promise<AutomationItem> {
  await delay(300);
  automationsState = automationsState.map((a) =>
    a.id === id
      ? { ...a, isEnabled: !a.isEnabled, status: !a.isEnabled ? 'active' : 'paused' }
      : a
  );
  return automationsState.find((a) => a.id === id)!;
}

export async function runAutomation(id: string): Promise<void> {
  await delay(1500);
  automationsState = automationsState.map((a) =>
    a.id === id ? { ...a, lastRunAt: new Date().toISOString() } : a
  );
}

export async function deleteAutomation(id: string): Promise<void> {
  await delay(400);
  automationsState = automationsState.filter((a) => a.id !== id);
}

export async function getAgentAlerts(): Promise<AgentAlertItem[]> {
  await delay(400);
  return [...mockAlerts];
}

export async function getTaskHistory(): Promise<AgentTaskHistoryItem[]> {
  await delay(500);
  return [...mockTaskHistory];
}

export async function getWorkflowTemplates(): Promise<WorkflowTemplateItem[]> {
  await delay(300);
  return [...mockWorkflowTemplates];
}
