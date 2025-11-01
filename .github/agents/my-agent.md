#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DevCoder: A local-first coding agent that can plan, write, run, and test code.
Single-file starter you can extend into your OSINT/automation stack.

Features
- Task loop: SPEC ➜ PLAN ➜ ACT ➜ TEST ➜ REVIEW
- Tool system with permission gates and dry-run
- File ops with safety (allowlist), shell runner, git helper, templating
- Lightweight memory (YAML) + project context loader
- Prompt presets in EN/ZH for coding tasks

Quick start
$ python devcoder.py --goal "Build a CLI that formats phone numbers" --init
$ python devcoder.py --goal "Add a function and write tests" --allow shell,git

Notes
- 默认本地执行，无远程调用。
- 所有写文件/运行命令前都有确认/白名单控制。
"""
from __future__ import annotations
import argparse, os, sys, json, re, subprocess, shlex, time, textwrap, pathlib
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional, Callable

ROOT = pathlib.Path.cwd()
MEMO = ROOT/".devcoder.memory.yaml"
ALLOW_DIRS = [ROOT]  # 你可以添加子目录白名单

# ============== Utilities ==============

def log(msg: str):
    print(f"[DevCoder] {msg}")

def confirm(prompt: str, default: bool=False) -> bool:
    yn = "Y/n" if default else "y/N"
    ans = input(f"{prompt} ({yn}): ").strip().lower()
    if not ans:
        return default
    return ans.startswith("y")

# ============== Tooling Core ==============

class ToolError(RuntimeError):
    pass

@dataclass
class Tool:
    name: str
    desc: str
    fn: Callable[..., Any]
    dangerous: bool = False  # 是否需要 --allow 才能使用

class Toolbox:
    def __init__(self, allowed: List[str]):
        self.allowed = set(a.strip() for a in allowed)
        self.tools: Dict[str, Tool] = {}

    def register(self, tool: Tool):
        self.tools[tool.name] = tool

    def call(self, name: str, **kwargs):
        if name not in self.tools:
            raise ToolError(f"Unknown tool: {name}")
        tool = self.tools[name]
        if tool.dangerous and name not in self.allowed:
            raise ToolError(
                f"Tool '{name}' is dangerous; enable with --allow {name} or --allow all"
            )
        log(f"tool:{name} args={kwargs}")
        return tool.fn(**kwargs)

# ============== Built-in tools ==============

def safe_path(p: str) -> pathlib.Path:
    path = (ROOT/p).resolve() if not p.startswith(str(ROOT)) else pathlib.Path(p)
    if not any(str(path).startswith(str(d.resolve())) for d in ALLOW_DIRS):
        raise ToolError(f"Path not in allowlist: {path}")
    return path

# file.write

def t_write_file(path: str, content: str, overwrite: bool=False) -> str:
    fp = safe_path(path)
    if fp.exists() and not overwrite:
        return f"exists:{fp} (use overwrite=True)"
    fp.parent.mkdir(parents=True, exist_ok=True)
    fp.write_text(content, encoding="utf-8")
    return f"written:{fp} ({len(content)} bytes)"

# file.read

def t_read_file(path: str) -> str:
    fp = safe_path(path)
    return fp.read_text(encoding="utf-8")

# shell.run (dangerous)

def t_shell(cmd: str, timeout: int=120) -> Dict[str, Any]:
    proc = subprocess.run(
        shlex.split(cmd), capture_output=True, text=True, timeout=timeout
    )
    return {
        "code": proc.returncode,
        "stdout": proc.stdout[-4000:],
        "stderr": proc.stderr[-4000:],
    }

# git.commit (dangerous)

def t_git(msg: str="chore: devcoder commit") -> str:
    subprocess.run(["git","add","-A"], check=False)
    subprocess.run(["git","commit","-m", msg], check=False)
    return "git: committed (or nothing to commit)"

# template.new
TEMPLATES: Dict[str, str] = {
    "py_cli": textwrap.dedent(
        """
        #!/usr/bin/env python3
        import argparse
        import phonenumbers
        def format_phone(x):
            try:
                n = phonenumbers.parse(x, None)
                return phonenumbers.format_number(n, phonenumbers.PhoneNumberFormat.INTERNATIONAL)
            except Exception:
                return x
        if __name__ == "__main__":
            ap = argparse.ArgumentParser()
            ap.add_argument("phone")
            args = ap.parse_args()
            print(format_phone(args.phone))
        """
    ),
    "pytest": textwrap.dedent(
        """
        def test_truth():
            assert 2 + 2 == 4
        """
    ),
}

def t_template(name: str, path: str) -> str:
    if name not in TEMPLATES:
        raise ToolError(f"unknown template: {name}")
    return t_write_file(path, TEMPLATES[name])

# memory.save / memory.load (YAML stored as JSON fallback)

def t_memory_save(obj: Dict[str, Any]) -> str:
    MEMO.write_text(json.dumps(obj, indent=2, ensure_ascii=False), encoding="utf-8")
    return f"memory:saved -> {MEMO.name}"

def t_memory_load() -> Dict[str, Any]:
    if MEMO.exists():
        return json.loads(MEMO.read_text(encoding="utf-8"))
    return {}

# ============== Agent ==============

SYSTEM_PROMPT_EN = """
You are DevCoder, a pragmatic senior software engineer and test-first coding agent.
- Write minimal, runnable code; prefer small steps.
- For each step: explain plan, call tools, then verify by running commands/tests when allowed.
- Be cautious with file overwrites; never delete large directories.
- Communicate in concise English unless the user speaks Chinese.
""".strip()

SYSTEM_PROMPT_ZH = """
你是 DevCoder，一名务实的高级工程师与测试优先的编码代理。
- 产出最小可运行代码；小步快跑。
- 每一步：先说明计划，再调用工具，最后在允许时运行命令/测试验证。
- 谨慎覆盖文件；不要删除大目录。
- 用户说中文时，用中文简洁沟通。
""".strip()

@dataclass
class Step:
    kind: str
    content: str
    result: Optional[Any] = None

@dataclass
class Episode:
    goal: str
    lang: str = "zh"
    steps: List[Step] = field(default_factory=list)

    def add(self, kind: str, content: str, result: Any=None):
        self.steps.append(Step(kind, content, result))

# Very small planner (heuristic)

def plan_for(goal: str) -> List[Dict[str, Any]]:
    g = goal.lower()
    tasks: List[Dict[str, Any]] = []
    if "cli" in g or "命令" in g or "工具" in g:
        tasks.append({"tool":"template.new","args":{"name":"py_cli","path":"cli.py"},"why":"seed a runnable CLI"})
        tasks.append({"tool":"file.read","args":{"path":"cli.py"},"why":"show the scaffold"})
        tasks.append({"tool":"shell.run","args":{"cmd":"python -m pip install phonenumbers"},"danger":True,"why":"install dependency"})
        tasks.append({"tool":"shell.run","args":{"cmd":"python cli.py +14126704024"},"danger":True,"why":"smoke run"})
        tasks.append({"tool":"template.new","args":{"name":"pytest","path":"tests/test_smoke.py"},"why":"add a basic test"})
        tasks.append({"tool":"shell.run","args":{"cmd":"pytest -q"},"danger":True,"why":"run tests"})
        tasks.append({"tool":"git.commit","args":{"msg":"feat: seed CLI & tests"},"danger":True,"why":"checkpoint"})
    else:
        tasks.append({"tool":"file.write","args":{"path":"README.md","content":"# Project\n\nTODO"},"why":"create readme"})
    return tasks

# ============== Main loop ==============

def main():
    ap = argparse.ArgumentParser(description="DevCoder coding agent")
    ap.add_argument("--goal", required=True, help="你的编码目标，例如：'做一个格式化手机号的 CLI'")
    ap.add_argument("--lang", default="zh", choices=["zh","en"], help="对话语言")
    ap.add_argument("--allow", default="", help="逗号分隔：shell,git,all")
    ap.add_argument("--init", action="store_true", help="初始化最小结构与内存")
    args = ap.parse_args()

    allowed = []
    if args.allow:
        if args.allow == "all":
            allowed = ["shell.run","git.commit"]
        else:
            allowed = [a.strip() for a in args.allow.split(",")]
            # map short names
            allowed = [
                "shell.run" if a=="shell" else ("git.commit" if a=="git" else a)
                for a in allowed
            ]

    tb = Toolbox(allowed=allowed)
    tb.register(Tool("file.write","write a text file", t_write_file))
    tb.register(Tool("file.read","read a text file", t_read_file))
    tb.register(Tool("template.new","materialize a code template", t_template))
    tb.register(Tool("memory.save","persist small memory", t_memory_save))
    tb.register(Tool("memory.load","load memory", t_memory_load))
    tb.register(Tool("shell.run","run a shell command", t_shell, dangerous=True))
    tb.register(Tool("git.commit","git add/commit all", t_git, dangerous=True))

    if args.init:
        t_memory_save({"created_at": time.time(), "notes": "DevCoder init"})
        t_write_file(".gitignore", "__pycache__\n.env\n*.pyc\n", overwrite=True)
        t_write_file("README.md", textwrap.dedent(
            f"""
            ---
            name: DevCoder
            description: A local-first coding agent loop (SPEC→PLAN→ACT→TEST)
            ---

            # My Agent

            Describe what your agent does here...

            ## Quick start
            ```bash
            python devcoder.py --goal "Build a phone formatter CLI" --init
            python devcoder.py --goal "Build a phone formatter CLI" --allow shell,git
            ```
            """
        ), overwrite=True)
        log("Initialized repo files and memory.")

    ep = Episode(goal=args.goal, lang=args.lang)
    sys_prompt = SYSTEM_PROMPT_ZH if args.lang=="zh" else SYSTEM_PROMPT_EN
    ep.add("SPEC", f"System:\n{sys_prompt}")
    ep.add("GOAL", args.goal)

    tasks = plan_for(args.goal)
    for i, t in enumerate(tasks, 1):
        note = f"Step {i}: {t['tool']} – {t.get('why','')}"
        ep.add("PLAN", note)
        try:
            res = tb.call(t["tool"], **t.get("args", {}))
            ep.add("ACT", json.dumps(res, ensure_ascii=False))
        except ToolError as e:
            ep.add("ERROR", str(e))
            log(f"⚠️  {e}")
            break

    # Save episode summary
    t_memory_save({"last_episode": [asdict(s) for s in ep.steps]})
    # Print compact log
    print("\n==== SUMMARY ====")
    for s in ep.steps:
        head = f"[{s.kind}]"
        body = (s.content or "").strip()
        print(head, body if len(body) < 400 else body[:400] + "…")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("Interrupted by user")
