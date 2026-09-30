// Google Workspace Service
// Integrates Google Calendar, Google Drive, Google Sheets, and Gmail

export interface GoogleCalendarEventPayload {
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes: number;
  location?: string;
  attendees?: string[];
}

export interface GoogleSheetsExportPayload {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface GmailNotificationPayload {
  to: string;
  subject: string;
  body: string;
}

class WorkspaceService {
  private clientConfig = {
    projectId: 'gen-lang-client-0082946117',
    clientId: '165701882364-rpeb5k74utg5ugb0877ucm9p9f0fb529.apps.googleusercontent.com'
  };

  // Google Calendar: Generate instant Add to Google Calendar web link
  public createGoogleCalendarUrl(payload: GoogleCalendarEventPayload): string {
    const [year, month, day] = payload.startDate.split('-');
    const [hour, minute] = payload.startTime.split(':');

    const startDateTime = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    );
    const endDateTime = new Date(startDateTime.getTime() + payload.durationMinutes * 60000);

    const formatGCalTime = (d: Date) =>
      d.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: payload.title,
      details: payload.description,
      location: payload.location || 'GIHS Corporativo • Google Meet / Presencial',
      dates: `${formatGCalTime(startDateTime)}/${formatGCalTime(endDateTime)}`
    });

    if (payload.attendees && payload.attendees.length > 0) {
      params.append('add', payload.attendees.join(','));
    }

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  // Google Sheets: Create CSV download & instant Google Sheets importer URL
  public exportToGoogleSheets(payload: GoogleSheetsExportPayload): { csvBlob: Blob; googleSheetsUrl: string } {
    const csvContent = [
      payload.headers.join(','),
      ...payload.rows.map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? '').replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',')
      )
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const googleSheetsUrl = 'https://docs.google.com/spreadsheets/u/0/create';

    return { csvBlob: blob, googleSheetsUrl };
  }

  // Google Drive: Generate Google Drive link for project folder / docs
  public getGoogleDriveUrl(): string {
    return 'https://drive.google.com/drive/my-drive';
  }

  // Gmail: Generate instant compose email URL for notifications
  public createGmailComposeUrl(payload: GmailNotificationPayload): string {
    const params = new URLSearchParams({
      view: 'cm',
      fs: '1',
      to: payload.to,
      su: payload.subject,
      body: payload.body
    });
    return `https://mail.google.com/mail/?${params.toString()}`;
  }
}

export const workspaceService = new WorkspaceService();
