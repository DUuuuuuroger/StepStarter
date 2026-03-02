from __future__ import annotations

import json
from datetime import date, datetime, timedelta

from backend.app.data.repo import get_report, get_settings, get_stats_range, upsert_report
from backend.app.services.llm_client import LLMClient

DEFAULT_MODEL = "gpt-4o-mini"


def get_period_range(period: str, value: str) -> tuple[str, str]:
    if period == "weekly":
        year_text, week_text = value.split("-W")
        year = int(year_text)
        week = int(week_text)
        start = date.fromisocalendar(year, week, 1)
        end = date.fromisocalendar(year, week, 7)
    elif period == "monthly":
        year_text, month_text = value.split("-")
        year = int(year_text)
        month = int(month_text)
        start = date(year, month, 1)
        if month == 12:
            next_month = date(year + 1, 1, 1)
        else:
            next_month = date(year, month + 1, 1)
        end = next_month - timedelta(days=1)
    elif period == "yearly":
        year = int(value)
        start = date(year, 1, 1)
        end = date(year, 12, 31)
    else:
        raise ValueError("invalid period")
    return start.isoformat(), end.isoformat()


def build_report(period: str, value: str) -> dict:
    start_date, end_date = get_period_range(period, value)
    prev_start, prev_end = get_previous_period_range(period, value)
    stats = get_stats_range(start_date, end_date)
    prev_stats = get_stats_range(prev_start, prev_end)
    completion_rate = (
        round(stats["tasks_completed"] / stats["tasks_created"] * 100)
        if stats["tasks_created"] > 0
        else 0
    )
    prev_completion_rate = (
        round(prev_stats["tasks_completed"] / prev_stats["tasks_created"] * 100)
        if prev_stats["tasks_created"] > 0
        else 0
    )

    metrics = [
        {"label": "启动次数", "value": str(stats["sessions_count"])},
        {"label": "完成率", "value": f"{completion_rate}%"},
        {"label": "总用时", "value": _format_duration(stats["total_duration_seconds"])},
    ]

    ai_payload = _generate_ai_report(
        period,
        value,
        start_date,
        end_date,
        stats,
        completion_rate,
        prev_start,
        prev_end,
        prev_stats,
        prev_completion_rate,
    )

    return {
        "period": period,
        "range": {"start": start_date, "end": end_date},
        "prev_range": {"start": prev_start, "end": prev_end},
        "metrics": metrics,
        "title": ai_payload.get("title", "你的行动报告"),
        "highlights": ai_payload.get("highlights", []),
        "insights": ai_payload.get("insights", []),
        "suggestions": ai_payload.get("suggestions", []),
    }


def get_period_key(period: str, today: date) -> str:
    if period == "weekly":
        iso = today.isocalendar()
        return f"{iso.year}-W{iso.week:02d}"
    if period == "monthly":
        return f"{today.year}-{today.month:02d}"
    if period == "yearly":
        return f"{today.year}"
    raise ValueError("invalid period")


def get_or_generate_reports() -> dict:
    today = date.today()
    results: dict[str, dict] = {}
    for period in ("weekly", "monthly", "yearly"):
        period_key = get_period_key(period, today)
        cached = get_report(period, period_key)
        if cached is None:
            report = build_report(period, period_key)
            generated_at = _now_minute()
            upsert_report(period, period_key, json.dumps(report, ensure_ascii=False), generated_at)
            results[period] = {"generated_at": generated_at, "report": report}
        else:
            results[period] = {
                "generated_at": cached["generated_at"],
                "report": json.loads(cached["content"]),
            }
    return results


def refresh_reports() -> dict:
    today = date.today()
    results: dict[str, dict] = {}
    for period in ("weekly", "monthly", "yearly"):
        period_key = get_period_key(period, today)
        report = build_report(period, period_key)
        generated_at = _now_minute()
        upsert_report(period, period_key, json.dumps(report, ensure_ascii=False), generated_at)
        results[period] = {"generated_at": generated_at, "report": report}
    return results


def _generate_ai_report(
    period: str,
    value: str,
    start_date: str,
    end_date: str,
    stats: dict,
    completion_rate: int,
    prev_start: str,
    prev_end: str,
    prev_stats: dict,
    prev_completion_rate: int,
) -> dict:
    settings = get_settings()
    base_url = settings.get("base_url", "").strip()
    api_key = settings.get("api_key", "").strip()
    model = settings.get("model") or DEFAULT_MODEL
    if not base_url or not api_key:
        raise RuntimeError("base_url and api_key are required in settings")

    system_prompt = (
        "你是一个温和、有洞察的行动复盘助手。"
        "请根据提供的数据生成简短、积极、具体的行动报告。"
        "只返回有效 JSON。"
    )
    user_prompt = (
        "生成报告 JSON，格式如下："
        "{\"title\": \"...\", \"highlights\": [\"...\"], \"insights\": [\"...\"], \"suggestions\": [\"...\"]}。"
        "highlights 2-3 条，insights 2-3 条，suggestions 2-3 条。"
        "语言用中文，语气温和、不评判。"
        "每条可以使用 1-2 个 emoji。"
        "对比上个周期，尽量包含“提升/下降/持平”的对比描述。"
        "用 **加粗** 强调关键词短语。"
        f"周期: {period} ({value})，日期范围: {start_date} ~ {end_date}。"
        f"启动次数: {stats['sessions_count']}，总用时(秒): {stats['total_duration_seconds']}，"
        f"创建任务数: {stats['tasks_created']}，完成任务数: {stats['tasks_completed']}，"
        f"完成率: {completion_rate}%。"
        f"最投入任务: {stats['top_task']['title'] if stats['top_task'] else '无'}。"
        f"上个周期日期范围: {prev_start} ~ {prev_end}。"
        f"上个周期启动次数: {prev_stats['sessions_count']}，总用时(秒): {prev_stats['total_duration_seconds']}，"
        f"创建任务数: {prev_stats['tasks_created']}，完成任务数: {prev_stats['tasks_completed']}，"
        f"完成率: {prev_completion_rate}%。"
        f"上个周期最投入任务: {prev_stats['top_task']['title'] if prev_stats['top_task'] else '无'}。"
    )
    client = LLMClient(base_url=base_url, api_key=api_key, model=model)
    return client.chat_json(system_prompt, user_prompt)


def _format_duration(total_seconds: int) -> str:
    seconds = max(int(total_seconds), 0)
    if seconds == 0:
        return "0:00"
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes}:{secs:02d}"


def _now_minute() -> str:
    return datetime.now().replace(second=0, microsecond=0).strftime("%Y-%m-%d %H:%M")


def get_previous_period_range(period: str, value: str) -> tuple[str, str]:
    if period == "weekly":
        year_text, week_text = value.split("-W")
        year = int(year_text)
        week = int(week_text)
        current_start = date.fromisocalendar(year, week, 1)
        prev_start = current_start - timedelta(days=7)
        prev_end = prev_start + timedelta(days=6)
    elif period == "monthly":
        year_text, month_text = value.split("-")
        year = int(year_text)
        month = int(month_text)
        current_start = date(year, month, 1)
        prev_end = current_start - timedelta(days=1)
        prev_start = date(prev_end.year, prev_end.month, 1)
    elif period == "yearly":
        year = int(value)
        prev_start = date(year - 1, 1, 1)
        prev_end = date(year - 1, 12, 31)
    else:
        raise ValueError("invalid period")
    return prev_start.isoformat(), prev_end.isoformat()
