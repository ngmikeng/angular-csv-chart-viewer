import { Component, ChangeDetectorRef, signal } from '@angular/core';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { DataCsvService } from './services/data-csv-service.service';
import { CsvChartViewerService } from './services/csv-chart-viewer-service.service';
import { FieldSelector } from './components/field-selector/field-selector';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgxEchartsModule, FieldSelector],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  chartOptions: EChartsOption;

  isLoading = signal(false);
  fileName = signal('');
  errorMessage = signal('');
  isDragging = signal(false);
  availableFields= signal<string[]>([]); // Use signal for reactivity
  selectedFields = signal<string[]>([]); // Use signal for reactivity

  constructor(
    private dataCsvService: DataCsvService,
    private csvChartViewerService: CsvChartViewerService,
    private cdr: ChangeDetectorRef
  ) {
    this.chartOptions = this.csvChartViewerService.getChartOptions([]);
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
        this.chartOptions = this.csvChartViewerService.getChartOptions([]);
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
      this.csvChartViewerService.setDataPoints(csvData);
      if (csvData.length > 0) {
        this.chartOptions = this.csvChartViewerService.getChartOptions(csvData);
        this.availableFields.set(this.dataCsvService.getAvailableDataFields());
        this.selectedFields.set(this.csvChartViewerService.getFieldsToPlot()); // Default to first two fields
      } else {
        this.errorMessage.set('The CSV is empty or invalid. Please check the console for details.');
        this.chartOptions = this.csvChartViewerService.getChartOptions([]);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      this.errorMessage.set('An error occurred while parsing the file.');
      this.chartOptions = this.csvChartViewerService.getChartOptions([]);
    } finally {
      this.isLoading.set(false);
      this.cdr.detectChanges();
    }
  }

  onFieldsSelected(fields: string[]) {
    this.selectedFields.set(fields);
    // Update the chart options with the selected fields
    this.chartOptions = this.csvChartViewerService.getChartOptions(
      this.csvChartViewerService.getDataPoints(),
      fields
    );
  }
}
