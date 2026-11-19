# LeaseLens

What Davis renters should know before they sign.

LeaseLens pulls city permit records, code violations and renter reviews for 30+ Davis properties into one map. Tap a building to see its history, read reviews, file a report, or ask the AI leasing agent a question about it.

Built with the AI Student Collective (AISC) at UC Davis, which I led. Before writing code, we interviewed 20 students and local renters about which sources they trust and which they don't. Those interviews shaped what the app shows first.

## Features

- **Property map** with a bottom sheet for each building: permits, violations and reviews in one place
- **Violation reports** that renters can submit and browse
- **AI leasing agent** (Gemini) that answers questions about a specific property
- **Favorites** and accounts through Supabase Auth

## How it works

- **Data pipeline (Python):** `ingest_city_data.py` and `normalize_data.py` pull and clean City of Davis records, parse addresses with `usaddress`, and `generate_sql.py` / `seed_properties.py` load them into Postgres.
- **Database:** Supabase Postgres with PostGIS, so properties can be queried by map viewport. Schema lives in `supabase/migrations/`.
- **Mobile app:** React Native with Expo Router and TypeScript, `react-native-maps` for the map and `@gorhom/bottom-sheet` for property details.

## Tech stack

TypeScript, React Native, Expo, Supabase, PostgreSQL + PostGIS, Python, pandas, Playwright, Gemini API

## Run it

```bash
# data pipeline
pip install -r requirements.txt
python ingest_city_data.py
python normalize_data.py
python seed_properties.py

# mobile app
cd mobile
npm install
npx expo start
```

You'll need a Supabase project and its URL and anon key in the mobile app's environment.

---
Forked from [ChiefGuap/LeaseLens](https://github.com/ChiefGuap/LeaseLens).
