/**
 * iCal feed for Fjellhammer G2010 terminliste
 * Generated at build time as a static file
 *
 * Subscribe URL: https://your-site.com/calendar.ics
 */

import type { APIRoute } from 'astro';
import type { Match } from '../types/index.js';

// Import match data at build time
import matchData from '../../data/terminliste.json';

const matches = matchData as Match[];

// iCal date format: YYYYMMDDTHHMMSS
function formatICalDate(dato: string, tid: string): string {
  const [day, month, year] = dato.split('.');
  const [hour, minute] = tid.split(':');
  return `${year}${month.padStart(2, '0')}${day.padStart(2, '0')}T${hour.padStart(2, '0')}${minute.padStart(2, '0')}00`;
}

// Add 2 hours for match end time (typical handball match duration)
function formatICalEndDate(dato: string, tid: string): string {
  const [day, month, year] = dato.split('.');
  const [hour, minute] = tid.split(':');
  const endHour = (parseInt(hour) + 2) % 24;
  return `${year}${month.padStart(2, '0')}${day.padStart(2, '0')}T${String(endHour).padStart(2, '0')}${minute.padStart(2, '0')}00`;
}

// Escape special characters in iCal text
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

// Generate unique ID for each event
function generateUID(match: Match): string {
  return `${match.Kampnr}@fjellhammer-g2010.no`;
}

function generateICalEvent(match: Match): string {
  const dtstart = formatICalDate(match.Dato, match.Tid);
  const dtend = formatICalEndDate(match.Dato, match.Tid);
  const summary = `${match.Hjemmelag} vs ${match.Bortelag}`;
  const location = escapeICalText(match.Bane);
  const description = escapeICalText(
    `${match.Turnering}\\n` +
    `Lag: ${match.Lag}\\n` +
    (match['H-B'] && match['H-B'] !== '-' ? `Resultat: ${match['H-B']}\\n` : '') +
    (match['Kamp URL'] ? `Kampinfo: ${match['Kamp URL']}` : '')
  );

  return [
    'BEGIN:VEVENT',
    `UID:${generateUID(match)}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART;TZID=Europe/Oslo:${dtstart}`,
    `DTEND;TZID=Europe/Oslo:${dtend}`,
    `SUMMARY:${escapeICalText(summary)}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    match['Kamp URL'] ? `URL:${match['Kamp URL']}` : '',
    'END:VEVENT'
  ].filter(Boolean).join('\r\n');
}

function generateICalFeed(matches: Match[]): string {
  const events = matches.map(generateICalEvent).join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fjellhammer G2010//Terminliste//NO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Fjellhammer G2010 Terminliste',
    'X-WR-TIMEZONE:Europe/Oslo',
    // Timezone definition for Europe/Oslo
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Oslo',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
    events,
    'END:VCALENDAR'
  ].join('\r\n');
}

export const GET: APIRoute = () => {
  const icalContent = generateICalFeed(matches);

  return new Response(icalContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
