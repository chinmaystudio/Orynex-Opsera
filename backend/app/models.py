"""Pydantic v2 schemas for the OrynexOpsera API."""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TaskStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    WAITING_APPROVAL = "waiting_approval"
    BLOCKED = "blocked"
    COMPLETED = "completed"
    FAILED = "failed"


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class AssigneeType(str, Enum):
    UNASSIGNED = "unassigned"
    HUMAN = "human"
    AI_AGENT = "ai_agent"


class LeadStage(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    WON = "won"
    LOST = "lost"


class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class AgentStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    REMOVED = "removed"


class Base(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Record(BaseModel):
    """A stored record: server-managed fields plus entity fields."""

    model_config = ConfigDict(extra="allow")

    id: str
    created_at: str
    updated_at: str


# --- Organizations -----------------------------------------------------------
class OrganizationCreate(Base):
    name: str = Field(min_length=1, max_length=200)
    slug: str | None = None
    owner_email: str | None = None
    plan: str = "starter"


class OrganizationUpdate(Base):
    name: str | None = None
    slug: str | None = None
    owner_email: str | None = None
    plan: str | None = None


# --- Departments -------------------------------------------------------------
class DepartmentCreate(Base):
    organization_id: str
    name: str = Field(min_length=1, max_length=200)
    code: str | None = None
    description: str | None = None
    head_employee_id: str | None = None


class DepartmentUpdate(Base):
    name: str | None = None
    code: str | None = None
    description: str | None = None
    head_employee_id: str | None = None


# --- Employees ---------------------------------------------------------------
class EmployeeCreate(Base):
    organization_id: str
    full_name: str = Field(min_length=1, max_length=200)
    email: str | None = None
    department_id: str | None = None
    role: str = "member"
    job_title: str | None = None
    status: str = "active"


class EmployeeUpdate(Base):
    full_name: str | None = None
    email: str | None = None
    department_id: str | None = None
    role: str | None = None
    job_title: str | None = None
    status: str | None = None


# --- Customers ---------------------------------------------------------------
class CustomerCreate(Base):
    organization_id: str
    name: str = Field(min_length=1, max_length=200)
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    industry: str | None = None
    status: str = "active"
    notes: str | None = None


class CustomerUpdate(Base):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    industry: str | None = None
    status: str | None = None
    notes: str | None = None


# --- Leads -------------------------------------------------------------------
class LeadCreate(Base):
    organization_id: str
    name: str = Field(min_length=1, max_length=200)
    company: str | None = None
    email: str | None = None
    source: str | None = None
    stage: LeadStage = LeadStage.NEW
    value: float = 0.0
    customer_id: str | None = None
    assigned_to: str | None = None


class LeadUpdate(Base):
    name: str | None = None
    company: str | None = None
    email: str | None = None
    source: str | None = None
    stage: LeadStage | None = None
    value: float | None = None
    customer_id: str | None = None
    assigned_to: str | None = None


# --- Tasks (unified human + AI task system, spec §22) ------------------------
class TaskCreate(Base):
    organization_id: str
    title: str = Field(min_length=1, max_length=300)
    description: str | None = None
    department_id: str | None = None
    assignee_type: AssigneeType = AssigneeType.UNASSIGNED
    assignee_id: str | None = None
    priority: Priority = Priority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING
    due_date: str | None = None
    dependencies: list[str] = Field(default_factory=list)
    required_integrations: list[str] = Field(default_factory=list)
    risk_level: RiskLevel = RiskLevel.MEDIUM
    created_by: str | None = None


class TaskUpdate(Base):
    title: str | None = None
    description: str | None = None
    department_id: str | None = None
    assignee_type: AssigneeType | None = None
    assignee_id: str | None = None
    priority: Priority | None = None
    status: TaskStatus | None = None
    due_date: str | None = None
    dependencies: list[str] | None = None
    required_integrations: list[str] | None = None
    risk_level: RiskLevel | None = None


# --- Agents ------------------------------------------------------------------
class AgentInstall(Base):
    organization_id: str
    preset_id: str
    name: str | None = None
    department_id: str | None = None
    llm_model: str | None = None
    system_instructions: str | None = None
    permissions: list[str] | None = None
    risk_ceiling: RiskLevel | None = None


class AgentUpdate(Base):
    name: str | None = None
    department_id: str | None = None
    llm_model: str | None = None
    system_instructions: str | None = None
    permissions: list[str] | None = None
    risk_ceiling: RiskLevel | None = None
    status: AgentStatus | None = None


# --- Approvals ---------------------------------------------------------------
class ApprovalDecision(Base):
    decision: ApprovalStatus  # approved | rejected
    note: str | None = None


# --- Command center ----------------------------------------------------------
class CommandRequest(Base):
    organization_id: str | None = None
    command: str = Field(min_length=1, max_length=4000)
    requested_by: str | None = None


class PlanStep(BaseModel):
    order: int
    action: str
    description: str
    tools: list[str] = Field(default_factory=list)
    risk_level: RiskLevel
    requires_approval: bool


class CommandPlan(BaseModel):
    id: str
    organization_id: str | None
    command: str
    requested_by: str | None
    status: str  # awaiting_approval | planned
    max_risk_level: RiskLevel
    requires_approval: bool
    steps: list[PlanStep]
    execution_status: str  # always "not_executed" in Phase 1
    note: str
    created_at: str


# --- Generic -----------------------------------------------------------------
class GatedResponse(BaseModel):
    """Returned (HTTP 202) when an action is approval-gated instead of executed."""

    gated: bool = True
    message: str
    approval_request: dict[str, Any]
