// Backend integration point: Replace all mock data with API calls to your backend service

export type RoomStatus = 'Trống' | 'Đang thuê' | 'Đã đặt' | 'Bảo trì';
export type ContractStatus = 'Đang hiệu lực' | 'Sắp hết hạn' | 'Đã hết hạn' | 'Đã chấm dứt';
export type PostStatus = 'Nháp' | 'Đã lên lịch' | 'Đã đăng' | 'Lỗi';
export type ExpenseCategory = 'Bảo trì' | 'Điện' | 'Nước' | 'Internet' | 'Vệ sinh' | 'Lương' | 'Khác';
export type TenantStatus = 'Đang thuê' | 'Đã trả phòng' | 'Sắp hết hạn' | 'Nợ tiền';
export type LeadStatus = 'Mới' | 'Đang tư vấn' | 'Quan tâm cao' | 'Đã chốt' | 'Không quan tâm';

export interface Room {
  id: string;
  code: string;
  name: string;
  floor: string;
  block: string;
  area: number;
  rentPrice: number;
  deposit: number;
  electricityPrice: number;
  waterPrice: number;
  serviceFee: number;
  maxTenants: number;
  currentTenants: number;
  status: RoomStatus;
  description: string;
  images: string[];
  hasActivePost: boolean;
}

export interface Tenant {
  id: string;
  fullName: string;
  phone: string;
  cccd: string;
  gender: 'Nam' | 'Nữ';
  dateOfBirth: string;
  permanentAddress: string;
  currentRoomId: string | null;
  currentRoomCode: string | null;
  occupation?: string;
  licensePlate?: string;
  contractCode?: string;
  startDate?: string;
  status: TenantStatus;
  debt: number;
  notes?: string;
}

export interface Contract {
  id: string;
  code: string;
  roomId: string;
  roomCode: string;
  roomName: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  tenantCCCD: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  billingCycle: number;
  paymentDueDay: number;
  status: ContractStatus;
  daysUntilExpiry: number | null;
  notes: string;
}

export interface FacebookPost {
  id: string;
  title: string;
  content: string;
  roomId: string | null;
  roomCode: string | null;
  postType: 'Tuyển khách' | 'Khuyến mãi' | 'Thông báo';
  channel: 'Facebook Page' | 'Facebook Group' | 'Zalo';
  plannedDate: string | null;
  postedDate: string | null;
  status: PostStatus;
  fbLink: string | null;
  views: number;
  messages: number;
  leads: number;
  converted: number;
  hashtags?: string;
  price?: number;
  area?: number;
  assignee?: string;
  thumbnail?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'customer' | 'staff';
  text?: string;
  image?: string;
  timestamp: string;
  read: boolean;
}

export interface ChatConversation {
  id: string;
  customerName: string;
  customerAvatar: string;
  source: 'Facebook Page' | 'Facebook Group' | 'Zalo';
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  tags: string[];
  leadStatus: LeadStatus;
  phone?: string;
  interestedRoom?: string;
  budget?: number;
  appointmentDate?: string;
  internalNote?: string;
  assignee?: string;
  interestLevel: 'Thấp' | 'Trung bình' | 'Cao' | 'Rất cao';
  messages: ChatMessage[];
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  roomId: string | null;
  roomCode: string | null;
  note: string;
}

export interface RevenueData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  occupancyRate: number;
}

export interface Notification {
  id: string;
  type: 'contract_expiry' | 'vacant_room' | 'overdue_payment' | 'maintenance';
  title: string;
  message: string;
  date: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

// ─── ROOMS ────────────────────────────────────────────────────────────────────
export const mockRooms: Room[] = [
  { id: 'r1', code: 'P101', name: 'Phòng 101', floor: 'Tầng 1', block: 'Khu A', area: 25, rentPrice: 3500000, deposit: 7000000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 100000, maxTenants: 2, currentTenants: 2, status: 'Đang thuê', description: 'Phòng có ban công, nhìn ra sân', images: [], hasActivePost: false },
  { id: 'r2', code: 'P102', name: 'Phòng 102', floor: 'Tầng 1', block: 'Khu A', area: 22, rentPrice: 3200000, deposit: 6400000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 100000, maxTenants: 2, currentTenants: 2, status: 'Đang thuê', description: 'Phòng tiêu chuẩn, yên tĩnh', images: [], hasActivePost: false },
  { id: 'r3', code: 'P103', name: 'Phòng 103', floor: 'Tầng 1', block: 'Khu A', area: 20, rentPrice: 3000000, deposit: 6000000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 100000, maxTenants: 2, currentTenants: 0, status: 'Trống', description: 'Phòng vừa dọn, sẵn sàng cho thuê', images: [], hasActivePost: false },
  { id: 'r4', code: 'P104', name: 'Phòng 104', floor: 'Tầng 1', block: 'Khu A', area: 20, rentPrice: 3000000, deposit: 6000000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 100000, maxTenants: 2, currentTenants: 0, status: 'Đã đặt', description: 'Đã nhận cọc, chờ nhận phòng 20/03', images: [], hasActivePost: false },
  { id: 'r5', code: 'P201', name: 'Phòng 201', floor: 'Tầng 2', block: 'Khu A', area: 28, rentPrice: 4000000, deposit: 8000000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 150000, maxTenants: 3, currentTenants: 3, status: 'Đang thuê', description: 'Phòng rộng, có gác lửng', images: [], hasActivePost: false },
  { id: 'r6', code: 'P202', name: 'Phòng 202', floor: 'Tầng 2', block: 'Khu A', area: 25, rentPrice: 3800000, deposit: 7600000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 150000, maxTenants: 2, currentTenants: 2, status: 'Đang thuê', description: 'View thoáng, có tủ lạnh', images: [], hasActivePost: false },
  { id: 'r7', code: 'P203', name: 'Phòng 203', floor: 'Tầng 2', block: 'Khu A', area: 22, rentPrice: 3500000, deposit: 7000000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 100000, maxTenants: 2, currentTenants: 1, status: 'Đang thuê', description: 'Đang có 1 người, tìm ở ghép', images: [], hasActivePost: false },
  { id: 'r8', code: 'P204', name: 'Phòng 204', floor: 'Tầng 2', block: 'Khu A', area: 20, rentPrice: 3200000, deposit: 6400000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 100000, maxTenants: 2, currentTenants: 0, status: 'Bảo trì', description: 'Đang sửa chữa hệ thống điện', images: [], hasActivePost: false },
  { id: 'r9', code: 'P301', name: 'Phòng 301', floor: 'Tầng 3', block: 'Khu A', area: 30, rentPrice: 4500000, deposit: 9000000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 200000, maxTenants: 3, currentTenants: 2, status: 'Đang thuê', description: 'Phòng cao cấp, view toàn cảnh', images: [], hasActivePost: false },
  { id: 'r10', code: 'P302', name: 'Phòng 302', floor: 'Tầng 3', block: 'Khu A', area: 28, rentPrice: 4200000, deposit: 8400000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 200000, maxTenants: 2, currentTenants: 2, status: 'Đang thuê', description: 'Mới trang trí lại, nội thất đẹp', images: [], hasActivePost: false },
  { id: 'r11', code: 'PB01', name: 'Phòng B01', floor: 'Tầng 1', block: 'Khu B', area: 18, rentPrice: 2800000, deposit: 5600000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 80000, maxTenants: 1, currentTenants: 1, status: 'Đang thuê', description: 'Phòng 1 người ở, giá tốt', images: [], hasActivePost: false },
  { id: 'r12', code: 'PB02', name: 'Phòng B02', floor: 'Tầng 1', block: 'Khu B', area: 18, rentPrice: 2800000, deposit: 5600000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 80000, maxTenants: 1, currentTenants: 1, status: 'Đang thuê', description: 'Phòng đơn, tiện nghi đầy đủ', images: [], hasActivePost: false },
  { id: 'r13', code: 'PB03', name: 'Phòng B03', floor: 'Tầng 1', block: 'Khu B', area: 20, rentPrice: 3000000, deposit: 6000000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 100000, maxTenants: 2, currentTenants: 0, status: 'Trống', description: 'Phòng mới dọn, cần cho thuê gấp', images: [], hasActivePost: false },
  { id: 'r14', code: 'PB04', name: 'Phòng B04', floor: 'Tầng 1', block: 'Khu B', area: 22, rentPrice: 3200000, deposit: 6400000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 100000, maxTenants: 2, currentTenants: 0, status: 'Đã đặt', description: 'Đã nhận cọc, chờ nhận phòng 20/03', images: [], hasActivePost: false },
  { id: 'r15', code: 'PB05', name: 'Phòng B05', floor: 'Tầng 2', block: 'Khu B', area: 25, rentPrice: 3600000, deposit: 7200000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 120000, maxTenants: 2, currentTenants: 2, status: 'Đang thuê', description: 'Phòng đôi, ban công nhỏ', images: [], hasActivePost: false },
  { id: 'r16', code: 'PB06', name: 'Phòng B06', floor: 'Tầng 2', block: 'Khu B', area: 25, rentPrice: 3600000, deposit: 7200000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 120000, maxTenants: 2, currentTenants: 2, status: 'Đang thuê', description: 'Phòng đôi, sát thang máy', images: [], hasActivePost: false },
  { id: 'r17', code: 'PB07', name: 'Phòng B07', floor: 'Tầng 2', block: 'Khu B', area: 22, rentPrice: 3300000, deposit: 6600000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 100000, maxTenants: 2, currentTenants: 0, status: 'Trống', description: 'Trống 2 tuần, cần cho thuê', images: [], hasActivePost: true },
  { id: 'r18', code: 'PC01', name: 'Phòng C01', floor: 'Tầng 1', block: 'Khu C', area: 35, rentPrice: 5500000, deposit: 11000000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 300000, maxTenants: 4, currentTenants: 4, status: 'Đang thuê', description: 'Studio rộng, full nội thất cao cấp', images: [], hasActivePost: false },
  { id: 'r19', code: 'PC02', name: 'Phòng C02', floor: 'Tầng 1', block: 'Khu C', area: 32, rentPrice: 5000000, deposit: 10000000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 250000, maxTenants: 3, currentTenants: 3, status: 'Đang thuê', description: 'Studio, bếp riêng biệt', images: [], hasActivePost: false },
  { id: 'r20', code: 'PC03', name: 'Phòng C03', floor: 'Tầng 2', block: 'Khu C', area: 35, rentPrice: 5500000, deposit: 11000000, electricityPrice: 3500, waterPrice: 15000, serviceFee: 300000, maxTenants: 4, currentTenants: 0, status: 'Trống', description: 'Studio cao cấp tầng 2, view đẹp, mới cải tạo', images: [], hasActivePost: false },
];

// ─── TENANTS ──────────────────────────────────────────────────────────────────
export const mockTenants: Tenant[] = [
  { id: 't1', fullName: 'Nguyễn Văn An', phone: '0901234561', cccd: '001234567890', gender: 'Nam', dateOfBirth: '1995-03-15', permanentAddress: '45 Phố Huế, Hai Bà Trưng, Hà Nội', currentRoomId: 'r1', currentRoomCode: 'P101', occupation: 'Kỹ sư phần mềm', licensePlate: '30A-12345', contractCode: 'HĐ-2025-001', startDate: '2025-01-01', status: 'Đang thuê', debt: 0, notes: 'Khách ở lâu năm, đáng tin cậy' },
  { id: 't2', fullName: 'Trần Thị Bích', phone: '0912345672', cccd: '001234567891', gender: 'Nữ', dateOfBirth: '1998-07-22', permanentAddress: '12 Trần Hưng Đạo, Nam Định', currentRoomId: 'r2', currentRoomCode: 'P102', occupation: 'Giáo viên', licensePlate: '', contractCode: 'HĐ-2025-002', startDate: '2025-03-01', status: 'Đang thuê', debt: 0, notes: '' },
  { id: 't3', fullName: 'Lê Minh Cường', phone: '0923456783', cccd: '001234567892', gender: 'Nam', dateOfBirth: '1993-11-08', permanentAddress: '78 Lê Lợi, TP Thanh Hóa', currentRoomId: 'r5', currentRoomCode: 'P201', occupation: 'Nhân viên kinh doanh', licensePlate: '36B-56789', contractCode: 'HĐ-2024-003', startDate: '2024-06-01', status: 'Sắp hết hạn', debt: 4000000, notes: 'Hay trả trễ 1-2 ngày' },
  { id: 't4', fullName: 'Phạm Thị Dung', phone: '0934567894', cccd: '001234567893', gender: 'Nữ', dateOfBirth: '2000-02-14', permanentAddress: '23 Nguyễn Văn Cừ, Nghệ An', currentRoomId: 'r6', currentRoomCode: 'P202', occupation: 'Sinh viên', licensePlate: '', contractCode: 'HĐ-2025-003', startDate: '2025-01-15', status: 'Đang thuê', debt: 0, notes: '' },
  { id: 't5', fullName: 'Hoàng Văn Em', phone: '0945678905', cccd: '001234567894', gender: 'Nam', dateOfBirth: '1997-09-30', permanentAddress: '56 Quang Trung, Hải Dương', currentRoomId: 'r7', currentRoomCode: 'P203', occupation: 'Thợ cơ khí', licensePlate: '34C-11223', contractCode: 'HĐ-2025-004', startDate: '2025-02-01', status: 'Sắp hết hạn', debt: 0, notes: 'HĐ ngắn hạn 6 tháng' },
  { id: 't6', fullName: 'Vũ Thị Phương', phone: '0956789016', cccd: '001234567895', gender: 'Nữ', dateOfBirth: '1999-05-17', permanentAddress: '89 Lý Thường Kiệt, Hưng Yên', currentRoomId: 'r9', currentRoomCode: 'P301', occupation: 'Kế toán', licensePlate: '', contractCode: 'HĐ-2024-004', startDate: '2024-03-01', status: 'Sắp hết hạn', debt: 0, notes: 'KHẨN: Liên hệ gia hạn ngay' },
  { id: 't7', fullName: 'Đặng Quốc Hùng', phone: '0967890127', cccd: '001234567896', gender: 'Nam', dateOfBirth: '1994-12-03', permanentAddress: '34 Hoàng Văn Thụ, Bắc Giang', currentRoomId: 'r10', currentRoomCode: 'P302', occupation: 'Lập trình viên', licensePlate: '98A-44556', contractCode: 'HĐ-2025-005', startDate: '2025-03-01', status: 'Đang thuê', debt: 0, notes: '' },
  { id: 't8', fullName: 'Bùi Thị Lan', phone: '0978901238', cccd: '001234567897', gender: 'Nữ', dateOfBirth: '2001-08-25', permanentAddress: '67 Trần Phú, Hà Nam', currentRoomId: 'r11', currentRoomCode: 'PB01', occupation: 'Sinh viên ĐH Bách Khoa', licensePlate: '', contractCode: 'HĐ-2025-006', startDate: '2025-02-15', status: 'Đang thuê', debt: 0, notes: 'Sinh viên năm 3' },
  { id: 't9', fullName: 'Ngô Văn Mạnh', phone: '0989012349', cccd: '001234567898', gender: 'Nam', dateOfBirth: '1996-04-11', permanentAddress: '12 Lê Duẩn, Thái Bình', currentRoomId: 'r15', currentRoomCode: 'PB05', occupation: 'Nhân viên văn phòng', licensePlate: '17A-77889', contractCode: 'HĐ-2025-010', startDate: '2025-01-01', status: 'Đang thuê', debt: 0, notes: 'Khách VIP, hợp đồng 2 năm' },
  { id: 't10', fullName: 'Đinh Thị Nga', phone: '0990123450', cccd: '001234567899', gender: 'Nữ', dateOfBirth: '1998-01-19', permanentAddress: '45 Đinh Tiên Hoàng, Ninh Bình', currentRoomId: 'r18', currentRoomCode: 'PC01', occupation: 'Quản lý chuỗi bán lẻ', licensePlate: '35A-99001', contractCode: 'HĐ-2025-010', startDate: '2025-01-01', status: 'Đang thuê', debt: 0, notes: 'Khách VIP, hợp đồng 2 năm' },
  { id: 't11', fullName: 'Trương Minh Khoa', phone: '0911223344', cccd: '001234567900', gender: 'Nam', dateOfBirth: '1992-06-20', permanentAddress: '90 Nguyễn Trãi, TP HCM', currentRoomId: null, currentRoomCode: null, occupation: 'Freelancer', licensePlate: '51B-22334', contractCode: 'HĐ-2023-002', startDate: '2023-01-01', status: 'Đã trả phòng', debt: 0, notes: 'Đã trả phòng 12/2024' },
  { id: 't12', fullName: 'Lý Thị Hoa', phone: '0922334455', cccd: '001234567901', gender: 'Nữ', dateOfBirth: '2002-03-08', permanentAddress: '15 Phan Đình Phùng, Đà Nẵng', currentRoomId: null, currentRoomCode: null, occupation: 'Sinh viên', licensePlate: '', contractCode: 'HĐ-2024-005', startDate: '2024-09-01', status: 'Nợ tiền', debt: 8500000, notes: 'Nợ 2 tháng tiền thuê, đã nhắc nhiều lần' },
];

// ─── CONTRACTS ────────────────────────────────────────────────────────────────
export const mockContracts: Contract[] = [
  { id: 'c1', code: 'HĐ-2024-001', roomId: 'r1', roomCode: 'P101', roomName: 'Phòng 101', tenantId: 't1', tenantName: 'Nguyễn Văn An', tenantPhone: '0901234561', tenantCCCD: '001234567890', startDate: '2024-01-01', endDate: '2025-01-01', monthlyRent: 3500000, deposit: 7000000, billingCycle: 1, paymentDueDay: 5, status: 'Đã hết hạn', daysUntilExpiry: null, notes: 'Khách ở lâu năm, đáng tin cậy' },
  { id: 'c2', code: 'HĐ-2025-001', roomId: 'r1', roomCode: 'P101', roomName: 'Phòng 101', tenantId: 't1', tenantName: 'Nguyễn Văn An', tenantPhone: '0901234561', tenantCCCD: '001234567890', startDate: '2025-01-01', endDate: '2026-01-01', monthlyRent: 3500000, deposit: 7000000, billingCycle: 1, paymentDueDay: 5, status: 'Đang hiệu lực', daysUntilExpiry: 292, notes: 'Gia hạn lần 2' },
  { id: 'c3', code: 'HĐ-2025-002', roomId: 'r2', roomCode: 'P102', roomName: 'Phòng 102', tenantId: 't2', tenantName: 'Trần Thị Bích', tenantPhone: '0912345672', tenantCCCD: '001234567891', startDate: '2025-03-01', endDate: '2026-03-01', monthlyRent: 3200000, deposit: 6400000, billingCycle: 1, paymentDueDay: 5, status: 'Đang hiệu lực', daysUntilExpiry: 352, notes: '' },
  { id: 'c4', code: 'HĐ-2024-003', roomId: 'r5', roomCode: 'P201', roomName: 'Phòng 201', tenantId: 't3', tenantName: 'Lê Minh Cường', tenantPhone: '0923456783', tenantCCCD: '001234567892', startDate: '2024-06-01', endDate: '2025-06-01', monthlyRent: 4000000, deposit: 8000000, billingCycle: 1, paymentDueDay: 3, status: 'Sắp hết hạn', daysUntilExpiry: 79, notes: 'Khách hay trả trễ 1-2 ngày' },
  { id: 'c5', code: 'HĐ-2025-003', roomId: 'r6', roomCode: 'P202', roomName: 'Phòng 202', tenantId: 't4', tenantName: 'Phạm Thị Dung', tenantPhone: '0934567894', tenantCCCD: '001234567893', startDate: '2025-01-15', endDate: '2026-01-15', monthlyRent: 3800000, deposit: 7600000, billingCycle: 1, paymentDueDay: 10, status: 'Đang hiệu lực', daysUntilExpiry: 306, notes: '' },
  { id: 'c6', code: 'HĐ-2025-004', roomId: 'r7', roomCode: 'P203', roomName: 'Phòng 203', tenantId: 't5', tenantName: 'Hoàng Văn Em', tenantPhone: '0945678905', tenantCCCD: '001234567894', startDate: '2025-02-01', endDate: '2025-08-01', monthlyRent: 3500000, deposit: 7000000, billingCycle: 1, paymentDueDay: 5, status: 'Sắp hết hạn', daysUntilExpiry: 20, notes: 'Hợp đồng ngắn hạn 6 tháng' },
  { id: 'c7', code: 'HĐ-2024-004', roomId: 'r9', roomCode: 'P301', roomName: 'Phòng 301', tenantId: 't6', tenantName: 'Vũ Thị Phương', tenantPhone: '0956789016', tenantCCCD: '001234567895', startDate: '2024-03-01', endDate: '2025-03-01', monthlyRent: 4500000, deposit: 9000000, billingCycle: 1, paymentDueDay: 5, status: 'Sắp hết hạn', daysUntilExpiry: 7, notes: 'KHẨN: Liên hệ gia hạn ngay' },
  { id: 'c8', code: 'HĐ-2025-005', roomId: 'r10', roomCode: 'P302', roomName: 'Phòng 302', tenantId: 't7', tenantName: 'Đặng Quốc Hùng', tenantPhone: '0967890127', tenantCCCD: '001234567896', startDate: '2025-03-01', endDate: '2026-03-01', monthlyRent: 4200000, deposit: 8400000, billingCycle: 1, paymentDueDay: 5, status: 'Đang hiệu lực', daysUntilExpiry: 352, notes: '' },
  { id: 'c9', code: 'HĐ-2025-006', roomId: 'r11', roomCode: 'PB01', roomName: 'Phòng B01', tenantId: 't8', tenantName: 'Bùi Thị Lan', tenantPhone: '0978901238', tenantCCCD: '001234567897', startDate: '2025-02-15', endDate: '2026-02-15', monthlyRent: 2800000, deposit: 5600000, billingCycle: 1, paymentDueDay: 10, status: 'Đang hiệu lực', daysUntilExpiry: 337, notes: 'Sinh viên ĐH Bách Khoa' },
  { id: 'c10', code: 'HĐ-2025-007', roomId: 'r12', roomCode: 'PB02', roomName: 'Phòng B02', tenantId: 't2', tenantName: 'Trần Thị Bích', tenantPhone: '0912345672', tenantCCCD: '001234567891', startDate: '2025-01-01', endDate: '2025-07-01', monthlyRent: 2800000, deposit: 5600000, billingCycle: 1, paymentDueDay: 5, status: 'Đang hiệu lực', daysUntilExpiry: 323, notes: 'Cùng người thuê P102, ở ghép' },
  { id: 'c11', code: 'HĐ-2025-008', roomId: 'r15', roomCode: 'PB05', roomName: 'Phòng B05', tenantId: 't9', tenantName: 'Ngô Văn Mạnh', tenantPhone: '0989012349', tenantCCCD: '001234567898', startDate: '2025-03-01', endDate: '2026-09-01', monthlyRent: 3600000, deposit: 7200000, billingCycle: 1, paymentDueDay: 5, status: 'Đang hiệu lực', daysUntilExpiry: 536, notes: 'Hợp đồng 18 tháng' },
  { id: 'c12', code: 'HĐ-2025-009', roomId: 'r16', roomCode: 'PB06', roomName: 'Phòng B06', tenantId: 't1', tenantName: 'Nguyễn Văn An', tenantPhone: '0901234561', tenantCCCD: '001234567890', startDate: '2025-02-01', endDate: '2026-02-01', monthlyRent: 3600000, deposit: 7200000, billingCycle: 1, paymentDueDay: 5, status: 'Đang hiệu lực', daysUntilExpiry: 323, notes: '' },
  { id: 'c13', code: 'HĐ-2025-010', roomId: 'r18', roomCode: 'PC01', roomName: 'Phòng C01', tenantId: 't10', tenantName: 'Đinh Thị Nga', tenantPhone: '0990123450', tenantCCCD: '001234567899', startDate: '2025-01-01', endDate: '2027-01-01', monthlyRent: 5500000, deposit: 11000000, billingCycle: 1, paymentDueDay: 1, status: 'Đang hiệu lực', daysUntilExpiry: 658, notes: 'Hợp đồng 2 năm, khách VIP' },
  { id: 'c14', code: 'HĐ-2025-011', roomId: 'r19', roomCode: 'PC02', roomName: 'Phòng C02', tenantId: 't6', tenantName: 'Vũ Thị Phương', tenantPhone: '0956789016', tenantCCCD: '001234567895', startDate: '2025-03-01', endDate: '2026-03-01', monthlyRent: 5000000, deposit: 10000000, billingCycle: 1, paymentDueDay: 5, status: 'Đang hiệu lực', daysUntilExpiry: 352, notes: '' },
  { id: 'c15', code: 'HĐ-2023-001', roomId: 'r20', roomCode: 'PC03', roomName: 'Phòng C03', tenantId: 't7', tenantName: 'Đặng Quốc Hùng', tenantPhone: '0967890127', tenantCCCD: '001234567896', startDate: '2023-06-01', endDate: '2024-06-01', monthlyRent: 5000000, deposit: 10000000, billingCycle: 1, paymentDueDay: 5, status: 'Đã chấm dứt', daysUntilExpiry: null, notes: 'Chấm dứt do khách chuyển đi' },
];

// ─── REVENUE DATA ─────────────────────────────────────────────────────────────
export const mockRevenueData: RevenueData[] = [
  { month: 'T9/2024', revenue: 52000000, expenses: 18500000, profit: 33500000, occupancyRate: 72 },
  { month: 'T10/2024', revenue: 55000000, expenses: 21000000, profit: 34000000, occupancyRate: 76 },
  { month: 'T11/2024', revenue: 58000000, expenses: 19800000, profit: 38200000, occupancyRate: 80 },
  { month: 'T12/2024', revenue: 56000000, expenses: 24500000, profit: 31500000, occupancyRate: 78 },
  { month: 'T1/2025', revenue: 60000000, expenses: 22000000, profit: 38000000, occupancyRate: 82 },
  { month: 'T2/2025', revenue: 54000000, expenses: 20000000, profit: 34000000, occupancyRate: 76 },
  { month: 'T3/2025', revenue: 61500000, expenses: 23000000, profit: 38500000, occupancyRate: 80 },
];

// ─── EXPENSES ─────────────────────────────────────────────────────────────────
export const mockExpenses: Expense[] = [
  { id: 'e1', date: '2025-03-01', category: 'Điện', description: 'Tiền điện chung khu A', amount: 2500000, roomId: null, roomCode: null, note: 'Hóa đơn EVN tháng 2' },
  { id: 'e2', date: '2025-03-01', category: 'Nước', description: 'Tiền nước sinh hoạt', amount: 1200000, roomId: null, roomCode: null, note: '' },
  { id: 'e3', date: '2025-03-03', category: 'Bảo trì', description: 'Sửa điện P204', amount: 850000, roomId: 'r8', roomCode: 'P204', note: 'Thay aptomat, đi dây lại' },
  { id: 'e4', date: '2025-03-05', category: 'Internet', description: 'Cáp quang tháng 3', amount: 500000, roomId: null, roomCode: null, note: 'VNPT' },
  { id: 'e5', date: '2025-03-07', category: 'Vệ sinh', description: 'Dọn vệ sinh hành lang', amount: 600000, roomId: null, roomCode: null, note: 'Dịch vụ hàng tuần' },
  { id: 'e6', date: '2025-03-08', category: 'Bảo trì', description: 'Sơn lại tường P103', amount: 1500000, roomId: 'r3', roomCode: 'P103', note: 'Chuẩn bị cho thuê' },
  { id: 'e7', date: '2025-03-10', category: 'Lương', description: 'Lương bảo vệ tháng 3', amount: 4500000, roomId: null, roomCode: null, note: 'Anh Tuấn' },
  { id: 'e8', date: '2025-03-10', category: 'Lương', description: 'Lương tạp vụ tháng 3', amount: 3500000, roomId: null, roomCode: null, note: 'Chị Hoa' },
  { id: 'e9', date: '2025-03-12', category: 'Bảo trì', description: 'Sửa khóa cửa PB07', amount: 200000, roomId: 'r17', roomCode: 'PB07', note: '' },
  { id: 'e10', date: '2025-03-13', category: 'Khác', description: 'Mua bóng đèn LED hành lang', amount: 350000, roomId: null, roomCode: null, note: '10 bóng' },
  { id: 'e11', date: '2025-02-28', category: 'Bảo trì', description: 'Thay vòi nước P301', amount: 180000, roomId: 'r9', roomCode: 'P301', note: '' },
  { id: 'e12', date: '2025-02-25', category: 'Điện', description: 'Tiền điện khu B, C', amount: 3200000, roomId: null, roomCode: null, note: 'EVN tháng 1' },
  { id: 'e13', date: '2025-02-20', category: 'Vệ sinh', description: 'Dọn tổng vệ sinh hàng tháng', amount: 800000, roomId: null, roomCode: null, note: '' },
  { id: 'e14', date: '2025-02-15', category: 'Bảo trì', description: 'Sơn lại cầu thang khu B', amount: 2200000, roomId: null, roomCode: null, note: 'Bảo trì định kỳ' },
  { id: 'e15', date: '2025-01-31', category: 'Khác', description: 'Phí quản lý tòa nhà', amount: 1000000, roomId: null, roomCode: null, note: 'Nộp hàng tháng' },
];

// ─── FACEBOOK POSTS ───────────────────────────────────────────────────────────
export const mockPosts: FacebookPost[] = [
  { id: 'fb1', title: 'Cho thuê phòng P103 - Khu A', content: '🏠 CÒN PHÒNG TRỐNG - Phòng 103 Khu A\n📐 Diện tích: 20m²\n💰 Giá: 3.000.000đ/tháng\n⚡ Điện 3.500đ/kWh | 💧 Nước 15.000đ/m³\n📍 Đường Nguyễn Trãi, Q.Thanh Xuân\n📞 Liên hệ: 0901234567\n✅ Sẵn sàng nhận phòng ngay!', roomId: 'r3', roomCode: 'P103', postType: 'Tuyển khách', channel: 'Facebook Group', plannedDate: '2025-03-15', postedDate: null, status: 'Đã lên lịch', fbLink: null, views: 0, messages: 0, leads: 0, converted: 0, hashtags: '#chothuephong #nhatro #ThanhXuan', price: 3000000, area: 20, assignee: 'Nguyễn Văn Chủ' },
  { id: 'fb2', title: 'Studio C03 cao cấp - View đẹp', content: '✨ STUDIO CAO CẤP TẦNG 2 - Khu C\n📐 35m² - Full nội thất\n💰 5.500.000đ/tháng\n🌟 Vừa cải tạo mới 100%\n📞 0901234567', roomId: 'r20', roomCode: 'PC03', postType: 'Tuyển khách', channel: 'Facebook Page', plannedDate: '2025-03-14', postedDate: null, status: 'Nháp', fbLink: null, views: 0, messages: 0, leads: 0, converted: 0, hashtags: '#studio #caocamp #nhatro', price: 5500000, area: 35, assignee: 'Trần Thị Mai' },
  { id: 'fb3', title: 'Khuyến mãi tháng 3 - Miễn phí tháng đầu', content: '🎉 KHUYẾN MÃI THÁNG 3!\nMiễn 50% tiền thuê tháng đầu cho khách mới\nÁp dụng: P103, PB03, PB07\nHạn: 31/03/2025\n📞 0901234567', roomId: null, roomCode: null, postType: 'Khuyến mãi', channel: 'Facebook Page', plannedDate: '2025-03-10', postedDate: '2025-03-10', status: 'Đã đăng', fbLink: 'https://fb.com/post/123', views: 1842, messages: 23, leads: 8, converted: 2, hashtags: '#khuyenmai #nhatro #uu dai', assignee: 'Nguyễn Văn Chủ' },
  { id: 'fb4', title: 'Phòng B03 - Nhiều cửa sổ', content: '🏠 PHÒNG TRỐNG KHU A\nPhòng B03 - 20m² - Phòng góc nhiều cửa sổ\n💰 3.000.000đ/tháng\nGần trường ĐH, chợ, siêu thị\n📞 0901234567', roomId: 'r13', roomCode: 'PB03', postType: 'Tuyển khách', channel: 'Facebook Group', plannedDate: '2025-03-08', postedDate: '2025-03-08', status: 'Đã đăng', fbLink: 'https://fb.com/post/124', views: 956, messages: 12, leads: 4, converted: 0, hashtags: '#chothuephong #B03 #KhuA', price: 3000000, area: 20, assignee: 'Trần Thị Mai' },
  { id: 'fb5', title: 'Phòng B07 - Tầng 2 khu B', content: '🏠 PHÒNG TRỐNG\nPhòng B07 - Khu B - Tầng 2\nHiện có 1 bạn nữ, tìm thêm 1 bạn nữ\n💰 1.650.000đ/người/tháng\n📞 0901234567', roomId: 'r17', roomCode: 'PB07', postType: 'Tuyển khách', channel: 'Zalo', plannedDate: '2025-02-28', postedDate: '2025-02-28', status: 'Đã đăng', fbLink: null, views: 432, messages: 7, leads: 2, converted: 0, hashtags: '#oghep #B07', price: 1650000, area: 22, assignee: 'Nguyễn Văn Chủ' },
  { id: 'fb6', title: 'Khuyến mãi Tết - Giảm 20%', content: '🧧 CHÚC MỪNG NĂM MỚI!\nGiảm 20% tiền thuê tháng 1 cho khách mới\nÁp dụng tất cả phòng trống\n📞 0901234567', roomId: null, roomCode: null, postType: 'Khuyến mãi', channel: 'Facebook Page', plannedDate: '2025-01-20', postedDate: '2025-01-20', status: 'Đã đăng', fbLink: 'https://fb.com/post/127', views: 3241, messages: 45, leads: 15, converted: 4, hashtags: '#tet2025 #khuyenmai #nhatro', assignee: 'Nguyễn Văn Chủ' },
  { id: 'fb10', title: 'Phòng PC03 Studio cao cấp v2', content: '✨ STUDIO CAO CẤP\nPC03 - 35m² - Tầng 2 Khu C\n💰 5.500.000đ/tháng\nFull nội thất, bếp riêng\n📞 0901234567', roomId: 'r20', roomCode: 'PC03', postType: 'Tuyển khách', channel: 'Facebook Group', plannedDate: '2025-03-18', postedDate: null, status: 'Lỗi', fbLink: null, views: 0, messages: 0, leads: 0, converted: 0, hashtags: '#studio #PC03', price: 5500000, area: 35, assignee: 'Trần Thị Mai' },
  { id: 'fb11', title: 'Thông báo lịch thu tiền tháng 3', content: '📢 LỊCH THU TIỀN THÁNG 3/2025\nKhu A: 5/3\nKhu B: 7/3\nKhu C: 1/3\nVui lòng chuẩn bị đúng hạn', roomId: null, roomCode: null, postType: 'Thông báo', channel: 'Facebook Page', plannedDate: '2025-03-01', postedDate: '2025-03-01', status: 'Đã đăng', fbLink: 'https://fb.com/post/128', views: 892, messages: 3, leads: 0, converted: 0, hashtags: '#thongbao #lichthutien', assignee: 'Nguyễn Văn Chủ' },
  { id: 'fb12', title: 'Phòng PB03 - Cần cho thuê gấp', content: '🔥 CẦN CHO THUÊ GẤP\nPB03 Khu B - 20m²\n💰 Thương lượng cho khách thiện chí\n📞 0901234567 (gọi ngay)', roomId: 'r13', roomCode: 'PB03', postType: 'Tuyển khách', channel: 'Zalo', plannedDate: '2025-03-22', postedDate: null, status: 'Đã lên lịch', fbLink: null, views: 0, messages: 0, leads: 0, converted: 0, hashtags: '#chothuegap #PB03', price: 3000000, area: 20, assignee: 'Trần Thị Mai' },
];

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const mockNotifications: Notification[] = [
  { id: 'n1', type: 'contract_expiry', title: 'Hợp đồng sắp hết hạn', message: 'HĐ P301 (Vũ Thị Phương) hết hạn sau 7 ngày', date: '2025-03-14', read: false, priority: 'high' },
  { id: 'n2', type: 'contract_expiry', title: 'Hợp đồng sắp hết hạn', message: 'HĐ PB02 (Trần Thị Bích) hết hạn sau 14 ngày', date: '2025-03-14', read: false, priority: 'high' },
  { id: 'n3', type: 'contract_expiry', title: 'Hợp đồng sắp hết hạn', message: 'HĐ P203 (Hoàng Văn Em) hết hạn sau 20 ngày', date: '2025-03-14', read: false, priority: 'medium' },
  { id: 'n4', type: 'vacant_room', title: 'Phòng trống chưa có bài đăng', message: 'P103, PB03, PC03 chưa có bài đăng marketing', date: '2025-03-14', read: false, priority: 'high' },
  { id: 'n5', type: 'overdue_payment', title: 'Tiền thuê quá hạn', message: 'P201 (Lê Minh Cường) chưa đóng tiền tháng 3', date: '2025-03-13', read: true, priority: 'medium' },
  { id: 'n6', type: 'maintenance', title: 'Phòng bảo trì', message: 'P204 đang bảo trì, ước tính hoàn thành 20/03', date: '2025-03-10', read: true, priority: 'low' },
];

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
};

export const formatCurrencyShort = (amount: number): string => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}tr`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}k`;
  return amount.toString();
};

export const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export const getRoomStatusColor = (status: RoomStatus): string => {
  switch (status) {
    case 'Đang thuê': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'Trống': return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'Đã đặt': return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'Bảo trì': return 'bg-red-100 text-red-700 border border-red-200';
    default: return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
};

export const getContractStatusColor = (status: ContractStatus): string => {
  switch (status) {
    case 'Đang hiệu lực': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'Sắp hết hạn': return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'Đã hết hạn': return 'bg-red-100 text-red-700 border border-red-200';
    case 'Đã chấm dứt': return 'bg-slate-100 text-slate-600 border border-slate-200';
    default: return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
};

export const getPostStatusColor = (status: PostStatus): string => {
  switch (status) {
    case 'Đã đăng': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'Đã lên lịch': return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'Nháp': return 'bg-slate-100 text-slate-600 border border-slate-200';
    case 'Lỗi': return 'bg-red-100 text-red-700 border border-red-200';
    default: return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
};

export const getTenantStatusColor = (status: TenantStatus): string => {
  switch (status) {
    case 'Đang thuê': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'Sắp hết hạn': return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'Nợ tiền': return 'bg-red-100 text-red-700 border border-red-200';
    case 'Đã trả phòng': return 'bg-slate-100 text-slate-600 border border-slate-200';
    default: return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
};

export const getDashboardStats = () => {
  const totalRooms = mockRooms.length;
  const occupiedRooms = mockRooms.filter(r => r.status === 'Đang thuê').length;
  const vacantRooms = mockRooms.filter(r => r.status === 'Trống').length;
  const reservedRooms = mockRooms.filter(r => r.status === 'Đã đặt').length;
  const maintenanceRooms = mockRooms.filter(r => r.status === 'Bảo trì').length;
  const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);
  const vacancyRate = Math.round((vacantRooms / totalRooms) * 100);

  const activeContracts = mockContracts.filter(c => c.status === 'Đang hiệu lực').length;
  const expiringContracts = mockContracts.filter(c => c.status === 'Sắp hết hạn').length;
  const expiringIn7Days = mockContracts.filter(c => c.daysUntilExpiry !== null && c.daysUntilExpiry <= 7).length;
  const expiringIn30Days = mockContracts.filter(c => c.daysUntilExpiry !== null && c.daysUntilExpiry <= 30).length;

  const currentMonthRevenue = 61500000;
  const currentMonthExpenses = 23000000;
  const currentMonthProfit = currentMonthRevenue - currentMonthExpenses;
  const overdueAmount = 7200000;
  const expectedRevenue = 68000000;

  const vacantWithoutPost = mockRooms.filter(r => r.status === 'Trống' && !r.hasActivePost).length;

  return {
    totalRooms,
    occupiedRooms,
    vacantRooms,
    reservedRooms,
    maintenanceRooms,
    occupancyRate,
    vacancyRate,
    activeContracts,
    expiringContracts,
    expiringIn7Days,
    expiringIn30Days,
    currentMonthRevenue,
    currentMonthExpenses,
    currentMonthProfit,
    overdueAmount,
    expectedRevenue,
    vacantWithoutPost,
  };
};

// ─── CHAT CONVERSATIONS ───────────────────────────────────────────────────────
export const mockConversations: ChatConversation[] = [
  {
    id: 'cv1', customerName: 'Nguyễn Thị Hương', customerAvatar: 'NH', source: 'Facebook Page',
    lastMessage: 'Phòng đó còn không ạ? Em muốn xem thử', lastTime: '5 phút', unreadCount: 3,
    tags: ['Hỏi phòng', 'Hẹn xem phòng'], leadStatus: 'Quan tâm cao', phone: '0912345678',
    interestedRoom: 'P103', budget: 3500000, appointmentDate: '2025-03-16',
    internalNote: 'Khách hỏi P103, muốn xem ngày 16/3', assignee: 'Nguyễn Văn Chủ', interestLevel: 'Cao',
    messages: [
      { id: 'm1', conversationId: 'cv1', sender: 'customer', text: 'Chào shop, em thấy bài đăng phòng P103 ạ', timestamp: '09:15', read: true },
      { id: 'm2', conversationId: 'cv1', sender: 'staff', text: 'Chào bạn Hương! Phòng P103 hiện vẫn còn trống ạ. Bạn muốn biết thêm thông tin gì không?', timestamp: '09:17', read: true },
      { id: 'm3', conversationId: 'cv1', sender: 'customer', text: 'Phòng đó còn không ạ? Em muốn xem thử', timestamp: '09:20', read: false },
    ],
  },
  {
    id: 'cv2', customerName: 'Trần Văn Bình', customerAvatar: 'TB', source: 'Facebook Page',
    lastMessage: 'Giá phòng studio bao nhiêu vậy shop?', lastTime: '12 phút', unreadCount: 1,
    tags: ['Xin giá'], leadStatus: 'Mới', phone: '', interestedRoom: 'PC03', budget: 6000000,
    appointmentDate: '', internalNote: '', assignee: 'Trần Thị Mai', interestLevel: 'Trung bình',
    messages: [
      { id: 'm4', conversationId: 'cv2', sender: 'customer', text: 'Giá phòng studio bao nhiêu vậy shop?', timestamp: '09:08', read: false },
    ],
  },
  {
    id: 'cv3', customerName: 'Lê Thị Cẩm', customerAvatar: 'LC', source: 'Facebook Page',
    lastMessage: 'Ok em sẽ qua xem lúc 3h chiều nay nhé', lastTime: '1 giờ', unreadCount: 0,
    tags: ['Hẹn xem phòng', 'Quan tâm thuê phòng'], leadStatus: 'Đang tư vấn', phone: '0934567890',
    interestedRoom: 'PB07', budget: 3500000, appointmentDate: '2025-03-14',
    internalNote: 'Hẹn xem 3h chiều 14/3, nhớ dọn phòng', assignee: 'Nguyễn Văn Chủ', interestLevel: 'Rất cao',
    messages: [
      { id: 'm5', conversationId: 'cv3', sender: 'customer', text: 'Cho em hỏi phòng B07 còn không ạ?', timestamp: '08:00', read: true },
      { id: 'm6', conversationId: 'cv3', sender: 'staff', text: 'Dạ còn ạ! Phòng 22m², tầng 2, giá 3.300.000đ/tháng. Bạn muốn xem phòng trước không?', timestamp: '08:05', read: true },
      { id: 'm7', conversationId: 'cv3', sender: 'customer', text: 'Được ạ, em muốn xem chiều nay được không?', timestamp: '08:10', read: true },
      { id: 'm8', conversationId: 'cv3', sender: 'staff', text: 'Được ạ! Chiều nay lúc mấy giờ bạn tiện?', timestamp: '08:12', read: true },
      { id: 'm9', conversationId: 'cv3', sender: 'customer', text: 'Ok em sẽ qua xem lúc 3h chiều nay nhé', timestamp: '08:20', read: true },
    ],
  },
  {
    id: 'cv4', customerName: 'Phạm Quốc Dũng', customerAvatar: 'PD', source: 'Facebook Page',
    lastMessage: 'Cảm ơn shop, em sẽ chuyển tiền cọc hôm nay', lastTime: '2 giờ', unreadCount: 0,
    tags: ['Đã chốt'], leadStatus: 'Đã chốt', phone: '0945678901', interestedRoom: 'P104',
    budget: 3000000, appointmentDate: '', internalNote: 'Đã chốt P104, chờ chuyển cọc',
    assignee: 'Trần Thị Mai', interestLevel: 'Rất cao',
    messages: [
      { id: 'm10', conversationId: 'cv4', sender: 'customer', text: 'Shop ơi, em muốn thuê phòng P104', timestamp: '07:00', read: true },
      { id: 'm11', conversationId: 'cv4', sender: 'staff', text: 'Dạ chào bạn! Phòng P104 giá 3.000.000đ/tháng, cọc 2 tháng. Bạn muốn xem phòng trước không?', timestamp: '07:05', read: true },
      { id: 'm12', conversationId: 'cv4', sender: 'customer', text: 'Em đã xem rồi, em muốn đặt cọc luôn ạ', timestamp: '07:30', read: true },
      { id: 'm13', conversationId: 'cv4', sender: 'staff', text: 'Tuyệt vời! Bạn chuyển cọc 6.000.000đ vào STK: 1234567890 - Ngân hàng Vietcombank - Nguyễn Văn Chủ nhé', timestamp: '07:35', read: true },
      { id: 'm14', conversationId: 'cv4', sender: 'customer', text: 'Cảm ơn shop, em sẽ chuyển tiền cọc hôm nay', timestamp: '07:40', read: true },
    ],
  },
  {
    id: 'cv5', customerName: 'Hoàng Thị Lan', customerAvatar: 'HL', source: 'Facebook Page',
    lastMessage: 'Phòng có wifi không shop?', lastTime: '3 giờ', unreadCount: 2,
    tags: ['Hỏi phòng'], leadStatus: 'Mới', phone: '', interestedRoom: 'PB03',
    budget: 3000000, appointmentDate: '', internalNote: '', assignee: 'Nguyễn Văn Chủ', interestLevel: 'Thấp',
    messages: [
      { id: 'm15', conversationId: 'cv5', sender: 'customer', text: 'Phòng có wifi không shop?', timestamp: '06:30', read: false },
      { id: 'm16', conversationId: 'cv5', sender: 'customer', text: 'Và có chỗ để xe không ạ?', timestamp: '06:31', read: false },
    ],
  },
  {
    id: 'cv6', customerName: 'Vũ Minh Tuấn', customerAvatar: 'VT', source: 'Facebook Page',
    lastMessage: 'Cho em xin địa chỉ cụ thể ạ', lastTime: '5 giờ', unreadCount: 0,
    tags: ['Xin giá', 'Hỏi phòng'], leadStatus: 'Đang tư vấn', phone: '0956789012',
    interestedRoom: 'P201', budget: 4500000, appointmentDate: '',
    internalNote: 'Khách hỏi P201, ngân sách cao', assignee: 'Trần Thị Mai', interestLevel: 'Cao',
    messages: [
      { id: 'm17', conversationId: 'cv6', sender: 'customer', text: 'Phòng 201 còn không shop?', timestamp: '04:00', read: true },
      { id: 'm18', conversationId: 'cv6', sender: 'staff', text: 'Hiện P201 đang có người thuê ạ. Bạn muốn xem phòng tương tự không?', timestamp: '04:10', read: true },
      { id: 'm19', conversationId: 'cv6', sender: 'customer', text: 'Cho em xin địa chỉ cụ thể ạ', timestamp: '04:15', read: true },
    ],
  },
  {
    id: 'cv7', customerName: 'Ngô Thị Xuân', customerAvatar: 'NX', source: 'Facebook Page',
    lastMessage: 'Em cần phòng cho 2 người ở, giá khoảng 3-4 triệu', lastTime: 'Hôm qua', unreadCount: 0,
    tags: ['Quan tâm thuê phòng'], leadStatus: 'Đang tư vấn', phone: '0967890123',
    interestedRoom: 'PB05', budget: 4000000, appointmentDate: '',
    internalNote: 'Tìm phòng đôi, ngân sách 3-4tr', assignee: 'Nguyễn Văn Chủ', interestLevel: 'Trung bình',
    messages: [
      { id: 'm20', conversationId: 'cv7', sender: 'customer', text: 'Em cần phòng cho 2 người ở, giá khoảng 3-4 triệu', timestamp: 'Hôm qua 15:00', read: true },
    ],
  },
  {
    id: 'cv8', customerName: 'Đinh Văn Khải', customerAvatar: 'DK', source: 'Facebook Page',
    lastMessage: 'Shop có phòng nào giá dưới 3 triệu không?', lastTime: 'Hôm qua', unreadCount: 1,
    tags: ['Xin giá'], leadStatus: 'Mới', phone: '', interestedRoom: '',
    budget: 3000000, appointmentDate: '', internalNote: '', assignee: 'Trần Thị Mai', interestLevel: 'Thấp',
    messages: [
      { id: 'm21', conversationId: 'cv8', sender: 'customer', text: 'Shop có phòng nào giá dưới 3 triệu không?', timestamp: 'Hôm qua 10:00', read: false },
    ],
  },
];

