FROM python:3.10-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

FROM base AS build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN python -m venv /opt/venv \
    && . /opt/venv/bin/activate \
    && pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

FROM base AS development
ENV PATH="/opt/venv/bin:${PATH}"
COPY --from=build /opt/venv /opt/venv
COPY . .
EXPOSE 5001
CMD ["flask", "--app", "src.api:app", "run", "--host=0.0.0.0", "--port=5001"]

FROM base AS production
ENV PATH="/opt/venv/bin:${PATH}"
COPY --from=build /opt/venv /opt/venv
COPY . .
RUN useradd -ms /bin/bash mluser && chown -R mluser:mluser /app
USER mluser
EXPOSE 5001
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 \
  CMD python - <<'PY'\nimport urllib.request\ntry:\n    with urllib.request.urlopen('http://localhost:5001/health', timeout=3) as resp:\n        exit(0 if resp.status == 200 else 1)\nexcept Exception:\n    exit(1)\nPY
CMD ["gunicorn", "-b", "0.0.0.0:5001", "src.api:app"]
