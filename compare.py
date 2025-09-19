#!/usr/bin/env python3
"""
Compare current repo root (local) versus a production snapshot directory (default: websim/)
and generate a changes.md summary with Added / Removed / Modified files.

Usage:
  python3 compare.py [-r ROOT] [-b BASE] [-o OUTPUT] [--ignore PATTERN ...] [--note TEXT ...]

Defaults:
  - ROOT:   .
  - BASE:   websim
  - OUTPUT: changes.md

Notes:
  - Files are listed relative to ROOT. Paths under BASE are reported relative to BASE.
  - By default, ignores: .git, node_modules, .DS_Store, the BASE dir during ROOT scan, this
    script itself, and the OUTPUT file.
  - You can pass multiple --ignore globs to add more exclusions.
"""

from __future__ import annotations

import argparse
import fnmatch
import hashlib
import os
import sys
from datetime import datetime, timezone
from typing import Iterable, List, Set, Tuple


def norm(path: str) -> str:
    return path.replace(os.sep, "/")


def iter_files(base_dir: str, *,
               relroot: str,
               exclude_dirs: Iterable[str],
               exclude_files: Iterable[str],
               ignore_globs: Iterable[str]) -> Iterable[str]:
    """Yield file paths relative to relroot with forward slashes."""
    excl_dirs = set(exclude_dirs)
    excl_files = set(exclude_files)
    globs = list(ignore_globs)

    for root, dirs, files in os.walk(base_dir):
        # prune dirs
        pruned = []
        for d in list(dirs):
            if d in excl_dirs:
                pruned.append(d)
                continue
            # Support ignore globs on directory names
            dn = norm(os.path.join(root, d))
            rel_dn = norm(os.path.relpath(dn, relroot))
            if any(fnmatch.fnmatch(rel_dn, pat) for pat in globs):
                pruned.append(d)
        for d in pruned:
            dirs.remove(d)

        for f in files:
            if f in excl_files:
                continue
            fp = os.path.join(root, f)
            rel = norm(os.path.relpath(fp, relroot))
            if any(fnmatch.fnmatch(rel, pat) for pat in globs):
                continue
            # Keep only regular files
            try:
                if not os.path.isfile(fp):
                    continue
            except OSError:
                continue
            yield rel


def sha256_file(path: str, chunk_size: int = 1024 * 1024) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            b = f.read(chunk_size)
            if not b:
                break
            h.update(b)
    return h.hexdigest()


def build_sets(root_dir: str, base_dir: str, *, ignore: List[str], output_file: str) -> Tuple[Set[str], Set[str]]:
    # Exclusions
    exclude_common_dirs = [".git", "node_modules"]
    exclude_common_files = [".DS_Store"]

    # Do not include the BASE directory contents in the ROOT scan
    base_name = norm(os.path.relpath(base_dir, root_dir)).split("/")[0]

    # Exclude the generator and its output from ROOT listing by default
    generator_name = os.path.basename(__file__) if hasattr(sys.modules[__name__], "__file__") else "compare.py"
    exclude_root_files = exclude_common_files + [generator_name, norm(os.path.relpath(output_file, root_dir))]

    root_files = set(
        iter_files(
            root_dir,
            relroot=root_dir,
            exclude_dirs=exclude_common_dirs + [base_name],
            exclude_files=exclude_root_files,
            ignore_globs=ignore,
        )
    )

    # List files under BASE relative to BASE
    base_files = set(
        iter_files(
            base_dir,
            relroot=base_dir,
            exclude_dirs=exclude_common_dirs,
            exclude_files=exclude_common_files,
            ignore_globs=ignore,
        )
    )

    return root_files, base_files


def classify_changes(root_dir: str, base_dir: str, root_files: Set[str], base_files: Set[str]) -> Tuple[List[str], List[str], List[str]]:
    added = sorted(root_files - base_files)
    removed = sorted(base_files - root_files)
    common = sorted(root_files & base_files)

    modified: List[str] = []
    for rel in common:
        lhs = os.path.join(root_dir, rel)
        rhs = os.path.join(base_dir, rel)
        try:
            # Quick size check first
            if os.path.getsize(lhs) != os.path.getsize(rhs):
                modified.append(rel)
                continue
            # Hash compare
            if sha256_file(lhs) != sha256_file(rhs):
                modified.append(rel)
        except FileNotFoundError:
            # If either side disappears mid-run, treat as modified
            modified.append(rel)
    return added, removed, modified


def write_changes_md(output_file: str, base_label: str, added: List[str], removed: List[str], modified: List[str], notes: List[str]) -> None:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
    lines: List[str] = []
    lines.append("Overview")
    lines.append(f"- Compared root (current state) against `{base_label}` (production snapshot).")
    lines.append(f"- Generated: {now} (UTC)")
    lines.append(f"- Summary: {len(added)} added, {len(removed)} removed, {len(modified)} modified files.")
    lines.append("")

    lines.append("Added")
    if added:
        for p in added:
            lines.append(f"- {p}")
    else:
        lines.append("- None")
    lines.append("")

    lines.append("Removed")
    if removed:
        for p in removed:
            lines.append(f"- {p}")
    else:
        lines.append("- None")
    lines.append("")

    lines.append("Modified")
    if modified:
        for p in modified:
            lines.append(f"- {p}")
    else:
        lines.append("- None")
    lines.append("")

    if notes:
        lines.append("Notes")
        for n in notes:
            lines.append(f"- {n}")
        lines.append("")

    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(lines).rstrip() + "\n")


def main(argv: List[str]) -> int:
    parser = argparse.ArgumentParser(description="Generate changes.md by comparing ROOT vs BASE (production snapshot)")
    parser.add_argument("-r", "--root", default=".", help="Root directory (default: '.')")
    parser.add_argument("-b", "--base", default="websim", help="Production/snapshot directory relative to ROOT (default: 'websim')")
    parser.add_argument("-o", "--output", default="changes.md", help="Output markdown file (default: changes.md)")
    parser.add_argument("--ignore", action="append", default=[], help="Glob pattern to ignore (can be repeated)")
    parser.add_argument("--note", action="append", default=[], help="Optional note bullet to include (can be repeated)")
    args = parser.parse_args(argv)

    root_dir = os.path.abspath(args.root)
    base_dir = os.path.abspath(os.path.join(root_dir, args.base))
    output_file = os.path.abspath(os.path.join(root_dir, args.output))

    if not os.path.isdir(root_dir):
        print(f"[ERROR] Root directory not found: {root_dir}", file=sys.stderr)
        return 2
    if not os.path.isdir(base_dir):
        print(f"[ERROR] Base directory not found: {base_dir}", file=sys.stderr)
        return 2

    # Build file sets
    root_files, base_files = build_sets(root_dir, base_dir, ignore=args.ignore, output_file=output_file)

    # Classify
    added, removed, modified = classify_changes(root_dir, base_dir, root_files, base_files)

    # Write output
    write_changes_md(output_file, os.path.relpath(base_dir, root_dir), added, removed, modified, args.note)

    # Print a brief summary for convenience
    print(f"Wrote {os.path.relpath(output_file, root_dir)}")
    print(f"Added: {len(added)}  Removed: {len(removed)}  Modified: {len(modified)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
