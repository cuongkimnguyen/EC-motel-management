from app.common.enums import (
    RoomStatus, ContractStatus, TenantStatus, ExpenseCategory,
    ExpensePaymentStatus, PaymentMethod, PostStatus, UserRole,
)


def test_room_statuses():
    assert RoomStatus.TRONG == "Trống"
    assert RoomStatus.DANG_THUE == "Đang thuê"
    assert RoomStatus.DA_DAT == "Đã đặt"
    assert RoomStatus.BAO_TRI == "Bảo trì"


def test_contract_statuses():
    assert ContractStatus.DANG_HIEU_LUC == "Đang hiệu lực"
    assert ContractStatus.SAP_HET_HAN == "Sắp hết hạn"
    assert ContractStatus.DA_HET_HAN == "Đã hết hạn"
    assert ContractStatus.DA_CHAM_DUT == "Đã chấm dứt"


def test_expense_category_uses_types_ts_values():
    # IMPORTANT: uses expenses/types.ts values, NOT mockData.ts values
    assert ExpenseCategory.DIEN_NUOC == "Điện nước"
    assert ExpenseCategory.LUONG == "Lương / quản lý"
    assert ExpenseCategory.CHI_PHI_KHAC == "Chi phí khác"
    # These mockData.ts values must NOT exist:
    assert "Bảo trì" not in [e.value for e in ExpenseCategory]
    assert "Điện" not in [e.value for e in ExpenseCategory]
