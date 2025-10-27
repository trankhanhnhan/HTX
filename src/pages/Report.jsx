import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ChartDataLabels);

function Report() {
  const [labels, setLabels] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [groupBy, setGroupBy] = useState("date");
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedMonth, setSelectedMonth] = useState("");

  // State cho dữ liệu thực tế
  const [products, setProducts] = useState([]);
  const [diaries, setDiaries] = useState([]);
  const [plots, setPlots] = useState([]);
  const [exportedQRs, setExportedQRs] = useState([]);
  const [traces, setTraces] = useState([]);
  const [productTypes, setProductTypes] = useState([]);

  // Lấy API_BASE_URL từ import.meta.env (Vite) hoặc fallback ''
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`).then(r => r.json()).then(setProducts);
    fetch(`${API_BASE_URL}/api/crop-diaries`).then(r => r.json()).then(setDiaries);
    fetch(`${API_BASE_URL}/api/plots`).then(r => r.json()).then(setPlots);
    fetch(`${API_BASE_URL}/api/exported-qr`).then(r => r.json()).then(setExportedQRs);
    fetch(`${API_BASE_URL}/api/trace`).then(r => r.json()).then(setTraces);
    fetch(`${API_BASE_URL}/api/product-types`).then(r => r.json()).then(setProductTypes);
  }, []);

  // Tổng sản lượng đã thu hoạch (kg)
  const totalHarvested = traces.reduce((sum, d) => sum + (parseFloat(d.outputQty) || 0), 0);
  // Giá trị sản xuất (giả sử mỗi kg = 50.000đ)
  const totalValue = totalHarvested * 50000;
  // Tổng diện tích canh tác (ha)
  const totalArea = plots.reduce((sum, p) => sum + (parseFloat(p.area) || 0), 0);
  // Tổng QR đã tạo
  const totalQR = exportedQRs.length;

  // Thống kê bổ sung
  const totalTracedProducts = traces.length;
  const totalDiaries = diaries.length;
  const totalCompletedDiaries = diaries.filter(d => d.stage === 'Hoàn thành').length;

  // Biểu đồ sản lượng theo tháng
  useEffect(() => {
    // Gom sản lượng theo tháng
    const group = {};
    traces.forEach(row => {
      if (!row.name || !row.outputQty || isNaN(Number(row.outputQty))) return;
      let date = row.productionDate || '';
      if (!date) return;
      let day = '', month = '', year = '';
      if (date.includes('-')) {
        // ISO: yyyy-mm-dd
        [year, month, day] = date.split('-');
        if (day && day.includes('T')) day = day.split('T')[0];
      } else if (date.includes('/')) {
        // dd/mm/yyyy
        [day, month, year] = date.split('/');
      }
      const key = `${day}/${month}/${year}`;
      if (!group[key]) group[key] = 0;
      group[key] += Number(row.outputQty);
    });
    setLabels(Object.keys(group));
    setDatasets([
      {
        label: "Sản lượng (kg)",
        data: Object.values(group),
        backgroundColor: "#22c55e"
      }
    ]);
  }, [traces]);

  // Biểu đồ tròn sản phẩm theo loại
  const productTypeCount = productTypes.reduce((acc, p) => {
    acc[p.name] = (acc[p.name] || 0) + 1;
    return acc;
  }, {});
  const pieData = {
    labels: Object.keys(productTypeCount),
    datasets: [{
      data: Object.values(productTypeCount),
      backgroundColor: ['#22c55e', '#3b82f6', '#facc15', '#a78bfa', '#f87171']
    }]
  };

  // Helper: lấy nhật ký cuối cùng của 1 lô
  function getLastDiary(batchCode) {
    return diaries
      .filter(d => d.index === batchCode)
      .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
      .at(0);
  }

  // Tình hình sử dụng đất thực tế chỉ dùng diary
  const growingStages = ['Làm đất', 'Gieo trồng', 'Tưới tiêu', 'Bón phân', 'Phun thuốc'];
  const harvestedStages = ['Thu hoạch'];
  const finishedStages = ['Hoàn thành'];

  const growingDiaries = diaries.filter(d => growingStages.includes(d.stage));
  const harvestedDiaries = diaries.filter(d => harvestedStages.includes(d.stage));
  const finishedDiaries = diaries.filter(d => finishedStages.includes(d.stage));

  // Tổng diện tích đất (từ tất cả nhật ký)
  const totalAreaDiary = plots.reduce((sum, p) => sum + (parseFloat(p.area) || 0), 0);
  const areaGrowing = growingDiaries.reduce((sum, d) => sum + (parseFloat(d.area) || 0), 0);
  const areaHarvested = harvestedDiaries.reduce((sum, d) => sum + (parseFloat(d.area) || 0), 0);
  const areaFinished = finishedDiaries.reduce((sum, d) => sum + (parseFloat(d.area) || 0), 0);
  const areaAvailable = totalAreaDiary - areaGrowing - areaHarvested - areaFinished;

  // Số lô của Có thể trồng phải là tổng số lô trừ các lô đã xuất hiện trong diary
  const allPlotCodes = plots.map(p => p.batchCode);
  const usedPlotCodes = new Set(diaries.map(d => d.index));
  const availablePlotCodes = allPlotCodes.filter(code => !usedPlotCodes.has(code));

  const landStatus = [
    { label: 'Đang trồng', value: areaGrowing, color: 'bg-green-400', lots: new Set(growingDiaries.map(d => d.index)).size },
    { label: 'Có thể trồng', value: areaAvailable > 0 ? areaAvailable : 0, color: 'bg-green-200', lots: availablePlotCodes.length },
    { label: 'Đang thu hoạch', value: areaHarvested, color: 'bg-green-500', lots: new Set(harvestedDiaries.map(d => d.index)).size },
    { label: 'Nghỉ đất', value: areaFinished, color: 'bg-green-300', lots: new Set(finishedDiaries.map(d => d.index)).size }
  ];

  // QR trend 7 ngày gần nhất
  const qrTrend = {
    labels: Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return `${d.getDate()} thg ${d.getMonth() + 1}`;
    }),
    datasets: [{
      label: 'QR Code',
      data: Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dayStr = d.toISOString().slice(0, 10);
        return exportedQRs.filter(qr => qr.exportedAt && qr.exportedAt.startsWith(dayStr)).length;
      }),
      borderColor: '#3b82f6',
      backgroundColor: '#3b82f6',
      tension: 0.3
    }]
  };

  const maxValue = Math.max(...datasets[0]?.data ?? [0]);

  // Thêm hàm lấy tháng hiện tại
  const getCurrentMonth = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-green-700 mb-1">Báo cáo thống kê</h1>
      <div className="text-green-700 mb-6">Phân tích dữ liệu sản xuất và kinh doanh</div>
      {/* Thẻ thống kê */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4 flex flex-col items-start">
          <div className="text-gray-500 text-sm mb-1">Tổng sản lượng</div>
          <div className="text-2xl font-bold text-green-700">{totalHarvested} kg</div>
          <div className="text-xs text-gray-400 mt-1">Sản lượng đã thu hoạch</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 flex flex-col items-start">
          <div className="text-gray-500 text-sm mb-1">Diện tích canh tác</div>
          <div className="text-2xl font-bold text-green-700">{totalArea} ha</div>
          <div className="text-xs text-gray-400 mt-1">Tổng diện tích quản lý</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 flex flex-col items-start">
          <div className="text-gray-500 text-sm mb-1">QR Code</div>
          <div className="text-2xl font-bold text-green-700">{totalQR}</div>
          <div className="text-xs text-gray-400 mt-1">Tổng mã QR đã tạo</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 flex flex-col items-start">
          <div className="text-gray-500 text-sm mb-1">Sản phẩm đã thêm vào truy xuất</div>
          <div className="text-2xl font-bold text-green-700">{totalTracedProducts}</div>
          <div className="text-xs text-gray-400 mt-1">Sản phẩm đã truy xuất</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 flex flex-col items-start">
          <div className="text-gray-500 text-sm mb-1">Nhật ký đã tạo</div>
          <div className="text-2xl font-bold text-green-700">{totalDiaries}</div>
          <div className="text-xs text-gray-400 mt-1">Tổng nhật ký đã tạo</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 flex flex-col items-start">
          <div className="text-gray-500 text-sm mb-1">Nhật ký đã hoàn thành</div>
          <div className="text-2xl font-bold text-green-700">{totalCompletedDiaries}</div>
          <div className="text-xs text-gray-400 mt-1">Nhật ký đã hoàn thành</div>
        </div>
      </div>
      {/* Biểu đồ và phân tích */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="font-semibold mb-2">Sản lượng theo tháng</div>
          <div className="text-xs text-gray-400 mb-2">Diện tích thu hoạch và giá trị sản xuất</div>
          <Bar data={{ labels, datasets }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="font-semibold mb-2">Sản phẩm theo loại</div>
          <div className="text-xs text-gray-400 mb-2">Phân bổ các loại sản phẩm</div>
          <Bar data={pieData} options={{ plugins: { legend: { display: true, position: 'bottom' } } }} type="pie" />
        </div>
      </div>
      {/* Tình hình sử dụng đất & QR trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="font-semibold mb-2">Tình hình sử dụng đất</div>
          <div className="text-xs text-gray-400 mb-2">Phân bố diện tích theo trạng thái</div>
          <div className="space-y-2">
            {landStatus.map((item, idx) => {
              const percent = totalAreaDiary > 0 ? (item.value / totalAreaDiary) * 100 : 0;
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between">
                    <span>{item.label}</span>
                    <span className="ml-2 font-semibold text-green-600">{item.value} ha ({item.lots} lô)</span>
                  </div>
                  <div className="w-full h-2 rounded bg-green-100 mt-1 mb-2">
                    <div className="h-2 rounded bg-green-400" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="font-semibold mb-2">Xu hướng QR Code</div>
          <div className="text-xs text-gray-400 mb-2">Số lượng QR được tạo và quét (7 ngày gần đây)</div>
          <Bar data={qrTrend} options={{ responsive: true, plugins: { legend: { display: false } } }} type="line" />
        </div>
      </div>
      {/* Tóm tắt báo cáo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="font-bold text-green-700 mb-1">Sản xuất</div>
          <div className="text-sm">Sản lượng thu hoạch: <span className="font-semibold">{totalHarvested} kg</span></div>
          <div className="text-sm">Giá trị ước: <span className="font-semibold">{totalValue.toLocaleString()} đ</span></div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="font-bold text-blue-700 mb-1">Đất đai</div>
          <div className="text-sm">Tổng diện tích: <span className="font-semibold">{totalArea} ha</span></div>
          <div className="text-sm">Tỷ lệ sử dụng: <span className="font-semibold">{totalArea > 0 ? ((totalArea - landStatus[1].value) / totalArea * 100).toFixed(0) : 0}%</span></div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="font-bold text-yellow-700 mb-1">Sản phẩm</div>
          <div className="text-sm">Tổng loại SP: <span className="font-semibold">{Object.keys(productTypeCount).length}</span></div>
          <div className="text-sm">Phổ biến nhất: <span className="font-semibold">{Object.entries(productTypeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'}</span></div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="font-bold text-purple-700 mb-1">Truy xuất</div>
          <div className="text-sm">QR Code tạo mới: <span className="font-semibold">{totalQR}</span></div>
          <div className="text-sm">Tỷ lệ quét: <span className="font-semibold">{totalQR > 0 ? ((traces.length / totalQR) * 100).toFixed(0) : 0}%</span></div>
        </div>
      </div>
    </div>
  );
}

export default Report;