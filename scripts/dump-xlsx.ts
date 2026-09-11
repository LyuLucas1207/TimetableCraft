import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";

const buf = new Uint8Array(readFileSync("../Example/View_My_Courses (2).xlsx"));
const wb = XLSX.read(buf, { type: "array", cellDates: true });
const sheet = wb.Sheets[wb.SheetNames[0]];
const keys = Object.keys(sheet).filter((key) => /^[A-Z]+[0-9]+$/i.test(key));
let minRow = Infinity, minCol = Infinity, maxRow = 0, maxCol = 0;
for (const key of keys) {
  const { r, c } = XLSX.utils.decode_cell(key);
  minRow = Math.min(minRow, r);
  minCol = Math.min(minCol, c);
  maxRow = Math.max(maxRow, r);
  maxCol = Math.max(maxCol, c);
}
sheet["!ref"] = XLSX.utils.encode_range({ s: { r: minRow, c: minCol }, e: { r: maxRow, c: maxCol } });
const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "", blankrows: false });
console.log("rows", rows.length);
for (let i = 15; i < Math.min(rows.length, 24); i += 1) {
  const row = rows[i] as unknown[];
  console.log(i, row.map((cell, idx) => `${idx}:${String(cell).slice(0, 40)}`).join(" || "));
}
