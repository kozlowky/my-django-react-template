"""
Генератор фикстуры: 30 моков пользователей для accounts.User.

Запуск:
    python scripts/generate_fixture.py > apps/api/accounts/fixtures/users.json

Загрузка:
    docker compose exec api uv run python manage.py loaddata accounts/fixtures/users.json
"""

import json
from datetime import datetime, timezone

NAMES = [
    ("Sofia", "Orlova"), ("Ivan", "Petrov"), ("Maria", "Volkova"),
    ("Dmitry", "Sokolov"), ("Anna", "Morozova"), ("Alexei", "Novikov"),
    ("Elena", "Kozlova"), ("Nikita", "Lebedev"), ("Daria", "Popova"),
    ("Mikhail", "Sobolev"), ("Polina", "Fedorova"), ("Artem", "Kuznetsov"),
    ("Veronika", "Smirnova"), ("Egor", "Zaytsev"), ("Ksenia", "Andreeva"),
    ("Pavel", "Nikitin"), ("Anastasia", "Guseva"), ("Roman", "Stepanov"),
    ("Yulia", "Vinogradova"), ("Kirill", "Tikhonov"), ("Alina", "Pavlova"),
    ("Denis", "Semyonov"), ("Natalia", "Bogdanova"), ("Vadim", "Frolov"),
    ("Irina", "Voronova"), ("Stanislav", "Nesterov"), ("Kristina", "Savina"),
    ("Timur", "Loginov"), ("Olesya", "Ryabova"), ("Gleb", "Cherepanov"),
]

NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# Хэш строки "selted123" — pbkdf2_sha256, Django-совместимый
# Сгенерирован: python -c "from django.contrib.auth.hashers import make_password; print(make_password('selted123'))"
PASSWORD_HASH = "pbkdf2_sha256$870000$YQk3gxcQKlD7pUfFqm1C4w$TdNlJOvxw3N+wZLjmx1xHx44OU9DLtEMriX7MIr3b1I="

fixtures = []
for i, (first, last) in enumerate(NAMES, start=1):
    slug = f"{first.lower()}.{last.lower()}"
    fixtures.append({
        "model": "accounts.user",
        "pk": i,
        "fields": {
            "email": f"{slug}@selted.dev",
            "display_name": f"{first} {last}",
            "password": PASSWORD_HASH,
            "avatar": None,
            "is_active": True,
            "is_staff": False,
            "date_joined": NOW,
            "groups": [],
            "user_permissions": [],
        },
    })

print(json.dumps(fixtures, indent=2, ensure_ascii=False))
