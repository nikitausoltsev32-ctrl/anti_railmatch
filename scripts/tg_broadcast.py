"""
Рассылка сообщений участникам группы через личный аккаунт Telegram (Pyrogram).

Использование:
  1. pip install pyrogram tgcrypto
  2. Получи api_id и api_hash на https://my.telegram.org
  3. Создай файл scripts/.env_broadcast:
       API_ID=12345678
       API_HASH=abcdef1234567890
       GROUP_ID=-1001234567890   (или @username группы)
  4. python scripts/tg_broadcast.py --collect       # собрать участников
  5. python scripts/tg_broadcast.py --send --limit 10  # отправить 10 сообщениям
"""

import asyncio
import json
import argparse
import os
import sys
from pathlib import Path
from datetime import datetime

DATA_DIR = Path(__file__).parent / "broadcast_data"
MEMBERS_FILE = DATA_DIR / "members.json"
SENT_FILE = DATA_DIR / "sent.json"
FAILED_FILE = DATA_DIR / "failed.json"

MESSAGE_TEXT = """Привет! 👋

Я разрабатываю платформу RailMatch — биржу грузоперевозок для ж/д логистики.

Буду очень благодарен, если ты потестируешь приложение и дашь обратную связь:
👉 https://anti-railmatch.vercel.app

Займёт 2-3 минуты. Спасибо! 🙏"""


def load_env():
    env_path = Path(__file__).parent / ".env_broadcast"
    if not env_path.exists():
        print(f"Создай файл {env_path} с API_ID, API_HASH, GROUP_ID")
        sys.exit(1)
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, val = line.split("=", 1)
            os.environ[key.strip()] = val.strip()


def load_json(path):
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return []


def save_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


async def collect_members():
    from pyrogram import Client

    api_id = int(os.environ["API_ID"])
    api_hash = os.environ["API_HASH"]
    group_id = os.environ["GROUP_ID"]

    # Попробовать как int (chat_id), иначе как username
    try:
        group_id = int(group_id)
    except ValueError:
        pass

    async with Client("railmatch_session", api_id=api_id, api_hash=api_hash,
                       workdir=str(DATA_DIR)) as app:
        members = []
        async for member in app.get_chat_members(group_id):
            user = member.user
            if user.is_bot or user.is_deleted:
                continue
            members.append({
                "user_id": user.id,
                "first_name": user.first_name or "",
                "last_name": user.last_name or "",
                "username": user.username or "",
            })

        save_json(MEMBERS_FILE, members)
        print(f"Собрано {len(members)} участников → {MEMBERS_FILE}")


async def send_messages(limit: int, dry_run: bool = False):
    from pyrogram import Client
    from pyrogram.errors import FloodWait, UserIsBlocked, PeerIdInvalid, InputUserDeactivated

    api_id = int(os.environ["API_ID"])
    api_hash = os.environ["API_HASH"]

    members = load_json(MEMBERS_FILE)
    sent = set(load_json(SENT_FILE))
    failed = load_json(FAILED_FILE)

    # Отфильтровать уже отправленных
    to_send = [m for m in members if m["user_id"] not in sent]
    to_send = to_send[:limit]

    if not to_send:
        print("Некому отправлять — все уже получили или список пуст.")
        return

    print(f"Будет отправлено: {len(to_send)} сообщений")

    if dry_run:
        for m in to_send:
            name = m["first_name"] + (" " + m["last_name"] if m["last_name"] else "")
            print(f"  [DRY] {name} (@{m['username']}) id={m['user_id']}")
        return

    async with Client("railmatch_session", api_id=api_id, api_hash=api_hash,
                       workdir=str(DATA_DIR)) as app:
        success_count = 0
        for m in to_send:
            name = m["first_name"] + (" " + m["last_name"] if m["last_name"] else "")
            try:
                await app.send_message(m["user_id"], MESSAGE_TEXT)
                sent.add(m["user_id"])
                success_count += 1
                print(f"  ✓ {name} (@{m['username']})")
                # Пауза 30-60 сек между сообщениями
                await asyncio.sleep(45)

            except FloodWait as e:
                print(f"  ⏳ FloodWait {e.value} сек — останавливаюсь. Продолжи завтра.")
                break

            except (UserIsBlocked, PeerIdInvalid, InputUserDeactivated) as e:
                print(f"  ✗ {name}: {type(e).__name__}")
                failed.append({"user_id": m["user_id"], "name": name, "error": type(e).__name__,
                               "date": datetime.now().isoformat()})

            except Exception as e:
                print(f"  ✗ {name}: {e}")
                failed.append({"user_id": m["user_id"], "name": name, "error": str(e),
                               "date": datetime.now().isoformat()})

        save_json(SENT_FILE, list(sent))
        save_json(FAILED_FILE, failed)
        print(f"\nОтправлено: {success_count}/{len(to_send)}")
        print(f"Всего отправлено за всё время: {len(sent)}")
        print(f"Осталось: {len(members) - len(sent)}")


def main():
    load_env()

    parser = argparse.ArgumentParser(description="Рассылка в ТГ")
    parser.add_argument("--collect", action="store_true", help="Собрать участников группы")
    parser.add_argument("--send", action="store_true", help="Отправить сообщения")
    parser.add_argument("--limit", type=int, default=10, help="Сколько отправить (default: 10)")
    parser.add_argument("--dry", action="store_true", help="Показать кому отправим, без отправки")
    parser.add_argument("--stats", action="store_true", help="Статистика")
    args = parser.parse_args()

    if args.stats:
        members = load_json(MEMBERS_FILE)
        sent = load_json(SENT_FILE)
        failed = load_json(FAILED_FILE)
        print(f"Участников: {len(members)}")
        print(f"Отправлено: {len(sent)}")
        print(f"Ошибки: {len(failed)}")
        print(f"Осталось: {len(members) - len(sent)}")
        return

    if args.collect:
        asyncio.run(collect_members())
    elif args.send:
        asyncio.run(send_messages(args.limit, dry_run=args.dry))
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
