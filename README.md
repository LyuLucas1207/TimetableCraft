# Timetable Craft

Frontend-only UBC timetable builder. Upload a Workday **View My Courses** Excel file (parsed in the browser) or add courses by hand. One `Course[]` model feeds the weekly grid and PNG export.

Site: [timetablecraft.com](https://timetablecraft.com)

## Run

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Pages

- `/` landing
- `/tools` `/tools/schedule-maker` schedule builder
- `/guide` `/faq` `/contact`

Languages: English, 中文, Français. Theme: light / dark / system.

Nothing is uploaded. Data stays in `localStorage`.
