export type Student = { id: string; name: string; email: string; userId?: string };
export type Group = { id: string; name: string; capacity: number; members: string[]; leader: string };
export type Period = { id: string; supervisor: string; day: number; date: string; start: number; end: number; blocked: boolean };
export type Booking = { id: string; group: string; members: string[]; date: string; start: number; end: number; status: "confirmed" | "completed" | "cancelled"; supervisor: string };
export type Course = { setupVersion?: number; rosterVersion?: number; bookingResetVersion?: number; groupResetVersion?: number; supportAdminVersion?: number; admin: string; students: Student[]; groups: Group[]; periods: Period[]; bookings: Booking[]; settings: { minutes: number; buffer: number; requiredSupervisor: string; staffEmails: string[] } };
export type Identity = { userId: string; email: string; displayName: string };
export const supervisors = ["ANCA-SIMONA HORVATH", "Xiaojun ZHU (TA)", "Yuliang Kang"];
export const BOOKING_END = "2026-12-06";
export function today() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
export function addDays(date: string, n: number) { const d = new Date(date + "T00:00:00+08:00"); d.setUTCDate(d.getUTCDate() + n); return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(d); }
export function weekday(date: string) { return new Date(date + "T12:00:00+08:00").getUTCDay(); }
export function weekStart(date: string) { return addDays(date, -(weekday(date) + 6) % 7); }
export function time(n: number) { return Math.floor(n / 60).toString().padStart(2,"0") + ":" + (n % 60).toString().padStart(2,"0"); }
export function duration(n: number) { return ((Math.floor(n/60) ? Math.floor(n/60)+"h" : "") + (n%60 ? " "+n%60+"m" : "")).trim(); }
export function coverage(c: Course, date: string, start: number, end: number) {
  const periods = c.periods.filter(p => p.date ? p.date === date : p.day === weekday(date));
  if (periods.some(p => p.blocked && p.start < end && p.end > start)) return null;
  return periods.find(p => !p.blocked && p.start <= start && p.end >= end && (!c.settings.requiredSupervisor || p.supervisor === c.settings.requiredSupervisor))?.supervisor ?? null;
}
export function validateBooking(c: Course, b: Booking, now = Date.now()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date) || Number.isNaN(Date.parse(b.date + "T00:00:00+08:00")) || addDays(b.date,0) !== b.date) throw new Error("Select a valid date.");
  if (b.date > BOOKING_END) throw new Error("Reservations close on 6 December 2026 (UTC+8).");
  if (!Number.isInteger(b.start) || !Number.isInteger(b.end) || b.start < 0 || b.end > 1440 || b.start >= b.end || b.start % 30 || b.end % 30) throw new Error("Use a valid time range in 30-minute intervals.");
  if (Date.parse(b.date + "T" + time(b.start) + ":00+08:00") <= now) throw new Error("Reservations must start in the future.");
  const group = c.groups.find(g=>g.id===b.group);
  if (!group || group.members.length !== group.capacity || !group.leader) throw new Error("Complete group registration before booking.");
  if (!Array.isArray(b.members) || !b.members.length || new Set(b.members).size !== b.members.length || b.members.some(id => !group.members.includes(id))) throw new Error("Select participating members of this group.");
  if (b.end - b.start < b.members.length * c.settings.minutes + c.settings.buffer) throw new Error("Allow the recommended printing time and preparation buffer.");
  const supervisor = coverage(c,b.date,b.start,b.end);
  if (!supervisor) throw new Error("An authorized supervisor must cover the entire session.");
  if (c.bookings.some(x=> x.id!==b.id && x.status!=="cancelled" && x.date===b.date && x.start<b.end && x.end>b.start)) throw new Error("This printer is already reserved during that period.");
  b.supervisor = supervisor;
}
