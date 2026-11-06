import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Tests must never pick up a developer's real .env / Supabase credentials.
for var in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL"):
    os.environ.pop(var, None)
