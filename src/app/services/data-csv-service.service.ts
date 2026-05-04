import { Injectable } from '@angular/core';
import Papa from 'papaparse';

export interface CsvDataPoint {
  [key: string]: string | number;
}

@Injectable({ providedIn: 'root' })
export class DataCsvService {
  private timeColumns = ['Year_UTC', 'Month_UTC', 'Day_UTC', 'Hour_UTC', 'Minute_UTC', 'Second_UTC'];
  private infoColumns = ['Pad', 'Well', 'Stage on Well'];
  private availableDataFields: string[] = [];

  async parseCsvFile(file: File): Promise<CsvDataPoint[]> {
    const content = await this.readFile(file);
    return this.parseCsvContent(content);
  }

  getAvailableDataFields(): string[] {
    return [...this.availableDataFields];
  }

  private readFile(file: File): Promise<string> {
    return file.text(); // simpler modern API
  }

  private parseCsvContent(content: string): CsvDataPoint[] {
    const parsed = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false
    });

    const rows = parsed.data as Record<string, string>[];
    if (!rows.length) return [];

    const headers = Object.keys(rows[0]);
    this.populateAvailableDataFields(headers);

    return rows.map(row => this.transformRow(row)).filter(Boolean) as CsvDataPoint[];
  }

  private transformRow(row: Record<string, string>): CsvDataPoint | null {
    const dataPoint: CsvDataPoint = {};

    // Copy & parse values
    for (const key of Object.keys(row)) {
      if (key && !key.toLowerCase().startsWith('blank')) {
        dataPoint[key] = this.parseValue(row[key]);
      }
    }

    // Handle timestamp
    const timestamp = this.buildTimestamp(row);
    dataPoint['timestamp'] = timestamp;

    return dataPoint;
  }

  private buildTimestamp(row: Record<string, string>): string {
    const hasAllTimeFields = this.timeColumns.every(col => row[col] !== undefined && row[col] !== '');

    if (hasAllTimeFields) {
      const year = parseInt(row['Year_UTC']);
      const month = parseInt(row['Month_UTC']) - 1;
      const day = parseInt(row['Day_UTC']);
      const hour = parseInt(row['Hour_UTC']);
      const minute = parseInt(row['Minute_UTC']);
      const second = parseInt(row['Second_UTC']);

      const date = new Date(Date.UTC(year, month, day, hour, minute, second));

      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    // fallback: current time
    return new Date().toISOString();
  }

  private parseValue(value: string): string | number {
    if (!value || value.toLowerCase() === 'null') return '';
    const num = Number(value);
    return isNaN(num) ? value : num;
  }

  private populateAvailableDataFields(headers: string[]): void {
    this.availableDataFields = headers.filter(
      h =>
        !h.toLowerCase().startsWith('blank') &&
        h !== 'timestamp' &&
        !this.infoColumns.includes(h) &&
        !this.timeColumns.includes(h)
    );
  }
}
