FROM python:3.14-slim

WORKDIR /app

# Устанавливаем зависимости
COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

# Копируем код
COPY . .

# Делаем скрипт исполняемым
RUN chmod +x wait-for-db.sh

EXPOSE 8000

ENTRYPOINT ["./wait-for-db.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
