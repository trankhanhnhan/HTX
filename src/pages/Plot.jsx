import React, { useState, useEffect } from "react";
import { Edit } from "lucide-react";
import { API_BASE_URL } from '../services/api';
import { usePlots } from '../hooks/dataHooks';

function Plot() {
  const [showForm, setShowForm] = useState(false);
  const [plots, setPlots] = useState([]);
  usePlots(setPlots); // Sử dụng hook để đồng bộ dữ liệu lô đất
  const [crops, setCrops] = useState([]);
  const [form, setForm] = useState({
    code: "",
    area: "",
    unit: "ha",
  });
  const [error, setError] = useState("");
  const [editPlot, setEditPlot] = useState(null); // plot đang chỉnh sửa
  const [editForm, setEditForm] = useState({ code: "", area: "" });

  // Lấy danh sách lô đất kèm cây trồng từ backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/plots-with-crops`)
      .then(res => res.json())
      .then(data => setPlots(data));
    return () => {
      setPlots([]); // Reset khi unmount để tránh dữ liệu cũ
    };
  }, []);

  useEffect(() => {
  }, [plots]);

  // Đăng ký lô mới
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/plots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchCode: form.code, area: form.area })
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setForm({ code: '', area: '', unit: 'ha' });
      } else {
        setError(data.message || 'Thêm lô đất thất bại');
      }
    } catch (err) {
      setError('Lỗi khi thêm lô đất');
    }
  };

  // Ghép cây trồng vào từng lô
  const getCropsOfPlot = (batchCode) =>
    crops.filter(crop => crop.batchCode === batchCode && !crop.removedFromPlot);

  // Tính diện tích trồng và diện tích trống
  const getTotalCropArea = (batchCode) =>
    getCropsOfPlot(batchCode).reduce((sum, crop) => sum + crop.area, 0);

  // Hàm mở form sửa
  const handleEditClick = (plot) => {
    setEditPlot(plot.batchCode); // batchCode cũ
    setEditForm({ code: plot.batchCode, area: plot.area, unit: "ha" });
  };

  // Hàm submit sửa
  const handleEditSubmit = async (areaHa) => {
    // Luôn truyền batchCode cũ vào URL, batchCode mới vào body (nếu cho phép sửa mã lô)
    const res = await fetch(`${API_BASE_URL}/plots/${editPlot}`, {
      method: "PUT", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchCode: editForm.code, area: areaHa })
    });
    const data = await res.json();
    if (data.success) {
      setEditPlot(null);
      alert("Cập nhật thành công!");
    } else {
      alert(data.message || "Có lỗi xảy ra!");
    }
  };

  function formatNumberAuto(num) {
    if (Number.isInteger(num)) return num;
    return Number(num).toLocaleString(undefined, { maximumFractionDigits: 4 });
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Quản lý lô đất</h2>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={() => setShowForm(true)}
        >
          Đăng ký mã lô
        </button>
      </div>

      {/* Form đăng ký mã lô */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Đăng ký mã lô đất mới</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mã lô</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Diện tích</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    className="w-full border px-3 py-2 rounded"
                    value={form.area}
                    onChange={e => setForm({ ...form, area: e.target.value })}
                    required
                  />
                  <select
                    className="border px-2 py-2 rounded"
                    value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                  >
                    <option value="ha">ha</option>
                    <option value="m2">m²</option>
                  </select>
                </div>
                <div className="text-xs text-gray-500 mt-1">1 ha = 10.000 m²</div>
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 border rounded text-gray-700"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Đăng ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Danh sách lô đất dạng card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.isArray(plots) && plots.length > 0 ? (
          plots.map((plot, idx) => {
            const plotCrops = Array.isArray(plot.crops) ? plot.crops : [];
            const totalCropArea = plotCrops.reduce((sum, crop) => sum + crop.area, 0);
            const empty = Number(plot.area) - totalCropArea;
            return (
              <div key={plot._id || plot.batchCode || idx} className="bg-white rounded-lg shadow p-4 relative max-w-xs w-full mx-auto">
                <div className="absolute top-2 left-2 bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold">
                  {plot.batchCode}
                </div>
                <button
                  className="absolute top-2 right-2 text-green-500 hover:text-blue-600"
                  onClick={() => handleEditClick(plot)}
                  title="Chỉnh sửa lô"
                >
                  <Edit size={20} />
                </button>
                <div className="mt-6 mb-2">
                  {plotCrops.length === 0 ? (
                    <div className="text-gray-400 italic">Chưa có cây trồng</div>
                  ) : (
                    <ul>
                      {plotCrops.map((crop, i) => (
                        <li key={i} className="flex justify-between items-center mb-1 px-4 gap-5">
                          <span className="font-semibold flex items-center gap-2">
                            <span className="text-lg text-gray-400">•</span>
                            {crop.name || "Không rõ"}
                          </span>
                          <span className="text-sm text-gray-600">{formatNumberAuto(crop.area)} ha</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex justify-between items-center mb-2 mt-4">
                  <span className="text-sm text-gray-700">
                    Tổng diện tích trồng: <span className="font-bold">{formatNumberAuto(totalCropArea)} ha</span>
                  </span>
                </div>
                <div className="text-sm text-gray-700 mb-1">
                  Diện tích trống: <span className="font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded">{formatNumberAuto(empty)} ha</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-gray-400 text-center">Chưa có lô đất nào</div>
        )}
      </div>

      {/* Modal chỉnh sửa lô đất */}
      {editPlot && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Chỉnh sửa lô đất</h3>
            <form onSubmit={e => {
              e.preventDefault();
              let areaHa = editForm.unit === "ha"
                ? parseFloat(editForm.area)
                : parseFloat(editForm.area) / 10000;
              if (isNaN(areaHa) || areaHa <= 0) {
                alert("Vui lòng nhập diện tích hợp lệ!");
                return;
              }
              handleEditSubmit(areaHa);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mã lô</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded"
                  value={editForm.code}
                  onChange={e => setEditForm({ ...editForm, code: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Diện tích</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    className="w-full border px-3 py-2 rounded"
                    value={editForm.area}
                    onChange={e => setEditForm({ ...editForm, area: e.target.value })}
                    required
                  />
                  <select
                    className="border px-2 py-2 rounded"
                    value={editForm.unit || "ha"}
                    onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                  >
                    <option value="ha">ha</option>
                    <option value="m2">m²</option>
                  </select>
                </div>
                <div className="text-xs text-gray-500 mt-1">1 ha = 10.000 m²</div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 border rounded text-gray-700"
                  onClick={() => setEditPlot(null)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Plot;