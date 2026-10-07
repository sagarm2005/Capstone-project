import os
import logging
from datetime import datetime
import requests

logger = logging.getLogger(__name__)

def get_telegram_config(db):
    """
    Retrieves the Telegram bot token and default chat ID.
    Priority:
    1. db.system_settings collection (configured via Super Admin UI)
    2. Environment variables TELEGRAM_BOT_TOKEN and TELEGRAM_DEFAULT_CHAT_ID
    """
    token = None
    default_chat_id = None

    if db is not None:
        try:
            setting = db.system_settings.find_one({"key": "telegram_config"})
            if setting:
                token = setting.get("bot_token")
                default_chat_id = setting.get("default_chat_id")
        except Exception as e:
            logger.error(f"Error reading telegram_config from DB: {e}")

    if not token:
        token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    if not default_chat_id:
        default_chat_id = os.environ.get("TELEGRAM_DEFAULT_CHAT_ID", "").strip()

    return {
        "bot_token": token or "",
        "default_chat_id": default_chat_id or "",
        "is_configured": bool(token)
    }

def save_telegram_config(db, bot_token, default_chat_id=None):
    """
    Saves the Telegram bot token and default chat ID into MongoDB and os.environ.
    """
    bot_token = (bot_token or "").strip()
    default_chat_id = (default_chat_id or "").strip()

    if db is not None:
        db.system_settings.update_one(
            {"key": "telegram_config"},
            {
                "$set": {
                    "key": "telegram_config",
                    "bot_token": bot_token,
                    "default_chat_id": default_chat_id,
                    "updated_at": datetime.utcnow().isoformat() + "Z"
                }
            },
            upsert=True
        )

    # Also update environment for current process
    if bot_token:
        os.environ["TELEGRAM_BOT_TOKEN"] = bot_token
    if default_chat_id:
        os.environ["TELEGRAM_DEFAULT_CHAT_ID"] = default_chat_id

    return {
        "bot_token": bot_token,
        "default_chat_id": default_chat_id,
        "is_configured": bool(bot_token)
    }

def get_bot_info(bot_token):
    """
    Validates token and fetches bot details from Telegram Bot API getMe.
    """
    if not bot_token:
        return {"ok": False, "error": "No bot token provided"}

    try:
        url = f"https://api.telegram.org/bot{bot_token}/getMe"
        resp = requests.get(url, timeout=10)
        data = resp.json()
        if data.get("ok"):
            bot = data.get("result", {})
            return {
                "ok": True,
                "bot": {
                    "id": bot.get("id"),
                    "first_name": bot.get("first_name"),
                    "username": bot.get("username"),
                    "can_join_groups": bot.get("can_join_groups"),
                    "can_read_all_group_messages": bot.get("can_read_all_group_messages"),
                    "supports_inline_queries": bot.get("supports_inline_queries"),
                }
            }
        else:
            return {"ok": False, "error": data.get("description", "Invalid Bot Token")}
    except Exception as e:
        logger.error(f"Telegram getMe error: {e}")
        return {"ok": False, "error": str(e)}

def get_recent_telegram_updates(bot_token):
    """
    Fetches recent incoming messages (users who typed /start or messaged the bot).
    Allows Super Admin to easily pick users by their actual Telegram chat ID!
    """
    if not bot_token:
        return []

    try:
        url = f"https://api.telegram.org/bot{bot_token}/getUpdates?limit=25"
        resp = requests.get(url, timeout=10)
        data = resp.json()
        if not data.get("ok"):
            return []

        results = data.get("result", [])
        chats_dict = {}

        for update in reversed(results):
            msg = update.get("message") or update.get("edited_message") or update.get("channel_post")
            if not msg:
                continue

            chat = msg.get("chat", {})
            chat_id = str(chat.get("id"))
            if not chat_id:
                continue

            if chat_id not in chats_dict:
                from_user = msg.get("from", {})
                full_name = f"{from_user.get('first_name', '')} {from_user.get('last_name', '')}".strip()
                if not full_name:
                    full_name = chat.get("title") or chat.get("username") or f"Chat {chat_id}"

                chats_dict[chat_id] = {
                    "chat_id": chat_id,
                    "name": full_name,
                    "username": from_user.get("username") or chat.get("username") or "",
                    "type": chat.get("type", "private"),
                    "last_text": msg.get("text", ""),
                    "date": datetime.utcfromtimestamp(msg.get("date", 0)).strftime("%Y-%m-%d %H:%M:%S") if msg.get("date") else ""
                }

        return list(chats_dict.values())
    except Exception as e:
        logger.error(f"Error fetching getUpdates: {e}")
        return []

def format_telegram_message(title, message, priority="normal", sender_name="MediCore Super Admin"):
    """
    Formats the message nicely with HTML styling for Telegram.
    """
    header_icon = "🚨" if priority == "urgent" else "🏥"
    priority_tag = " [URGENT ALERT]" if priority == "urgent" else ""

    text = f"{header_icon} <b>MediCore HMS — Announcement{priority_tag}</b>\n\n"
    if title:
        text += f"📌 <b>{title.strip()}</b>\n\n"
    
    text += f"{message.strip()}\n\n"
    text += f"<i>Dispatched by: {sender_name}</i>\n"
    text += f"<i>System Time: {datetime.utcnow().strftime('%d %b %Y, %H:%M UTC')}</i>"

    return text

def send_telegram_message(bot_token, chat_id, formatted_text):
    """
    Sends a single message to a Telegram chat.
    """
    if not bot_token:
        return {"ok": False, "error": "Bot token not configured"}
    if not chat_id:
        return {"ok": False, "error": "Recipient chat_id is missing"}

    try:
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": formatted_text,
            "parse_mode": "HTML",
            "disable_web_page_preview": True
        }
        resp = requests.post(url, json=payload, timeout=12)
        res_data = resp.json()

        if res_data.get("ok"):
            return {
                "ok": True,
                "message_id": res_data.get("result", {}).get("message_id")
            }
        else:
            return {
                "ok": False,
                "error": res_data.get("description", "Failed to send Telegram message")
            }
    except Exception as e:
        logger.error(f"Error sending telegram message to {chat_id}: {e}")
        return {"ok": False, "error": str(e)}

def dispatch_broadcast(db, title, message, target_type="all", target_user_id=None, custom_chat_id=None, priority="normal", send_telegram=True, send_in_app=True, sender_name="MediCore Super Admin"):
    """
    Executes broadcast delivery across Telegram and in-app notifications.
    target_type: 'all' | 'patients' | 'doctors' | 'specific' | 'custom_chat'
    """
    cfg = get_telegram_config(db)
    bot_token = cfg["bot_token"]

    formatted_text = format_telegram_message(title, message, priority, sender_name)
    telegram_results = []
    in_app_count = 0

    # Determine recipient users for in-app and Telegram
    recipients = []

    if target_type == "custom_chat":
        # Direct Telegram chat ID without registered user
        if custom_chat_id:
            recipients.append({
                "userId": None,
                "name": f"Custom Chat ({custom_chat_id})",
                "telegramChatId": str(custom_chat_id)
            })
    elif target_type == "specific" and target_user_id:
        # Look up specific user in db.users and db.patients
        user = db.users.find_one({"id": int(target_user_id)})
        patient = db.patients.find_one({"id": int(target_user_id)}) if not user else None

        name = (user or patient or {}).get("fullName") or f"User #{target_user_id}"
        telegram_id = custom_chat_id or (user or patient or {}).get("telegramChatId")

        recipients.append({
            "userId": int(target_user_id),
            "name": name,
            "telegramChatId": str(telegram_id) if telegram_id else None
        })
    elif target_type == "patients":
        pts = list(db.patients.find({}))
        for p in pts:
            recipients.append({
                "userId": p.get("id"),
                "name": p.get("fullName", f"Patient #{p.get('id')}"),
                "telegramChatId": p.get("telegramChatId")
            })
    elif target_type == "doctors":
        docs = list(db.doctors.find({}))
        for d in docs:
            recipients.append({
                "userId": d.get("id"),
                "name": d.get("fullName", f"Doctor #{d.get('id')}"),
                "telegramChatId": d.get("telegramChatId")
            })
    else:  # 'all'
        all_users = list(db.users.find({}))
        for u in all_users:
            recipients.append({
                "userId": u.get("id"),
                "name": u.get("fullName", f"User #{u.get('id')}"),
                "telegramChatId": u.get("telegramChatId")
            })

    # If default broadcast chat ID exists and we are doing 'all', add it if not already present
    if target_type in ["all", "patients", "doctors"] and cfg["default_chat_id"]:
        default_id = str(cfg["default_chat_id"])
        if not any(r.get("telegramChatId") == default_id for r in recipients):
            recipients.append({
                "userId": None,
                "name": "Default Broadcast Channel / Group",
                "telegramChatId": default_id
            })

    # 1. Dispatch Telegram messages
    successful_telegram = 0
    failed_telegram = 0

    if send_telegram:
        if not bot_token:
            telegram_results.append({
                "target": "Telegram Disabler",
                "status": "skipped",
                "reason": "Telegram Bot Token is not configured yet. Configure via BotFather."
            })
        else:
            for r in recipients:
                chat_id = r.get("telegramChatId")
                if not chat_id:
                    telegram_results.append({
                        "name": r["name"],
                        "userId": r["userId"],
                        "status": "skipped",
                        "reason": "No Telegram Chat ID linked"
                    })
                    continue

                res = send_telegram_message(bot_token, chat_id, formatted_text)
                if res["ok"]:
                    successful_telegram += 1
                    telegram_results.append({
                        "name": r["name"],
                        "userId": r["userId"],
                        "chatId": chat_id,
                        "status": "delivered",
                        "messageId": res.get("message_id")
                    })
                else:
                    failed_telegram += 1
                    telegram_results.append({
                        "name": r["name"],
                        "userId": r["userId"],
                        "chatId": chat_id,
                        "status": "failed",
                        "error": res.get("error")
                    })

    # 2. Dispatch In-App Notifications
    if send_in_app:
        for r in recipients:
            u_id = r.get("userId")
            if u_id:
                try:
                    # Determine next notification ID
                    last_notif = db.notifications.find_one(sort=[("id", -1)])
                    next_notif_id = (last_notif["id"] + 1) if last_notif and "id" in last_notif else 1

                    db.notifications.insert_one({
                        "id": next_notif_id,
                        "userId": u_id,
                        "type": "announcement",
                        "title": title or "Hospital Announcement",
                        "message": message,
                        "priority": priority,
                        "read": False,
                        "createdAt": datetime.utcnow().isoformat() + "Z"
                    })
                    in_app_count += 1
                except Exception as e:
                    logger.error(f"Error creating in-app notification: {e}")

    # 3. Log into broadcast history
    broadcast_record = {
        "title": title,
        "message": message,
        "targetType": target_type,
        "targetUserId": target_user_id,
        "customChatId": custom_chat_id,
        "priority": priority,
        "sendTelegram": send_telegram,
        "sendInApp": send_in_app,
        "telegramDelivered": successful_telegram,
        "telegramFailed": failed_telegram,
        "inAppCreated": in_app_count,
        "totalRecipients": len(recipients),
        "results": telegram_results,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "sender": sender_name
    }

    try:
        db.broadcast_history.insert_one(broadcast_record)
        # Convert _id to string for JSON serialization
        if "_id" in broadcast_record:
            broadcast_record["_id"] = str(broadcast_record["_id"])
    except Exception as e:
        logger.error(f"Error saving broadcast record: {e}")

    return {
        "success": True,
        "telegramDelivered": successful_telegram,
        "telegramFailed": failed_telegram,
        "inAppCreated": in_app_count,
        "totalRecipients": len(recipients),
        "results": telegram_results,
        "botConfigured": bool(bot_token)
    }
