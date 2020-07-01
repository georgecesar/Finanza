export default function generateDate(format, input) {
  const date = input ? new Date(input) : new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getHours();
  const seconds = date.getHours();
  const time = date.getTime();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  if (format == "month-day") { return `${month + 1}/${day}` }
  if (format == "monthName") { return monthNames[month] }
  if (format == "day") { return day }
  if (format == "time") { return `${hours}:${minutes}` }
  if (format == "year") { return year }
  return `${date}`
}