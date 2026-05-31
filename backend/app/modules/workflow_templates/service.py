from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.workflow_templates.repository import WorkflowTemplateRepository
from app.modules.workflow_templates.schemas import WorkflowTemplateResponse

BUILTIN_TEMPLATES = [
    {
        "name": "Nhắc nhở thanh toán hàng tháng",
        "description": "Tự động nhắc nhở khách thuê về kỳ thanh toán vào ngày cố định mỗi tháng",
        "trigger": "Hàng tháng vào ngày thanh toán",
        "outcome": "Gửi thông báo nhắc nhở cho tất cả khách thuê chưa thanh toán",
        "module": "tenants",
        "estimated_time": "2 phút",
    },
    {
        "name": "Cảnh báo hợp đồng sắp hết hạn",
        "description": "Tự động phát hiện và cảnh báo hợp đồng hết hạn trong 30 ngày",
        "trigger": "Mỗi ngày lúc 08:00",
        "outcome": "Tạo thông báo cho các hợp đồng sắp hết hạn trong 30 ngày",
        "module": "contracts",
        "estimated_time": "1 phút",
    },
    {
        "name": "Đăng bài tự động phòng trống",
        "description": "Tự động tạo và lên lịch bài đăng cho các phòng vừa trống",
        "trigger": "Khi phòng chuyển sang trạng thái Trống",
        "outcome": "Tạo bài đăng tuyển khách và lên lịch đăng Facebook",
        "module": "posts",
        "estimated_time": "3 phút",
    },
    {
        "name": "Báo cáo vận hành hàng tuần",
        "description": "Tạo tóm tắt tình hình vận hành gửi cho chủ nhà mỗi tuần",
        "trigger": "Thứ Hai hàng tuần lúc 07:00",
        "outcome": "Gửi báo cáo tổng hợp: doanh thu, công nợ, phòng trống qua email",
        "module": "reports",
        "estimated_time": "5 phút",
    },
    {
        "name": "Kiểm tra sức khỏe tài chính",
        "description": "Phân tích tình hình tài chính và cảnh báo khi chi phí vượt ngưỡng",
        "trigger": "Ngày đầu mỗi tháng lúc 09:00",
        "outcome": "Phân tích và gửi cảnh báo khi tỷ lệ chi phí/doanh thu > 70%",
        "module": "expenses",
        "estimated_time": "3 phút",
    },
    {
        "name": "Theo dõi công nợ quá hạn",
        "description": "Quét danh sách khách thuê nợ quá hạn và leo thang cảnh báo",
        "trigger": "Hàng ngày lúc 10:00",
        "outcome": "Cập nhật danh sách nợ quá hạn và tạo cảnh báo ưu tiên cao",
        "module": "tenants",
        "estimated_time": "2 phút",
    },
]


class WorkflowTemplateService:
    def __init__(self, db: AsyncSession):
        self.repo = WorkflowTemplateRepository(db)

    async def ensure_seeded(self) -> None:
        if await self.repo.count() == 0:
            await self.repo.bulk_insert(BUILTIN_TEMPLATES)

    async def list_templates(self) -> list[WorkflowTemplateResponse]:
        await self.ensure_seeded()
        templates = await self.repo.list_all()
        return [WorkflowTemplateResponse.model_validate(t) for t in templates]

    async def get_template(self, template_id: str) -> WorkflowTemplateResponse:
        await self.ensure_seeded()
        t = await self.repo.get_by_id(template_id)
        if not t:
            raise HTTPException(status_code=404, detail="Template không tồn tại")
        return WorkflowTemplateResponse.model_validate(t)
