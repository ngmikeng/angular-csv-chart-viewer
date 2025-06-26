import { Injectable } from '@angular/core';
import { EChartsOption } from 'echarts';
import { CsvDataPoint } from './data-csv-service.service';

@Injectable({ providedIn: 'root' })
export class CsvChartViewerService {
  private defaultFieldsToPlot = ['Treating Pressure', 'Slurry Rate', 'Prop Conc', 'Btm Prop Conc'];
  private defaultColors = ['#fc1302', '#00008b', '#228b22', '#ffe033'];

  getChartOptions(data: CsvDataPoint[], fieldsToPlot?: string[]): EChartsOption {
    fieldsToPlot = fieldsToPlot || this.defaultFieldsToPlot;

    // ECharts series requires data in [timestamp, value] format.
    const series = fieldsToPlot.map((field, index) => ({
      name: field.replace(/_/g, ' '),
      type: 'line',
      yAxisIndex: index,
      showSymbol: false, // Hide dots on lines for performance
      data: data.map(d => [
        new Date(d['timestamp'] as string).getTime(),
        typeof d[field] === 'number' ? d[field] : null
      ])
    }));

    // Configure a Y-axis for each series.
    const yAxis = fieldsToPlot.map((field, index) => ({
      type: 'value',
      name: field.replace(/_/g, ' '),
      nameTextStyle: { color: this.defaultColors[index], padding: [0, 0, 0, 60] },
      position: index % 2 === 0 ? 'left' : 'right', // Alternate axes
      offset: (index > 1) ? 60 : 0, // Offset the second right-hand axis
      axisLine: { show: true, lineStyle: { color: this.defaultColors[index] } },
      axisLabel: { color: this.defaultColors[index] },
      splitLine: { show: false } // Only show grid lines for the first y-axis
    }));

    return this.createChartOptions(series, yAxis);
  }

  private createChartOptions(series: any[], yAxis: any[]): EChartsOption {
    if (!series || series.length === 0) {
      // Return a blank chart structure with a no-data message
      return {
        title: {
          text: 'Please upload a CSV file to see the chart.',
          left: 'center',
          top: 'center',
          textStyle: { color: '#666', fontSize: 16 }
        },
        series: []
      };
    }

    return {
      color: this.defaultColors,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      legend: {
        data: series.map(s => s.name),
        top: 10
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '10%'
      },
      xAxis: {
        type: 'time',
        axisLabel: {
          formatter: (value: number) => {
            const date = new Date(value);
            return `${date.toLocaleTimeString()}`;
          }
        }
      },
      yAxis: yAxis,
      series: series,
      dataZoom: [ // Add zooming and panning functionality
        { type: 'inside', start: 0, end: 100 },
        { type: 'slider', start: 0, end: 100 }
      ]
    };
  }
}
