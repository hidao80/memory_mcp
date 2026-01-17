# Build stage
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim AS runner
WORKDIR /app
ENV PYTHONUNBUFFERED=1

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser

COPY --from=builder /root/.local /home/appuser/.local
COPY --chown=appuser:appgroup main.py ./
COPY --chown=appuser:appgroup icon.png ./
COPY --chown=appuser:appgroup manifest.json ./

ENV PATH=/home/appuser/.local/bin:$PATH

USER appuser
EXPOSE 58902
CMD ["python", "main.py"]
