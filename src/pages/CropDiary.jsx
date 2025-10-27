import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, Search, NotebookPen, NotebookText } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

// Update the formatDate function
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';  // Return empty string for invalid dates
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  } catch {
    return '';
  }
};

// Helper function để chuyển từ dd/mm/yyyy sang yyyy-mm-dd cho input type="date"
const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
};

function CropDiary({ onSelectBatchCode }) {
  const [productTypes, setProductTypes] = useState([]);
  const [form, setForm] = useState({
    productId: '',
    name: '',
    batchCode: '',
    season: '',
    sowingDate: '',
    area: '',
    stage: '',
    origin: '',
    index: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [diaryList, setDiaryList] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyDiary, setHistoryDiary] = useState(null);
  const [completedDiaries, setCompletedDiaries] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editingBatchCode, setEditingbatchCode] = useState(null); // Thêm state để lưu id đang sửa
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [diaryToConfirm, setDiaryToConfirm] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [diaryToDelete, setDiaryToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [page, setPage] = useState(1);
  const [completedRowsPerPage, setCompletedRowsPerPage] = useState(20);
  const [completedPage, setCompletedPage] = useState(1);
  const [activeTab, setActiveTab] = useState('list'); // 'list' hoặc 'completed'
  const [plotCodes, setPlotCodes] = useState([]);
  const [plotCodesWithArea, setPlotCodesWithArea] = useState([]); // State mới để lưu mã lô và diện tích
  const [outputQty, setOutputQty] = useState('');
  const [showStageForm, setShowStageForm] = useState(false);
  const [stageForm, setStageForm] = useState({ content: "", imageProd: null, diary: null, stage: "" });
  const [newStageContent, setNewStageContent] = useState('');
  const [newStageImage, setNewStageImage] = useState(null);
  const [newStageImages, setNewStageImages] = useState([]); // cho form thêm mới
  const [stageFormImages, setStageFormImages] = useState([]); // cho form cập nhật giai đoạn
  const [removeFromPlot, setRemoveFromPlot] = useState(false); // Thêm state cho checkbox

  // Lấy danh sách loại sản phẩm từ API
  useEffect(() => {
    fetch(`${API_BASE_URL}/product-types`)
      .then(res => res.json())
      .then(setProductTypes);
    fetch(`${API_BASE_URL}/plots`)
      .then(res => res.json())
      .then(data => {
        setPlotCodesWithArea(data);
        setPlotCodes(data.map(plot => plot.batchCode));
      });
    fetch(`${API_BASE_URL}/crop-diaries`)
      .then(res => res.json())
      .then(setDiaryList);
  }, []);

  // Thêm nhật ký mới
  const handleAddDiary = async (data) => {
    try {
      const res = await fetch('/api/crop-diaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) {
        const diaries = await fetch('/api/crop-diaries').then(r => r.json());
        setDiaryList(diaries);
        setShowAddForm(false);
      } else {
        alert(result.error || 'Thêm nhật ký thất bại');
      }
    } catch (err) {
      alert('Lỗi khi thêm nhật ký');
    }
  };

  // Gửi dữ liệu lên backend để ghi vào addNK.csv
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Lấy diện tích tối đa của lô (giả sử có biến plotCodesWithArea)
    const plot = plotCodesWithArea.find(p => p.batchCode === form.batchCode);
    const areaFree = plot ? Number(plot.areaFree) : 0;

    // Quy đổi về ha trước khi kiểm tra
    let areaHa = form.areaUnit === "ha"
      ? parseFloat(form.area)
      : parseFloat(form.area) / 10000;

    // ... rồi kiểm tra với areaFree (đều là ha)
    if (areaHa > areaFree) {
      alert(`Diện tích trống của lô chỉ còn ${formatNumberAuto(areaFree)} ha!`);
      return;
    }

    try {
      // Remove code field from duplicate check
      const isDuplicateBatch = diaryList.some(diary => {
        if (editMode && (diary.id === form.batchCode || diary.code === form.batchCode)) {
          return false;
        }
        return diary.batchCode === form.batchCode;
      });

      // Proceed with form submission
      let url = `${API_BASE_URL}/crop-diaries`;
      let method = 'POST';

      if (editMode) {
        url = `${API_BASE_URL}/crop-diaries/${form.index}`;
        method = 'PUT';
      }

      // Trước khi gửi lên backend:
      let areaHa = form.areaUnit === "ha"
        ? parseFloat(form.area)
        : parseFloat(form.area) / 10000;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...form, area: areaHa })
      });

      const data = await res.json();

      if (data.success) {
        // Reset form
        setForm({
          productId: '',
          name: '',
          batchCode: '',
          season: '',
          sowingDate: '',
          area: '',
          stage: '',
          origin: '',
          index: ''
        });

        // Reset edit mode
        setEditMode(false);
        setEditingbatchCode(null);
        setShowAddForm(false);

        // Reload diary list
        const response = await fetch(`${API_BASE_URL}/crop-diaries`);
        const diaries = await response.json();
        setDiaryList(diaries);

        // Reload plots để lấy areaFree mới nhất
        const plotsRes = await fetch(`${API_BASE_URL}/plots`);
        const plots = await plotsRes.json();
        setPlotCodesWithArea(plots);
        setPlotCodes(plots.map(plot => plot.batchCode));

        // Gửi dữ liệu quá trình sản xuất đầu tiên vào prodProcess.csv
        const formData = new FormData();
        formData.append('stage', form.stage || 'Làm đất');
        formData.append('date', form.sowingDate);
        formData.append('content', newStageContent);
        if (newStageImages && newStageImages.length > 0) {
          newStageImages.forEach(file => formData.append('imageProd', file));
        }
        formData.append('index', data.index);

        await fetch(`${API_BASE_URL}/prod-process`, {
          method: 'POST',
          body: formData,
        });

        // Reset ô nhập nội dung công việc và hình ảnh
        setNewStageContent('');
        setNewStageImage(null);

        alert(editMode ? 'Cập nhật nhật ký thành công!' : 'Thêm nhật ký mới thành công!');
      } else {
        alert('Thao tác thất bại: ' + (data.error || 'Lỗi không xác định'));
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Có lỗi kết nối server!');
    }
  };



  // Khi đổi giai đoạn
  const handleStageChange = (e, diary) => {
    const newStage = e.target.value;
    if (newStage === 'Hoàn thành') {
      setDiaryToConfirm(diary);
      setOutputQty('');
      setShowConfirmDialog(true);
      setStageForm({ content: "", imageProd: null, diary, stage: newStage }); // Để dùng cho nội dung & ảnh
    } else {
      setStageForm({ content: "", imageProd: null, diary, stage: newStage });
      setShowStageForm(true);
    }
  };

  function formatNumberAuto(num) {
    if (Number.isInteger(Number(num))) return Number(num);
    return Number(num).toLocaleString(undefined, { maximumFractionDigits: 4 });
  }

  const now = new Date();
  const dateString = now.toLocaleString('sv-SE');  // hoặc now.toLocaleString('sv-SE') để có định dạng yyyy-MM-ddTHH:mm:ss

  // Update the handleEdit function
  const handleEdit = async (e) => {
    e.preventDefault();

    // 1. Lấy diện tích trống hiện tại của lô
    const plot = plotCodesWithArea.find(p => p.batchCode === form.batchCode);
    const areaFree = plot ? Number(plot.areaFree) : 0;

    // Lấy diện tích cũ của nhật ký đang sửa
    const currentDiary = diaryList.find(d => d.index === form.index);
    const oldArea = currentDiary ? Number(currentDiary.area) : 0;

    // Quy đổi về ha trước khi kiểm tra
    let areaHa = form.areaUnit === "ha"
      ? parseFloat(form.area)
      : parseFloat(form.area) / 10000;

    // Diện tích trống thực tế sau khi cộng lại diện tích cũ
    const realAreaFree = areaFree + oldArea;

    if (areaHa > realAreaFree) {
      alert(`Diện tích trống của lô chỉ còn ${formatNumberAuto(realAreaFree)} ha!`);
      return;
    }

    if (!form.productId || !form.name || !form.season ||
      !form.sowingDate || !form.area || !form.origin) {
      alert('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    try {
      // Get current diary data for comparison
      const currentDiary = diaryList.find(d => d.index === form.index);
      if (!currentDiary) {
        throw new Error('Không tìm thấy nhật ký để cập nhật');
      }

      // Format current date time
      const now = new Date();
      const dateString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

      // Generate change notes
      const changes = [];
      if (currentDiary.productId !== form.productId || currentDiary.name !== form.name) {
        changes.push(`Đổi loại sản phẩm: ${currentDiary.name} (${currentDiary.productId}) → ${form.name} (${form.productId})`);
      }
      if (currentDiary.origin !== form.origin) {
        changes.push(`Nguồn gốc: ${currentDiary.origin} → ${form.origin}`);
      }
      if (currentDiary.season !== form.season) {
        changes.push(`Mùa vụ: ${currentDiary.season} → ${form.season}`);
      }
      if (currentDiary.plantDate !== form.sowingDate) {
        changes.push(`Ngày gieo trồng: ${formatDate(currentDiary.plantDate)} → ${formatDate(form.sowingDate)}`);
      }
      if (currentDiary.area !== form.area) {
        changes.push(`Diện tích: ${currentDiary.area} → ${form.area} ha`);
      }

      // Parse existing updates
      let updates = [];
      try {
        if (currentDiary.updates) {
          if (typeof currentDiary.updates === 'string') {
            const cleanJson = currentDiary.updates
              .replace(/^"|"$/g, '')
              .replace(/""/g, '"')
              .trim();
            updates = JSON.parse(cleanJson);
          } else if (Array.isArray(currentDiary.updates)) {
            updates = currentDiary.updates;
          }
        }
      } catch (error) {
        console.error('Error parsing updates:', error);
      }

      // Add new update if there are changes
      if (changes.length > 0) {
        updates.push({
          date: dateString,
          note: "Chỉnh sửa thông tin",
          changes: changes
        });
      }

      // Prepare update data
      const updateData = {
        ...form,
        id: form.index,
        code: form.index,
        updates: updates,
        plantDate: form.sowingDate,
        area: areaHa, // luôn gửi về ha
        areaUnit: "ha" // luôn lưu là ha để đồng bộ backend
      };

      // Nếu không thay đổi giai đoạn thì KHÔNG gửi trường stage
      if (form.stage === currentDiary.stage) {
        delete updateData.stage;
      }

      // Send update request 
      const res = await fetch(`${API_BASE_URL}/crop-diaries/${form.index}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const data = await res.json();

      if (data.success) {
        // Update local diary list
        setDiaryList(prevList =>
          prevList.map(d =>
            d.index === form.index
              ? { ...d, ...updateData }
              : d
          )
        );

        // Check if diary exists in completed diaries and update if found
        const completedDiary = completedDiaries.find(d =>
          d.index === form.index || d.index === form.index
        );

        if (completedDiary) {
          // Update completed diary
          const completeRes = await fetch(`${API_BASE_URL}/complete-diaries/${form.index}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ...updateData,
              tracingStatus: completedDiary.tracingStatus
            })
          });

          if (completeRes.ok) {
            // Refresh completed diaries list
            await fetchCompletedDiaries();
          }
        }

        // Reset form and states
        setForm({
          productId: '',
          name: '',
          batchCode: '',
          season: '',
          sowingDate: '',
          area: '',
          areaUnit: 'ha',
          stage: '',
          origin: '',
          index: ''
        });

        setShowEditForm(false);
        setEditMode(false);
        setEditingbatchCode(null);

        alert('Cập nhật nhật ký thành công!');

      } else {
        throw new Error(data.error || 'Lỗi không xác định');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Có lỗi kết nối server!');
    }
  };

  // Add the fetchCompletedDiaries function if it doesn't exist
  const fetchCompletedDiaries = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/complete-diaries`);
      const data = await response.json();
      setCompletedDiaries(data);

      // Cũng refresh danh sách nhật ký chính  
      const diaryResponse = await fetch(`${API_BASE_URL}/crop-diaries`);
      const diaryData = await diaryResponse.json(); // Sửa ở đây: dùng diaryResponse thay vì response
      setDiaryList(diaryData);

    } catch (error) {
      console.error('Error fetching completed diaries:', error);
    }
  };

  // Hàm reset form về giá trị mặc định
  const resetForm = () => {
    setForm({
      productId: '',
      name: '',
      batchCode: '',
      season: '',
      sowingDate: '',
      area: '',
      areaUnit: 'ha',
      stage: '',
      origin: '',
      index: ''
    });
  };

  // Hàm thêm vào truy xuất nguồn gốc cho nhật ký hoàn thành
  const handleAddToTrace = async (diary) => {
    try {
      // 1. Gửi dữ liệu lên truy xuất
      const traceData = {
        image: diary.image || '',
        productId: diary.productId || diary.productTypeId || '',
        batchCode: diary.batchCode || '',
        name: diary.name || '',
        origin: diary.origin || '',
        productionDate: formatDate(diary.plantDate || diary.sowingDate || ''),
        expiryDate: diary.expiryDate || '',
        qrImage: diary.qrImage || '',
        index: diary.index || ''
      };
      const traceRes = await fetch(`${API_BASE_URL}/trace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(traceData)
      });
      if (!traceRes.ok) throw new Error('Không thể thêm vào truy xuất');
      // 2. Cập nhật trạng thái
      const updateRes = await fetch(`${API_BASE_URL}/crop-diaries/${diary.index}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracingStatus: 'Đã truy xuất' })
      });
      if (!updateRes.ok) {
        // Rollback nếu cập nhật trạng thái thất bại
        await fetch(`${API_BASE_URL}/trace/${diary.index}`, { method: 'DELETE' });
        throw new Error('Không thể cập nhật trạng thái');
      }
      await fetchCompletedDiaries();
      alert('Đã thêm vào truy xuất thành công!');
    } catch (error) {
      alert('Có lỗi khi thêm vào truy xuất: ' + error.message);
    }
  };

  const filteredDiaryList = Array.isArray(diaryList) ? diaryList.filter(diary =>
    !searchTerm ||
    diary.batchCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    diary.productId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    diary.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    diary.season?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const pagedDiaryList = filteredDiaryList.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const filteredCompletedDiaries = Array.isArray(completedDiaries) ? completedDiaries.filter(diary =>
    !searchTerm ||
    diary.batchCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    diary.productId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    diary.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    diary.season?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const pagedCompletedDiaries = filteredCompletedDiaries.slice(
    (completedPage - 1) * completedRowsPerPage,
    completedPage * completedRowsPerPage
  );

  // Xử lý submit form giai đoạn
  const handleStageFormSubmit = async (e) => {
    e.preventDefault();

    // Gửi process lên server
    const formData = new FormData();
    formData.append('stage', stageForm.stage);
    formData.append('date', new Date().toISOString());
    formData.append('content', stageForm.content);
    if (stageFormImages && stageFormImages.length > 0) {
      stageFormImages.forEach(file => formData.append('imageProd', file));
    }
    formData.append('index', (diaryToConfirm?.index || stageForm.diary?.index));

    await fetch(`${API_BASE_URL}/prod-process`, {
      method: 'POST',
      body: formData
    });

    // Cập nhật stage và updates vào crop-diaries (addNK.csv)
    try {
      const diary = stageForm.diary;
      const newStage = stageForm.stage;
      const now = new Date();
      const dateString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      let updates = [];
      try {
        if (diary.updates) {
          if (typeof diary.updates === 'string') {
            const cleanJson = diary.updates.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
            updates = JSON.parse(cleanJson);
            if (!Array.isArray(updates)) updates = [];
          } else if (Array.isArray(diary.updates)) {
            updates = diary.updates;
          }
        }
      } catch (error) {
        updates = [];
      }
      updates.push({
        date: dateString,
        stage: newStage,
        note: "Cập nhật giai đoạn"
      });

      // Gửi cập nhật lên crop-diaries
      await fetch(`${API_BASE_URL}/crop-diaries/${diary.index}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: newStage,
          updates
        })
      });

      // Cập nhật lại danh sách
      const response = await fetch(`${API_BASE_URL}/crop-diaries`);
      const updatedDiaries = await response.json();
      setDiaryList(updatedDiaries);
    } catch (error) {
      alert('Có lỗi khi đổi giai đoạn!');
    }

    setShowStageForm(false);
    setStageForm({ content: "", imageProd: null, diary: null, stage: "" });
    setStageFormImages([]);
  };

  useEffect(() => {
    if (activeTab === 'completed') {
      fetch(`${API_BASE_URL}/complete-diaries`)
        .then(res => res.json())
        .then(setCompletedDiaries);
    }
  }, [activeTab]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Quản lý nhật ký trồng trọt</h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-4 space-x-8">
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'list' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}
          onClick={() => setActiveTab('list')}
        >
          <NotebookPen className="inline w-5 h-5 mr-2" />
          Danh sách nhật ký trồng trọt
        </button>
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'completed' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}
          onClick={() => setActiveTab('completed')}
        >
          <NotebookText className="inline w-5 h-5 mr-2" />
          Nhật ký đã hoàn thành
        </button>
      </div>

      {/* Ô tìm kiếm chỉ cho tab danh sách */}
      {activeTab === 'list' && (
        <div className="flex justify-between items-center mb-4">
          <div className="relative py-2 w-1/3 mb-4">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm theo mã lô, mã sản phẩm, cây trồng, mùa vụ..."
              className="pl-10 pr-4 py-2 w-full rounded-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition outline-none shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
          >
            Đăng ký nhật ký mới
          </button>
        </div>
      )}
      {activeTab === 'completed' && (
        <div className="relative py-2 w-1/3 mb-4">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm theo mã lô, mã sản phẩm, cây trồng, mùa vụ..."
            className="pl-10 pr-4 py-2 w-full rounded-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition outline-none shadow-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* Tab content */}
      {activeTab === 'list' && (
        <>
          {/* Danh sách nhật ký trồng trọt */}
          <div className="overflow-x-auto">
            <table className="w-full table-auto mb-6">
              <thead className="bg-gray-50">
                <tr>
                  {/* Remove id column */}
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Mã lô</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Mã sản phẩm</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Cây trồng</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Nguồn gốc</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Mùa vụ</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Ngày gieo trồng</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Diện tích</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Giai đoạn</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Cập nhật</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pagedDiaryList.map(diary => (
                  <tr key={diary.index} className={diary.removedFromPlot ? "bg-gray-100 opacity-60" : ""}>
                    <td className="px-3 py-2">{diary.batchCode}</td>
                    <td className="px-3 py-2">{diary.productId}</td>
                    <td className="px-3 py-2 font-bold">
                      {diary.name}
                      {diary.removedFromPlot && (
                        <span className="ml-2 text-xs text-red-600 font-semibold">(Đã xóa khỏi lô)</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{diary.origin}</td>
                    <td className="px-3 py-2">{diary.season}</td>
                    <td className="px-3 py-2">{formatDate(diary.plantDate)}</td>
                    <td className="px-3 py-2">{diary.area} ha</td>
                    <td className="px-3 py-2">
                      <select
                        className={`px-2 py-1 rounded text-xs font-semibold ${diary.stage === 'Hoàn thành'
                            ? 'bg-gray-100 text-gray-700'
                            : diary.stage === 'Làm đất'
                              ? 'bg-stone-100 text-stone-700'
                              : diary.stage === 'Gieo trồng'
                                ? 'bg-yellow-100 text-yellow-700'
                                : diary.stage === 'Tưới tiêu'
                                  ? 'bg-blue-100 text-blue-700'
                                  : diary.stage === 'Bón phân'
                                    ? 'bg-green-100 text-green-700'
                                    : diary.stage === 'Phun thuốc'
                                      ? 'bg-orange-100 text-orange-700'
                                      : diary.stage === 'Thu hoạch'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-blue-100 text-blue-700'
                          }`}
                        value={diary.stage}
                        onChange={(e) => handleStageChange(e, diary)}
                        disabled={diary.stage === 'Hoàn thành'}
                      >
                        <option value="Làm đất">Làm đất</option>
                        <option value="Gieo trồng">Gieo trồng</option>
                        <option value="Tưới tiêu">Tưới tiêu</option>
                        <option value="Bón phân">Bón phân</option>
                        <option value="Phun thuốc">Phun thuốc</option>
                        <option value="Thu hoạch">Thu hoạch</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      {(() => {
                        let updates = [];
                        try {
                          if (diary.updates) {
                            if (typeof diary.updates === 'string') {
                              const cleanJson = diary.updates
                                .replace(/^"|"$/g, '')
                                .replace(/""/g, '"')
                                .trim();
                              updates = JSON.parse(cleanJson);
                              if (!Array.isArray(updates)) updates = [];
                            } else if (Array.isArray(diary.updates)) {
                              updates = diary.updates;
                            }
                          }
                          // Hiển thị duy nhất bản ghi mới nhất
                          if (updates.length > 0) {
                            const last = updates[updates.length - 1];
                            return (
                              <div>
                                <div className="text-xs">{last.date}</div>
                                <div className="text-xs text-gray-600">
                                  {last.note}
                                </div>
                              </div>
                            );
                          }
                        } catch (error) {
                          console.error('Error parsing updates:', error);
                        }
                        return null;
                      })()}
                    </td>
                    <td className="px-3 py-2 flex space-x-2">
                      <button
                        className="text-green-600 hover:text-green-800"
                        title="Sửa"
                        onClick={() => {
                          setForm({
                            productId: diary.productId || '',
                            name: diary.name || '',
                            batchCode: diary.batchCode || '',
                            season: diary.season || '',
                            sowingDate: diary.plantDate || '',
                            area: diary.area || '',
                            areaUnit: "ha",
                            origin: diary.origin || '',
                            index: diary.index
                          });
                          setShowEditForm(true);
                          setEditMode(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        title="Xóa"
                        onClick={() => {
                          setShowDeleteDialog(true);
                          setDiaryToDelete(diary);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        className="text-indigo-600 hover:text-indigo-800"
                        title="Lịch sử cập nhật"
                        onClick={() => { setHistoryDiary(diary); setShowHistory(true); }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Danh sách nhật ký trồng trọt */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="mr-2 text-sm">Số dòng/trang:</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={rowsPerPage}
                onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
              >
                {[20, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="px-2 py-1 border rounded text-sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >{"<"}</button>
              {Array.from({ length: Math.ceil(filteredDiaryList.length / rowsPerPage) }, (_, i) => (
                <button
                  key={i}
                  className={`px-2 py-1 border rounded text-sm ${page === i + 1 ? 'bg-green-100 font-bold' : ''}`}
                  onClick={() => setPage(i + 1)}
                >{i + 1}</button>
              ))}
              <button
                className="px-2 py-1 border rounded text-sm"
                disabled={page === Math.ceil(filteredDiaryList.length / rowsPerPage) || filteredDiaryList.length === 0}
                onClick={() => setPage(page + 1)}
              >{">"}</button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'completed' && (
        <>
          {/* Nhật ký đã hoàn thành */}
          <h4 className="font-semibold mb-2">Nhật ký đã hoàn thành</h4>
          <div className="overflow-x-auto">
            <table className="w-full table-auto mb-6">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Mã lô</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Mã sản phẩm</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Cây trồng</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Nguồn gốc</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Mùa vụ</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Ngày gieo trồng</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Diện tích</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Sản lượng</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Trạng thái</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pagedCompletedDiaries.map(diary => (
                  <tr key={diary.index} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{diary.batchCode}</td>
                    <td className="px-3 py-2">{diary.productId || diary.productTypeId}</td>
                    <td className="px-3 py-2 font-bold">{diary.name}</td>
                    <td className="px-3 py-2">{diary.origin}</td>
                    <td className="px-3 py-2">{diary.season}</td>
                    <td className="px-3 py-2">{formatDate(diary.plantDate || diary.sowingDate)}</td>
                    <td className="px-3 py-2">{diary.area} ha</td>
                    <td className="px-3 py-2">{diary.outputQty} kg</td>
                    <td className="px-3 py-2">
                      {diary.tracingStatus === '(Đã xóa khỏi truy xuất nguồn gốc)' ? (
                        <>
                          <span className="text-red-600 font-semibold">
                            Đã xóa khỏi truy xuất nguồn gốc
                          </span>
                          <button
                            className="block mt-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                            onClick={async () => {
                              try {
                                // 1. Validate data
                                const traceData = {
                                  image: diary.image || '',
                                  productId: diary.productId || diary.productTypeId || '',
                                  batchCode: diary.batchCode || '',
                                  name: diary.name || '',
                                  origin: diary.origin || '',
                                  productionDate: formatDate(diary.plantDate || diary.sowingDate || ''),
                                  expiryDate: diary.expiryDate || '',
                                  qrImage: diary.qrImage || '',
                                  index: diary.index || ''
                                };

                                // 2. Add back to trace first
                                const traceRes = await fetch(`${API_BASE_URL}/trace`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json'  
                                  },
                                  body: JSON.stringify(traceData)
                                });

                                if (!traceRes.ok) {
                                  throw new Error('Không thể thêm vào truy xuất');
                                }

                                // 3. Update tracing status
                                const statusRes = await fetch(`${API_BASE_URL}/complete-diaries/${diary.index}`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({ tracingStatus: 'Đã truy xuất' }) // Sửa ở đây
                                });

                                if (!statusRes.ok) {
                                  // Rollback - remove from trace if status update fails
                                  await fetch(`${API_BASE_URL}/trace/${diary.index}`, {
                                    method: 'DELETE'
                                  });
                                  throw new Error('Không thể cập nhật trạng thái');
                                }

                                // 4. Refresh data
                                await fetchCompletedDiaries();
                                alert('Đã khôi phục vào truy xuất thành công!');

                              } catch (error) {
                                console.error('Error restoring:', error);
                                alert('Có lỗi khi khôi phục truy xuất: ' + error.message);
                              }
                            }}
                          >
                            Khôi phục truy xuất
                          </button>
                        </>
                      ) : diary.tracingStatus === 'Chưa truy xuất' || !diary.tracingStatus ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">Chưa truy xuất</span>
                          <button
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                            onClick={() => handleAddToTrace(diary)}
                          >
                            Thêm vào truy xuất
                          </button>
                        </div>
                      ) : (
                        <span className="text-green-600 font-semibold">
                          {diary.tracingStatus}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phân trang cho Danh sách nhật ký đã hoàn thành */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="mr-2 text-sm">Số dòng/trang:</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={completedRowsPerPage}
                onChange={e => { setCompletedRowsPerPage(Number(e.target.value)); setCompletedPage(1); }}
              >
                {[20, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="px-2 py-1 border rounded text-sm"
                disabled={completedPage === 1}
                onClick={() => setCompletedPage(completedPage - 1)}
              >{"<"}</button>
              {Array.from({ length: Math.ceil(filteredCompletedDiaries.length / completedRowsPerPage) }, (_, i) => (
                <button
                  key={i}
                  className={`px-2 py-1 border rounded text-sm ${completedPage === i + 1 ? 'bg-green-100 font-bold' : ''}`}
                  onClick={() => setCompletedPage(i + 1)}
                >{i + 1}</button>
              ))}
              <button
                className="px-2 py-1 border rounded text-sm"
                disabled={completedPage === Math.ceil(filteredCompletedDiaries.length / completedRowsPerPage) || filteredCompletedDiaries.length === 0}
                onClick={() => setCompletedPage(completedPage + 1)}
              >{">"}</button>
            </div>
          </div>
        </>
      )}

      {/* MODAL FORM */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <form className="p-6 space-y-3" onSubmit={handleSubmit}>
              <h3 className="text-lg font-semibold mb-4">Đăng ký nhật ký mới</h3>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded"
                value={form.batchCode}
                onChange={e => setForm({ ...form, batchCode: e.target.value })}
                required
              >
                <option value="">Chọn mã lô</option>
                {plotCodes.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Mã sản phẩm"
                className="w-full px-3 py-2 border border-gray-300 rounded"
                value={form.productId}
                onChange={e => setForm({ ...form, productId: e.target.value })}
              />
              {/* Khi chọn sản phẩm */}
              <select
                value={form.productId}
                onChange={e => {
                  const selected = productTypes.find(pt => pt.productId === e.target.value);
                  setForm({
                    ...form,
                    productId: selected?.productId || '',
                    name: selected?.name || ''
                  });
                }}
              >
                <option value="">Chọn sản phẩm đã thêm</option>
                {productTypes.map(pt => (
                  <option key={pt.productId} value={pt.productId}>{pt.name}</option>
                ))}
              </select>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded"
                value={form.season}
                onChange={e => setForm({ ...form, season: e.target.value })}
              >
                <option value="">Chọn mùa vụ</option>
                <option value="Mùa Xuân">Mùa Xuân</option>
                <option value="Mùa Hạ">Mùa Hạ</option>
                <option value="Mùa Thu">Mùa Thu</option>
                <option value="Mùa Đông">Mùa Đông</option>
              </select>
              <label className="block text-sm font-medium text-gray-700 mt-2 mb-1">
                Ngày gieo trồng
              </label>
              <input
                type="date"
                placeholder="Ngày gieo trồng"
                className="w-full px-3 py-2 border border-gray-300 rounded"
                value={formatDateForInput(form.sowingDate)}
                onChange={e => {
                  const date = e.target.value;
                  setForm({ ...form, sowingDate: date });
                }}
              />
              <div className="text-sm text-gray-500 mt-1">
                {form.sowingDate && formatDate(form.sowingDate)}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Diện tích</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0.0001}
                    step={0.0001}
                    className="w-full border px-3 py-2 rounded"
                    value={form.area}
                    onChange={e => setForm({ ...form, area: e.target.value })}
                    required
                  />
                  <select
                    className="border px-2 py-2 rounded"
                    value={form.areaUnit || "ha"}
                    onChange={e => setForm({ ...form, areaUnit: e.target.value })}
                  >
                    <option value="ha">ha</option>
                    <option value="m2">m²</option>
                  </select>
                </div>
                <div className="text-xs text-gray-500 mt-1">1 ha = 10.000 m²</div>
              </div>
              <input
                type="text"
                placeholder="Nguồn gốc"
                className="w-full px-3 py-2 border border-gray-300 rounded"
                value={form.origin || ''}
                onChange={e => setForm({ ...form, origin: e.target.value })}
              />
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded"
                value={form.stage || ''}
                onChange={e => setForm({ ...form, stage: e.target.value })}
              >
                <option value="">Chọn giai đoạn</option>
                <option value="Làm đất">Làm đất</option>
                <option value="Gieo trồng">Gieo trồng</option>
                <option value="Tưới tieu">Tưới tiêu</option>
                <option value="Bón phân">Bón phân</option>
                <option value="Phun thuốc">Phun thuốc</option>
                <option value="Thu hoạch">Thu hoạch</option>
                <option value="Hoàn thành">Hoàn thành</option>
              </select>
              <textarea
                className="w-full border rounded px-2 py-1 mb-3"
                placeholder="Nội dung công việc đầu tiên"
                value={newStageContent}
                onChange={e => setNewStageContent(e.target.value)}
                required
              />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={e => setNewStageImages(Array.from(e.target.files))}
                className="mb-3"
              />
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm(); // Reset form khi đóng
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {editMode ? 'Cập nhật' : 'Đăng ký'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LỊCH SỬ CẬP NHẬT */}
      {showHistory && historyDiary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-2">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Lịch sử cập nhật - {historyDiary.name} (Mã lô: {historyDiary.batchCode})
              </h3>
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  {(() => {
                    let updates = [];
                    try {
                      if (historyDiary.updates) {
                        if (typeof historyDiary.updates === 'string') {
                          const cleanJson = historyDiary.updates
                            .replace(/^"|"$/g, '')
                            .replace(/""/g, '"')
                            .trim();
                          updates = JSON.parse(cleanJson);
                          // Remove nested array check
                          if (!Array.isArray(updates)) {
                            updates = [];
                          }
                        } else if (Array.isArray(historyDiary.updates)) {
                          updates = historyDiary.updates;
                        }
                      }

                      return updates.length > 0 ? (
                        [...updates].reverse().map((update, idx) => (
                          <div key={idx} className="border-l-2 border-gray-200 pl-4 py-2 relative">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-600">
                                {update.date}
                              </span>
                              {update.note && update.note.startsWith('Khởi tạo') && (
                                <span
                                  className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold"
                                  style={{ position: 'absolute', right: 0, top: 0 }}
                                >
                                  Khởi tạo
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-sm">
                              {update.note && update.note.startsWith('Khởi tạo') ? (
                                update.note
                              ) : update.note === 'Chỉnh sửa thông tin' && Array.isArray(update.changes) ? (
                                <>
                                  <div className="font-semibold text-yellow-700">Chỉnh sửa thông tin:</div>
                                  <ul className="list-disc list-inside text-xs text-gray-700">
                                    {update.changes.map((c, i) => (
                                      <li key={i}>{c}</li>
                                    ))}
                                  </ul>
                                </>
                              ) : update.stage ? (
                                <>Cập nhật giai đoạn: <span className="font-medium">{update.stage}</span></>
                              ) : (
                                update.note
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-center py-4">
                          Chưa có lịch sử cập nhật
                        </div>
                      );
                    } catch (error) {
                      console.error('Error parsing history:', error);
                      return (
                        <div className="text-red-500 text-center py-4">
                          Có lỗi khi hiển thị lịch sử
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
              <div className="flex justify-end mt-4 pt-4 border-t">
                <button
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowHistory(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA */}
      {showDeleteDialog && diaryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-2">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Xác nhận xóa nhật ký</h3>
              <p className="text-sm text-gray-700 mb-4">
                Bạn có chắc chắn muốn xóa nhật ký này? Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDiaryToDelete(null);
                  }}
                >
                  Hủy
                </button>
                {/* Tìm đoạn code xử lý nút xóa và sửa lại: */}
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={async () => {
                    try {
                      // Xóa nhật ký chính
                      const res = await fetch(`${API_BASE_URL}/crop-diaries/${diaryToDelete.index}`, {
                        method: 'DELETE'
                      });
                      if (res.ok) {
                        setDiaryList(prevList =>
                          prevList.filter(d => d.index !== diaryToDelete.index)
                        );
                        setShowDeleteDialog(false);
                        setDiaryToDelete(null);
                        alert('Xóa nhật ký thành công!');
                        // Nếu muốn cập nhật lại danh sách hoàn thành (trạng thái sẽ tự đổi nếu backend xử lý), gọi:
                        await fetchCompletedDiaries();
                      }
                    } catch (error) {
                      console.error('Error:', error);
                      alert('Có lỗi xảy ra khi xóa nhật ký');
                    }
                  }}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN HOÀN THÀNH */}
      {showConfirmDialog && diaryToConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Xác nhận hoàn thành</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                // Lưu vào prodProcess.csv
                const formData = new FormData();
                formData.append('stage', stageForm.stage);
                formData.append('date', new Date().toISOString());
                formData.append('content', stageForm.content);
                if (stageFormImages && stageFormImages.length > 0) {
                  stageFormImages.forEach(file => formData.append('imageProd', file));
                }
                formData.append('index', (diaryToConfirm?.index || stageForm.diary?.index));

                await fetch(`${API_BASE_URL}/prod-process`, {
                  method: 'POST',
                  body: formData,
                });
                try {
                  if (!outputQty || isNaN(Number(outputQty)) || Number(outputQty) < 0) {
                    alert('Vui lòng nhập sản lượng hợp lệ!');
                    return;
                  }
                  const now = new Date();
                  const dateString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

                  // Parse updates
                  let updates = [];
                  if (diaryToConfirm.updates) {
                    if (Array.isArray(diaryToConfirm.updates)) {
                      updates = diaryToConfirm.updates;
                    } else if (typeof diaryToConfirm.updates === 'string') {
                      try {
                        updates = JSON.parse(diaryToConfirm.updates);
                      } catch {
                        updates = [];
                      }
                    }
                  }

                  updates.push({
                    date: dateString,
                    stage: 'Hoàn thành',
                    note: 'Cập nhật giai đoạn',
                    outputQty: outputQty,
                    ...(removeFromPlot ? { removedFromPlot: true } : {})
                  });

                  // Gửi thêm outputQty và trạng thái xóa lên backend
                  const res = await fetch(`${API_BASE_URL}/crop-diaries/${diaryToConfirm.index}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      stage: 'Hoàn thành',
                      updates: updates,
                      outputQty: outputQty,
                      removedFromPlot: removeFromPlot
                    })
                  });

                  if (res.ok) {
                    setDiaryList(prevList =>
                      prevList.map(d =>
                        d.index === diaryToConfirm.index
                          ? { ...d, stage: 'Hoàn thành', updates, outputQty, removedFromPlot: removeFromPlot }
                          : d
                      )
                    );
                    setShowConfirmDialog(false);
                    setDiaryToConfirm(null);
                    setOutputQty('');
                    setRemoveFromPlot(false);
                    await fetchCompletedDiaries();
                  } else {
                    throw new Error('Failed to update diary');
                  }
                } catch (error) {
                  console.error('Error updating diary:', error);
                  alert('Có lỗi xảy ra khi cập nhật. Vui lòng thử lại!');
                }
              }}
            >
              <div className="space-y-3 mb-4">
                <p><span className="font-medium">Cây trồng:</span> {diaryToConfirm.name}</p>
                <p><span className="font-medium">Mã lô:</span> {diaryToConfirm.batchCode}</p>
                <p><span className="font-medium">Nguồn gốc:</span> {diaryToConfirm.origin}</p>
                <p><span className="font-medium">Ngày gieo trồng:</span> {formatDate(diaryToConfirm.plantDate)}</p>
                <textarea
                  className="w-full border rounded px-2 py-1 mb-3"
                  placeholder="Nội dung công việc"
                  value={stageForm.content}
                  onChange={e => setStageForm({ ...stageForm, content: e.target.value })}
                  required
                />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => setStageFormImages(Array.from(e.target.files))}
                  className="mb-3"
                />
                <div>
                  <label className="block text-sm font-medium mb-1">Sản lượng (kg)</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border px-3 py-2 rounded"
                    value={outputQty}
                    onChange={e => setOutputQty(e.target.value)}
                    placeholder="Nhập sản lượng thu hoạch (kg)"
                    required
                  />
                </div>
                {/* Thêm checkbox xóa khỏi lô */}
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="removeFromPlot"
                    checked={removeFromPlot}
                    onChange={e => setRemoveFromPlot(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="removeFromPlot" className="text-sm">
                    Xóa cây trồng khỏi lô đất sau khi hoàn thành
                  </label>
                </div>
                <p className="text-red-600">
                  Lưu ý: Sau khi xác nhận hoàn thành, bạn sẽ không thể thay đổi giai đoạn nữa!
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setDiaryToConfirm(null);
                    setOutputQty('');
                    setStageForm({ content: "", imageProd: null, diary: null, stage: "" });
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Xác nhận hoàn thành
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA NHẬT KÝ */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <form className="p-6 space-y-3" onSubmit={handleEdit}>
              <h3 className="text-lg font-semibold mb-4">Chỉnh sửa nhật ký</h3>
              <input
                type="text"
                placeholder="Mã sản phẩm"
                className="w-full px-3 py-2 border border-gray-300 rounded"
                value={form.productId}
                onChange={e => setForm({ ...form, productId: e.target.value })}
              />
              {/* Khi chọn sản phẩm */}
              <select
                value={form.productId}
                onChange={e => {
                  const selected = productTypes.find(pt => pt.productId === e.target.value);
                  setForm({
                    ...form,
                    productId: selected?.productId || '',
                    name: selected?.name || ''
                  });
                }}
              >
                <option value="">Chọn sản phẩm</option>
                {productTypes.map(pt => (
                  <option key={pt.productId} value={pt.productId}>{pt.name}</option>
                ))}
              </select>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded"
                value={form.season}
                onChange={e => setForm({ ...form, season: e.target.value })}
              >
                <option value="">Chọn mùa vụ</option>
                <option value="Mùa Xuân">Mùa Xuân</option>
                <option value="Mùa Hạ">Mùa Hạ</option>
                <option value="Mùa Thu">Mùa Thu</option>
                <option value="Mùa Đông">Mùa Đông</option>
              </select>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày gieo trồng</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  value={formatDateForInput(form.sowingDate)}
                  onChange={e => {
                    const date = e.target.value; // Lấy giá trị trực tiếp từ input
                    setForm({ ...form, sowingDate: date });
                  }}
                />
                <div className="text-sm text-gray-500 mt-1">
                  {form.sowingDate && formatDate(form.sowingDate)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Diện tích</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0.0001}
                    step={0.0001}
                    className="w-full border px-3 py-2 rounded"
                    value={form.area}
                    onChange={e => setForm({ ...form, area: e.target.value })}
                    required
                  />
                  <select
                    className="border px-2 py-2 rounded"
                    value={form.areaUnit || "ha"}
                    onChange={e => setForm({ ...form, areaUnit: e.target.value })}
                  >
                    <option value="ha">ha</option>
                    <option value="m2">m²</option>
                  </select>
                </div>
                <div className="text-xs text-gray-500 mt-1">1 ha = 10.000 m²</div>
              </div>
              <input
                type="text"
                placeholder="Nguồn gốc"
                className="w-full px-3 py-2 border border-gray-300 rounded"
                value={form.origin}
                onChange={e => setForm({ ...form, origin: e.target.value })}
              />
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditMode(false);
                    setEditingbatchCode(null);
                    resetForm(); // Reset form khi đóng
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
            onSubmit={handleStageFormSubmit}
          >
            <h3 className="text-lg font-semibold mb-4">Nội dung công việc cho giai đoạn: <span className="text-green-700">{stageForm.stage}</span></h3>
            <textarea
              className="w-full border rounded px-2 py-1 mb-3"
              placeholder="Nội dung công việc"
              value={stageForm.content}
              onChange={e => setStageForm({ ...stageForm, content: e.target.value })}
              required
            />
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={e => setStageFormImages(Array.from(e.target.files))}
              className="mb-3"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 border rounded"
                onClick={() => setShowStageForm(false)}
              >Hủy</button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded"
              >Lưu</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

export default CropDiary;