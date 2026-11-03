#!/bin/sh
set -eu
MOTION_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
python3 "$MOTION_DIR/scripts/motion.py" update --check
printf '\n确认备份并更新此 Skill？输入 y 继续：'
read -r motion_reply
case "$motion_reply" in y|Y) python3 "$MOTION_DIR/scripts/motion.py" update ;; *) printf '已保留当前版本。\n' ;; esac
printf '\n按回车关闭。'
read -r motion_done
