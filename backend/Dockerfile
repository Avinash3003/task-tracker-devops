
FROM python:3.12-slim AS builder

WORKDIR /backend

COPY requirements.txt .

RUN pip install --no-cache-dir --user -r requirements.txt

COPY . .

ENV PATH=/root/.local/bin:$PATH

EXPOSE 8000

ENTRYPOINT [ "uvicorn" ]

CMD ["main:app","--host","0.0.0.0","--port","8000"]