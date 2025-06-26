import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NgxEchartsModule } from 'ngx-echarts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([]),
    // Provide ngx-echarts and lazily load the ECharts library
    importProvidersFrom(NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    }))
  ]
};
