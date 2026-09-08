# Mini AI Support Agent

این پروژه یک چت‌ بات پشتیبانی است که با هر پیام کاربر یکی از این دو کار را انجام میدهد:

1. **پاسخ از پایگاه دانش (RAG):**  اگر سؤال درباره‌ی اطلاعات عمومی FAQ باشد، از یک پایگاه دانش کوچک در **Chroma** بازیابی انجام میشود و پاسخ با کمک LLM ساخته میشود.
2. **فراخوانی ابزار (Tool Calling):** اگر سؤال نیاز به داده‌ی ساخت‌یافته داشته باشد (مثلاً «وضعیت سفارش من چیست؟»)، یک تابع (Mock Order Lookup) فراخوانی میشود.

تصمیم اینکه کدام مسیر طی شود، توسط یک **گراف LangGraph** به‌صورت خودکار و بر اساس محتوای پیام گرفته میشود. مدل زبانی مورد استفاده از طریق **Groq** (رایگان، سازگار با OpenAI API) فراخوانی میشود.

## Architecture

```
React frontend (رابط چت)
        |
        |  POST /api/v1/chat   { "message": "...", "model": "..." }
        v
FastAPI backend (Python)
        |
        v
LangGraph agent
   ├── گره تصمیم‌گیری:این پیام نیاز به ابزار دارد یا جست‌وجوی سند؟
   ├── مسیر RAG   -> Chroma (Vector DB) -> بخش‌های مرتبط سند -> Groq LLM -> پاسخ
   └── مسیر Tool  -> تابع (مثلاً get_order_status) -> Groq LLM -> پاسخ
        |
        v
   Groq API (اجرای مدل زبانی)
```

## Tech Stack

| لایه              | ابزار                                   | چرا؟ |
|-------------------|------------------------------------------|------|
| ارائه‌دهنده‌ی LLM | **Groq** (`langchain-groq`)              | پلن رایگان، سازگار با API اوپن‌ای‌آی، بسیار سریع |
| orchestration     | **LangChain** + **LangGraph**            | پایپ‌لاین RAG و منطق تصمیم‌گیری ایجنت |
| پایگاه‌داده‌ی برداری | **Chroma**                            | local، رایگان، بدون نیاز به راه‌اندازی سرور جداگانه |
| بک‌اند / API       | **FastAPI**                              | REST API نسخه‌بندی‌شده (`/api/v1/...`) |
| فرانت‌اند          | **React**                                | رابط ساده‌ی چت |
| containerization   | **Docker / docker compose**              | اجرای همزمان بک‌اند و فرانت‌اند با یک دستور |

## Project Structure

```
Supporter/
├── backend/
│   ├── app/
│   │   ├── main.py                # اپلیکیشن FastAPI، CORS، لاگ‌گیری درخواست‌ها
│   │   ├── config.py              # تنظیمات (pydantic-settings) - GROQ_API_KEY, LOG_LEVEL, ...
│   │   ├── exceptions.py          # کلاس‌های خطای سفارشی (AppError و زیرکلاس‌ها)
│   │   ├── error_handlers.py      # تبدیل متمرکز خطاها به پاسخ HTTP
│   │   ├── logging_config.py      # پیکربندی یک‌باره‌ی لاگ‌گیری JSON
│   │   ├── api/
│   │   │   └── routes.py          # روت‌ها: /api/v1/health, /models, /chat
│   │   ├── services/              # منطق کسب‌وکار: گراف LangGraph (agent)، کش مدل‌ها
│   │   ├── data/                  # Chroma، سفارش‌های فیک، کلاینت HTTP گروک
│   │   └── docs/                  # اسناد نمونه‌ی پایگاه دانش
│   ├── tests/                     # تست‌های pytest (هم‌راستا با لایه‌های بالا)
│   ├── requirements.txt           # نسخه‌های دقیق (pin شده)
│   ├── requirements-dev.txt
│   ├── .env.example                # GROQ_API_KEY=...
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── features/chat/
│   │   │   ├── api/                # تنها جایی که fetch به بک‌اند می‌زند
│   │   │   ├── hooks/              # منطق و state
│   │   │   └── components/         # کامپوننت‌های نمایشی
│   │   └── components/             # اجزای کلی اپ (مثل ErrorBoundary)
│   └── package.json
└── README.md
```

## Setup

### 1. گرفتن کلید Groq API

یک کلید دمو به‌صورت جداگانه در پروژه قرار دارد که میتوان از آن استفاده کرد. در غیر این صورت، در [console.groq.com](https://console.groq.com) ثبت‌نام کنید و یک API Key بسازید.

### 2. اجرا با Docker

بک‌اند و فرانت‌اند هر دو در کانتینر اجرا می‌شوند:

```bash
cp backend/.env.example backend/.env   # سپس GROQ_API_KEY خود را داخل آن قرار دهید
docker compose up --build
```

- فرانت‌اند: `http://localhost:5173`
- بک‌اند: `http://localhost:8000`

برای توقف: `docker compose down` (با افزودن `-v` می‌توانید ولیوم Chroma را هم حذف کنید).

## Environment Variables

**بک‌اند** (`backend/.env`):

| متغیر          | توضیح                                              | الزامی؟ |
|----------------|------------------------------------------------------|---------|
| `GROQ_API_KEY` | کلید API رایگان Groq                                 | خیر |
| `LOG_LEVEL`    | سطح لاگ‌گیری (پیش‌فرض: `INFO`)                        | خیر |

**فرانت‌اند** (`frontend/.env`):

| متغیر                  | توضیح                                                                                          | الزامی؟ |
|-------------------------|--------------------------------------------------------------------------------------------------|---------|
| `VITE_API_BASE_URL`     | آدرس بک‌اند (پیش‌فرض: `http://localhost:8000`). در Docker چون Vite در زمان build مقدار را جای‌گذاری میکند، باید به‌صورت build `ARG` تنظیم شود، نه متغیر runtime. | خیر |
