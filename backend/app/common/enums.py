from enum import Enum


class RoomStatus(str, Enum):
    TRONG = "Trống"
    DANG_THUE = "Đang thuê"
    DA_DAT = "Đã đặt"
    BAO_TRI = "Bảo trì"


class ContractStatus(str, Enum):
    DANG_HIEU_LUC = "Đang hiệu lực"
    SAP_HET_HAN = "Sắp hết hạn"
    DA_HET_HAN = "Đã hết hạn"
    DA_CHAM_DUT = "Đã chấm dứt"


class TenantStatus(str, Enum):
    DANG_THUE = "Đang thuê"
    SAP_HET_HAN = "Sắp hết hạn"
    NO_TIEN = "Nợ tiền"
    DA_TRA_PHONG = "Đã trả phòng"


# Uses frontend/src/app/expenses/types.ts values (NOT mockData.ts)
class ExpenseCategory(str, Enum):
    DIEN_NUOC = "Điện nước"
    INTERNET = "Internet"
    VE_SINH = "Vệ sinh"
    SUA_CHUA = "Sửa chữa"
    MUA_SAM = "Mua sắm"
    LUONG = "Lương / quản lý"
    CHI_PHI_KHAC = "Chi phí khác"


class ExpensePaymentStatus(str, Enum):
    DA_THANH_TOAN = "Đã thanh toán"
    CHUA_THANH_TOAN = "Chưa thanh toán"
    CHO_XU_LY = "Chờ xử lý"


class PaymentMethod(str, Enum):
    TIEN_MAT = "Tiền mặt"
    CHUYEN_KHOAN = "Chuyển khoản"
    KHAC = "Khác"


class PostStatus(str, Enum):
    NHAP = "Nháp"
    DA_LEN_LICH = "Đã lên lịch"
    DA_DANG = "Đã đăng"
    LOI = "Lỗi"


class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    STAFF = "staff"


class NotificationType(str, Enum):
    CONTRACT_EXPIRY = "contract_expiry"
    VACANT_ROOM = "vacant_room"
    OVERDUE_PAYMENT = "overdue_payment"
    MAINTENANCE = "maintenance"


class NotificationPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class LeadStatus(str, Enum):
    MOI = "Mới"
    DANG_TU_VAN = "Đang tư vấn"
    QUAN_TAM_CAO = "Quan tâm cao"
    DA_CHOT = "Đã chốt"
    KHONG_QUAN_TAM = "Không quan tâm"


class AutomationStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    ERROR = "error"
    DRAFT = "draft"


class AutomationTriggerType(str, Enum):
    SCHEDULE = "schedule"
    EVENT = "event"
    CONDITION = "condition"


class AutomationFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"


class AutomationModule(str, Enum):
    ROOMS = "rooms"
    CONTRACTS = "contracts"
    TENANTS = "tenants"
    EXPENSES = "expenses"
    REPORTS = "reports"
    POSTS = "posts"
    GENERAL = "general"


class TaskHistoryStatus(str, Enum):
    COMPLETED = "completed"
    RUNNING = "running"
    FAILED = "failed"
    CANCELLED = "cancelled"


class NotifyChannel(str, Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    ZALO = "zalo"


class AgentMessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
