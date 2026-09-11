import type { Course } from "@/types/course";

export function uniqueCreditTotal(courses: Course[]): number {
  const seen = new Set<string>();
  let total = 0;
  for (const course of courses) {
    const key = `${course.courseKey}:${course.term}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (typeof course.credits === "number" && Number.isFinite(course.credits)) {
      total += course.credits;
    }
  }
  return total;
}

export function uniqueCourseCount(courses: Course[]): number {
  return new Set(courses.map((course) => `${course.courseKey}:${course.term}`)).size;
}
