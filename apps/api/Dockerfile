FROM python:3.14-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock* ./

RUN uv sync --frozen --no-dev

COPY . .

RUN chmod +x wait-for-db.sh

EXPOSE 8000

ENTRYPOINT ["./wait-for-db.sh"]
CMD ["uv", "run", "python", "manage.py", "runserver", "0.0.0.0:8000"]