import { env } from "./config/env";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// PENTING: login ulang dulu di browser, ambil access_token BARU (jangan yang lama)
const TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjM2OGM4ZTE1LWY2ZjAtNDk4YS1iZDliLWIzZjc2YThkNmNmNyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3VpYWFpdGhtbHpseXBqeGxmamVuLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJkZDY4NzQ2Yy00MWQ3LTQ2ZDQtYWMxZS05OGUwYTEzYjBjM2IiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzkwMTY1NzE5LCJpYXQiOjE3OTAxNjIxMTksImVtYWlsIjoiYWRtaW4xQHBlbnVudHVuLnRlc3QiLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc5MDE2MjExOX1dLCJzZXNzaW9uX2lkIjoiOTZiOTgxMDctNzFiNy00ZGQ5LWIyMDgtZDc0YmFmN2EwZTU0IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.A6_v8qWslVvRHjgDHJqsFN1T8m36k7WNEmRuKU3tHJZr_ZlK7k3ANlkntYCdQCXN6tzqUtoDwRAG0dscu3CMuA";

supabase.auth.getUser(TOKEN).then(({ data, error }) => {
  console.log("DATA:", JSON.stringify(data, null, 2));
  console.log("ERROR:", JSON.stringify(error, null, 2));
});

