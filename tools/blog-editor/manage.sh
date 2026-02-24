#!/bin/bash
# Blog Editor サービス管理スクリプト
# 使い方: ./manage.sh {start|stop|restart|status|log|passwd}

SERVICE="blog-editor"

case "$1" in
  start)
    systemctl --user start "$SERVICE"
    echo "Started. http://localhost:5000"
    ;;
  stop)
    systemctl --user stop "$SERVICE"
    ;;
  restart)
    systemctl --user restart "$SERVICE"
    echo "Restarted. http://localhost:5000"
    ;;
  status)
    systemctl --user status "$SERVICE"
    ;;
  log)
    journalctl --user -u "$SERVICE" -f
    ;;
  passwd)
    echo "パスワード変更: ~/.config/systemd/user/${SERVICE}.service を編集してください"
    echo "  編集後: systemctl --user daemon-reload && ./manage.sh restart"
    ${EDITOR:-vi} ~/.config/systemd/user/"${SERVICE}.service"
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|log|passwd}"
    exit 1
    ;;
esac
