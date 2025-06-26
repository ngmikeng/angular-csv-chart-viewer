import { Component, ChangeDetectorRef, signal } from '@angular/core';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { DataCsvService } from './services/data-csv-service.service';
import { CsvChartViewerService } from './services/csv-chart-viewer-service.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgxEchartsModule], // Import NgxEchartsModule here
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  // The chart options property is now of type EChartsOption
  chartOptions: EChartsOption;

  isLoading = signal(false);
  fileName = signal('');
  errorMessage = signal('');
  isDragging = signal(false);

  constructor(
    private dataCsvService: DataCsvService,
    private previewCsvDataService: CsvChartViewerService,
    private cdr: ChangeDetectorRef
  ) {
    this.chartOptions = this.previewCsvDataService.getChartOptions([]);
  }

  // -- Drag and Drop Event Handlers --

  onDragOver(event: DragEvent) {
    event.preventDefault(); // This is crucial to allow a drop.
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Basic validation for file type
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        this.processFile(file);
      } else {
        this.errorMessage.set('Invalid file type. Please drop a CSV file.');
        this.chartOptions = this.previewCsvDataService.getChartOptions([]);
        this.cdr.detectChanges();
      }
    }
  }

  // -- File Input Handlers --

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.processFile(file);
    }
    // Clear the input so the user can select the same file again
    input.value = '';
  }

  // -- Common File Processing Logic --

  async processFile(file: File) {
    this.fileName.set(file.name);
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const csvData = await this.dataCsvService.parseCsvFile(file);
      if (csvData.length > 0) {
        this.chartOptions = this.previewCsvDataService.getChartOptions(csvData);
      } else {
        this.errorMessage.set('The CSV is empty or invalid. Please check the console for details.');
        this.chartOptions = this.previewCsvDataService.getChartOptions([]);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      this.errorMessage.set('An error occurred while parsing the file.');
      this.chartOptions = this.previewCsvDataService.getChartOptions([]);
    } finally {
      this.isLoading.set(false);
      this.cdr.detectChanges();
    }
  }
}
