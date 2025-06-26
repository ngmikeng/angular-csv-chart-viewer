import { Injectable } from '@angular/core';

export interface CsvDataPoint {
  [key: string]: string | number;
}

@Injectable({ providedIn: 'root' })
export class DataCsvService {
  private requiredTimeColumns = ['Year_UTC', 'Month_UTC', 'Day_UTC', 'Hour_UTC', 'Minute_UTC', 'Second_UTC'];
  private requiredInfoColumns = ['Pad', 'Well', 'Stage on Well'];

  async parseCsvFile(file: File): Promise<CsvDataPoint[]> {
    const content = await this.readFile(file);
    return this.parseCsvContent(content);
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }

  private parseCsvContent(content: string): CsvDataPoint[] {
    let invalidInfoCount = 0;
    const lines = content.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const result: CsvDataPoint[] = [];

    if (this.requiredTimeColumns.some(col => !headers.includes(col)) || this.requiredInfoColumns.some(col => !headers.includes(col))) {
        console.warn('Missing required columns.');
        return [];
    }

    const colTimeIndexes = Object.fromEntries(this.requiredTimeColumns.map(col => [col, headers.indexOf(col)]));
    const colInfoIndexes = Object.fromEntries(this.requiredInfoColumns.map(col => [col, headers.indexOf(col)]));

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim());
      if (row.length !== headers.length) continue;

      const dataPoint: CsvDataPoint = {};
      for (let j = 0; j < headers.length; j++) {
        const key = headers[j];
        if (key && !key.toLowerCase().startsWith('blank')) {
          dataPoint[key] = this.parseValue(row[j]);
        }
      }

      if (!row[colInfoIndexes['Pad']]?.trim() || !row[colInfoIndexes['Well']]?.trim() || !(parseInt(row[colInfoIndexes['Stage on Well']]) > 0)) {
        invalidInfoCount++;
        continue;
      }

      const year = parseInt(row[colTimeIndexes['Year_UTC']]), month = parseInt(row[colTimeIndexes['Month_UTC']]) - 1, day = parseInt(row[colTimeIndexes['Day_UTC']]), hour = parseInt(row[colTimeIndexes['Hour_UTC']]), minute = parseInt(row[colTimeIndexes['Minute_UTC']]), second = parseInt(row[colTimeIndexes['Second_UTC']]);
      const parsedDatetime = new Date(Date.UTC(year, month, day, hour, minute, second));

      if (isNaN(parsedDatetime.getTime())) continue;

      dataPoint['timestamp'] = parsedDatetime.toISOString();
      result.push(dataPoint);
    }
    if(invalidInfoCount > 0) console.warn('Skipped invalid info rows:', invalidInfoCount);
    return result;
  }

  private parseValue = (value: string): string | number => value === '' || value.toLowerCase() === 'null' ? '' : (isNaN(Number(value)) ? value : Number(value));
}
