// Función para generar datos simulados
export const generateChartData = (baseValue, trend) => {
  const dataPoints = 30;
  const data = [];
  let currentValue = baseValue * 0.8;

  for (let i = 0; i < dataPoints; i++) {
    const randomVariation = (Math.random() - 0.5) * 0.2 * baseValue;
    const trendFactor = trend === 'up' ? 1.02 : trend === 'down' ? 0.98 : 1.001;
    currentValue = Math.max(0, currentValue * trendFactor + randomVariation);
    data.push(Math.round(currentValue));
  }

  return data;
};
