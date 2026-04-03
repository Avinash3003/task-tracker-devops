
FROM python:3.12-slim AS builder

WORKDIR /backend

COPY requirements.txt .


RUN pip install --no-cache-dir --user -r requirements.txt

COPY . .
# --------------- 

FROM python:3.12-slim

WORKDIR /backend

COPY --from=builder /root/.local /root/.local

COPY --from=builder /backend /backend

ENV PATH=/root/.local/bin:$PATH

EXPOSE 8000

CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8000"]