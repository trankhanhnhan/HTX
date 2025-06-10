import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import Papa from "papaparse";
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

  useEffect(() => {
    fetch("./csv/addCompleteNK.csv")
      .then(res => res.text())
      .then(csv => {
        const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true }).data;
        const group = {};
        parsed.forEach(row => {
          if (!row.name || !row.outputQty || isNaN(Number(row.outputQty))) return;
          let date = "";
          const match = row.note && row.note.match(/Ngày hoàn thành: (\d{2}\/\d{2}\/\d{4})/);
          if (match) date = match[1];
          if (!date) return;
          // Lọc theo ngày hoặc tháng được chọn
          if (groupBy === "date" && selectedDate) {
            // selectedDate: yyyy-mm-dd, date: dd/mm/yyyy
            const [d, m, y] = date.split("/");
            const dateStr = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
            if (dateStr !== selectedDate) return;
          }
          if (groupBy === "month" && selectedMonth) {
            // selectedMonth: yyyy-mm, date: dd/mm/yyyy
            const [d, m, y] = date.split("/");
            const monthStr = `${y}-${m.padStart(2, "0")}`;
            if (monthStr !== selectedMonth) return;
          }
          const key = groupBy === "month"
            ? date.split("/")[1] + "/" + date.split("/")[2] // MM/YYYY
            : date; // DD/MM/YYYY
          if (!group[key]) group[key] = {};
          if (!group[key][row.name]) group[key][row.name] = 0;
          group[key][row.name] += Number(row.outputQty);
        });

        let flat = [];
        Object.entries(group).forEach(([date, products]) => {
          Object.entries(products).forEach(([name, qty]) => {
            flat.push({ date, name, qty });
          });
        });

        // Sắp xếp theo sản lượng giảm dần
        flat.sort((a, b) => b.qty - a.qty);

        const chartLabels = flat.map(item => item.name);
        const chartData = flat.map(item => item.qty);

        setLabels(chartLabels);
        setDatasets([
          {
            label: "Sản lượng (kg)",
            data: chartData,
            backgroundColor: "#22c55e"
          }
        ]);
      });
  }, [groupBy, selectedDate, selectedMonth]);

  const maxValue = Math.max(...datasets[0]?.data ?? [0]);

  // Thêm hàm lấy tháng hiện tại
  const getCurrentMonth = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-4">
        Sản lượng sản phẩm theo {groupBy === "date" ? "ngày" : "tháng"}
      </h2>
      <div className="mb-4 flex items-center gap-4">
        <button
          className={`px-3 py-1 rounded mr-2 ${groupBy === "date" ? "bg-green-600 text-white" : "bg-gray-200"}`}
          onClick={() => setGroupBy("date")}
        >Theo ngày</button>
        <button
          className={`px-3 py-1 rounded ${groupBy === "month" ? "bg-green-600 text-white" : "bg-gray-200"}`}
          onClick={() => {
            setGroupBy("month");
            setSelectedMonth(getCurrentMonth());
          }}
        >Theo tháng</button>
        {groupBy === "date" && (
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        )}
        {groupBy === "month" && (
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="border rounded px-2 py-1"
          />
        )}
      </div>
      <Bar
        data={{ labels, datasets }}
        options={{
          responsive: true,
          plugins: {
            legend: { display: false },
            datalabels: {
              anchor: 'end',
              align: 'end',
              color: '#222',
              font: { weight: 'bold', size: 14 },
              formatter: value => value,
              offset: 0,
              clip: false
            },
            tooltip: { enabled: true }
          },
          scales: {
            x: {
              ticks: {
                font: { size: 13 }
              }
            },
            y: {
              beginAtZero: true,
              title: { display: true, font: { size: 13 }, text: "Sản lượng (kg)" },
              suggestedMax: maxValue * 1.1
            }
          }
        }}
        plugins={[ChartDataLabels]}
      />
    </div>
  );
}

export default Report;