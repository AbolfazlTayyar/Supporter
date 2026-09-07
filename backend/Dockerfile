FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .

# sentence-transformers depends on torch. Installed via the default index this pulls the
# CUDA build (multiple GB of NVIDIA packages) even though we only run on CPU here, so
# install the small CPU-only wheel first - the requirements.txt install below then finds
# torch already satisfied and skips it.
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --default-timeout=180 torch --index-url https://download.pytorch.org/whl/cpu
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --default-timeout=180 -r requirements.txt

COPY app ./app

RUN useradd --create-home appuser
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
