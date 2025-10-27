import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

function ProductionManagement() {
  const [product, setProduct] = useState(null);
  const [processStages, setProcessStages] = useState([]);
  const [editingStage, setEditingStage] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedIndexes, setExpandedIndexes] = useState({});

  // Get product index from URL
  const location = useLocation();
  const currentPath = location.pathname;
  const productIndex = currentPath.includes('/prod-process') 
    ? currentPath.split('/prod-process')[1]
    : 'M7R5Eg85B6';

  useEffect(() => {
    // Fetch production stages
    const fetchProductionStages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/prod-process`);
        if (!res.ok) throw new Error('Không thể kết nối với server');
        const data = await res.json();
        setProcessStages(data);
      } catch (err) {
        setError(`Lỗi khi tải quá trình sản xuất: ${err.message}`);
      }
    };

    fetchProductionStages();
  }, [location]);

  const handleAddStage = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!editingStage.stage || !editingStage.content || !editingStage.date || !editingStage.index) {
        setError('Vui lòng điền đầy đủ thông tin');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/prod-process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user'))?.token}`,
        },
        body: JSON.stringify({
          stage: editingStage.stage,
          content: editingStage.content,
          date: editingStage.date,
          imageProd: editingStage.imageProd || '',
          index: editingStage.index
        })
      });

      if (!res.ok) throw new Error('Lỗi kết nối server');
      const data = await res.json();
      
      if (data.success) {
        setSuccess('Thêm công đoạn thành công');
        setEditingStage(null);
        // Refresh all stages
        const stagesRes = await fetch(`${API_BASE_URL}/prod-process`);
        const stagesData = await stagesRes.json();
        setProcessStages(stagesData);
      } else {
        setError(data.message || 'Lỗi khi thêm công đoạn');
      }
    } catch (err) {
      setError('Lỗi khi thêm công đoạn: ' + err.message);
    }
  };

  // Toggle expansion state for a product group
  const toggleExpand = (index) => {
    setExpandedIndexes(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleCardClick = (e, index) => {
    e.preventDefault();
    setExpandedIndexes(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Quản lý Quy Trình Sản Xuất
      </h2>
      
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}

      {/* Products Grouped by Index */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {processStages.map((group) => (
          <div
            key={group.index}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 h-fit relative"
          >
            <div className="p-6 cursor-pointer" onClick={e => handleCardClick(e, group.index)}>
              <div className="flex justify-between items-center group">
                <div className="flex items-center space-x-3">
                  {expandedIndexes[group.index] ?
                    <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600" /> :
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  }
                  <h3 className="text-lg font-semibold text-gray-800">
                    Mã sản xuất: <span className="text-green-600">{group.index}</span>
                  </h3>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-700">
                <div><span className="font-semibold">Tên sản phẩm:</span> {group.name}</div>
                <div><span className="font-semibold">Mã sản phẩm:</span> {group.productId}</div>
              </div>
            </div>
            {expandedIndexes[group.index] && (
              <div className="border-t">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-700">Các công đoạn sản xuất:</h4>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setEditingStage({
                          stage: '',
                          content: '',
                          date: '',
                          imageProd: '',
                          index: group.index
                        });
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm công đoạn</span>
                    </button>
                  </div>
                  <div className="space-y-4">
                    {group.stages.map((stage, stageIdx) => (
                      <div key={stageIdx} className="border border-gray-200 rounded-lg p-4">
                        <div>
                          <h4 className="font-medium text-gray-800">
                            Công việc {stageIdx + 1}: {stage.stage}
                          </h4>
                          <p className="text-gray-600 mt-2">{stage.content}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Ngày: {stage.date ? (stage.date.includes(":") ? stage.date : new Date(stage.date).toLocaleDateString('vi-VN')) : ''}
                          </p>
                        </div>
                        {stage.imageProd && stage.imageProd.trim() && (
                          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                            {stage.imageProd.split(',').map((img, i) => (
                              <img
                                key={i}
                                src={img.trim().replace(/^"|"$/g, '')}
                                alt={`Ảnh ${i + 1}`}
                                className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Stage Modal */}
      {editingStage && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-1/2 p-6 transform transition-all duration-300 animate-modalEntry">
            <h3 className="text-lg font-semibold mb-4">Thêm công đoạn mới</h3>
            <form onSubmit={handleAddStage}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Tên công đoạn</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    value={editingStage.stage}
                    onChange={e => setEditingStage({...editingStage, stage: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Nội dung</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded"
                    value={editingStage.content}
                    onChange={e => setEditingStage({...editingStage, content: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Ngày thực hiện</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded"
                    value={editingStage.date?.split('T')[0]}
                    onChange={e => setEditingStage({...editingStage, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Hình ảnh (URL, phân cách bằng dấu phẩy)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    value={editingStage.imageProd}
                    onChange={e => setEditingStage({...editingStage, imageProd: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4 gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStage(null)}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Thêm mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Add these styles to your tailwind.config.js
// extend: {
//   keyframes: {
//     fadeIn: {
//       '0%': { opacity: '0' },
//       '100%': { opacity: '1' },
//     },
//     modalEntry: {
//       '0%': { opacity: '0', transform: 'scale(0.9)' },
//       '100%': { opacity: '1', transform: 'scale(1)' },
//     },
//   },
//   animation: {
//     fadeIn: 'fadeIn 0.3s ease-in-out',
//     modalEntry: 'modalEntry 0.3s ease-out',
//   },
// },

export default ProductionManagement;
