import ReactApexChartsModule from "react-apexcharts";

// Vite can expose this CommonJS package as either the component itself
// or a nested default export object depending on interop mode.
const ReactApexChart =
  ReactApexChartsModule?.default?.default ??
  ReactApexChartsModule?.default ??
  ReactApexChartsModule;

export default ReactApexChart;
