import React, { useState, useEffect } from 'react';
import {
  Package, Sprout, Settings, QrCode, User, Edit, Trash2, Search, Menu, X,
} from 'lucide-react';
import QRCode from 'qrcode';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import SidebarMenu from './menu';
import { menuItems } from './menu';
import ProductDetail from './ProductDetail';
import { displayDate, displayExpiryDate, downloadQRAsWord, handleExportQR } from './utils/Utils';
import Overview from './overview';
import ProductTypes from './ProductTypes';
import Plot from './Plot';
import CropDiary from './CropDiary';
import Report from './Report';

function formatNumberAuto(num) {
  if (Number.isInteger(num)) return num;
  return Number(num.toFixed(4)); // Giới hạn 4 số sau dấu phẩy, không dư số 0
}

function App() {
  const [activeTab, setActiveTab] = useState('traceability');
  const [showAddForm, setShowAddForm] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState(() => localStorage.getItem('activeMenu') || 'traceability');
  const [products, setProducts] = useState([]);
  const [cropLogs, setCropLogs] = useState([]);
  const [qrImage, setQrImage] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [page, setPage] = useState(1);
  const [productForm, setProductForm] = useState({
    productId: '',
    batchCode: '',
    name: '',
    origin: '',
    productionDate: '',
    expiryDate: '',
    qrCode: '',
    qrImage: '',
    image: '',
    index: ''
  });
  const [editIndex, setEditIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productTypes, setProductTypes] = useState([]);
  const [showAddTypeForm, setShowAddTypeForm] = useState(false);
  // State cho modal sửa
  const [showEditTypeForm, setShowEditTypeForm] = useState(false);
  const [editTypeForm, setEditTypeForm] = useState({ productId: '', name: '', image: '' });
  // Thêm các state nếu chưa có
  const [diaryList, setDiaryList] = useState([]);
  const [completedDiaries, setCompletedDiaries] = useState([]);
  const [exportedQRs, setExportedQRs] = useState([]);
  const [exportQRProduct, setExportQRProduct] = useState(null);
  const [qrEdit, setQrEdit] = useState(null);
  const filteredProductList = products
  .filter(product =>
    !searchTerm ||
    product.batchCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.expiryDate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.qrCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.origin?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetch('http://192.168.5.119:3001/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
    fetch('http://192.168.5.119:3001/api/crop-logs')
      .then(res => res.json())
      .then(data => setCropLogs(data));
    fetch('http://192.168.5.119:3001/api/product-types')
      .then(res => res.json())
      .then(data => setProductTypes(data));
    fetch('http://192.168.5.119:3001/api/crop-diaries')
      .then(res => res.json())
      .then(data => setDiaryList(data));
    fetch('http://192.168.5.119:3001/api/complete-diaries')
      .then(res => res.json())
      .then(data => setCompletedDiaries(data));
    fetch('http://192.168.5.119:3001/api/exported-qr')
    .then(res => res.json())
    .then(data => setExportedQRs(data));
  }, []);

  useEffect(() => {
    if (activeTab === 'qr-list') {
      fetch('http://192.168.5.119:3001/api/exported-qr')
        .then(res => res.json())
        .then(data => setExportedQRs(data));
    }
  }, [activeTab]);

  // Khi bấm nút Edit
  const handleEditType = (type) => {
    setEditTypeForm(type);
    setShowEditTypeForm(true);
  };

  // Tính tổng diện tích
  const totalArea = diaryList.reduce((sum, diary) => sum + (parseFloat(diary.area) || 0), 0);

  // Tính tổng mã QR đã xuất
  const totalQRCodes = exportedQRs.length;

  async function handleExportQR(qrEdit) {
    // Lấy thông tin sản phẩm từ server
    const res = await fetch(`http://localhost:3001/api/product-info?index=${qrEdit.index}`);
    const product = await res.json();

    // Gộp dữ liệu
    const exportData = {
      ...product,
      weight: qrEdit.weight,
      phone: qrEdit.phone,
      expiryDate: qrEdit.expiryDate
    };

    // Gửi lên server để ghi vào addQR.csv
    await fetch('http://localhost:3001/api/export-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportData)
    });

    // Cập nhật lại danh sách QR đã xuất nếu cần
  }

  return (
    <Router>
      <Routes>
        <Route path="/product/:index" element={<ProductDetail products={products} />} />
        <Route
          path="/*"
          element={
            <div className="min-h-screen bg-gray-50 flex">
              {/* Sidebar */}
              <div className={`bg-gray-800 text-white transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} min-h-screen`}>
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    {!sidebarCollapsed && (
                      <div className="flex items-center space-x-2">
                        <Settings className="w-6 h-6 text-green-400" />
                        <span className="font-semibold">Tổng quản lý</span>
                      </div>
                    )}
                    <button
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className="p-1 rounded hover:bg-gray-700"
                    >
                      {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                 <SidebarMenu
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  setActiveTab={setActiveTab}
                  sidebarCollapsed={sidebarCollapsed}
                />
              </div>
              {/* Main Content */}
              <div className="flex-1 flex flex-col">
                <header className="bg-green-600 text-white p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Sprout className="w-8 h-8" />
                      <h1 className="text-2xl font-bold">Phần mềm Nông nghiệp</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                      <User className="w-6 h-6" />
                      <span>Nông dân ABC</span>
                    </div>
                  </div>
                </header>
                {activeMenu === 'traceability' && (
  <div className="bg-white border-b border-gray-200">
    <div className="px-6">
      <nav className="flex space-x-8">
        <button
          onClick={() => setActiveTab('traceability')}
          className={`py-4 px-6 border-b-2 font-medium text-sm ${
            activeTab === 'traceability'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package className="w-5 h-5 inline mr-2" />
          Truy xuất nguồn gốc nông sản
        </button>
        <button
          onClick={() => setActiveTab('qr-list')}
          className={`py-4 px-6 border-b-2 font-medium text-sm ${
            activeTab === 'qr-list'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <QrCode className="w-5 h-5 inline mr-2" />
          Danh sách mã QR đã xuất
        </button>
      </nav>
    </div>
  </div>
  )}
    <main className="flex-1 p-6">
      {activeMenu === 'overview' && (
        <Overview
          totalProducts={products.length}
          totalDiaries={diaryList.length}
          totalCompletedDiaries={completedDiaries.length}
          totalArea={formatNumberAuto(totalArea)}
          totalQRCodes={totalQRCodes}
        />
      )}
      {activeMenu === 'products' && (
        <ProductTypes
          productTypes={productTypes}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setShowAddTypeForm={setShowAddTypeForm}
          setEditTypeForm={setEditTypeForm}
          setShowEditTypeForm={setShowEditTypeForm}
          setProducts={setProducts}
        />
      )}
        {activeMenu === 'plot' && (
        <Plot />
      )}
       {activeMenu === 'reports' && (
        <Report />
      )}
      {activeMenu !== 'overview' && activeMenu !== 'products' && activeMenu !== 'plot' && activeMenu !== 'traceability' && activeMenu !== 'crop-diary' && activeMenu !== 'reports' && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="mb-4">
            {(() => {
              const menuItem = menuItems.find(item => item.id === activeMenu);
              const IconComponent = menuItem?.icon || Settings;
              return <IconComponent className="w-16 h-16 text-gray-400 mx-auto" />;
            })()}
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {menuItems.find(item => item.id === activeMenu)?.label}
          </h2>
          <p className="text-gray-500">Chức năng đang được phát triển</p>
        </div>
      )}
      {/* Truy xuất nguồn gốc và danh sách sản phẩm đã thêm */}
{activeMenu === 'traceability' && (
  <div className="bg-white rounded-lg shadow p-6">
    {activeTab === 'traceability' && (
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-1/3">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            className="pl-10 pr-4 py-2 w-full rounded-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition outline-none shadow-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
      </div>
    )}

    {activeTab === 'traceability' && (
      // ...bảng truy xuất nguồn gốc nông sản...
    <>
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Hình ảnh</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mã lô</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mã sản phẩm</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tên sản phẩm</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nguồn gốc</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ngày sản xuất</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sản lượng</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mã QR</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products
              .filter(product =>
                !searchTerm ||
                product.batchCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.productId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.expiryDate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.qrCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.origin?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((product) => (
                <tr key={product.index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {product.image && (
                      <img
                        src={
                          product.image.startsWith('http')
                            ? product.image
                            : `http://192.168.5.119:3001${product.image}`
                        }
                        alt="Hình ảnh"
                        className="w-12 h-12 object-cover rounded border"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{product.batchCode}</td>
                  <td className="px-4 py-3 text-sm">{product.productId}</td>
                  <td className="px-4 py-3 text-sm font-bold">{product.name}</td>
                  <td className="px-4 py-3 text-sm">{product.origin}</td>
                  <td className="px-4 py-3 text-sm">{displayDate(product.productionDate)}</td>
                  <td className="px-4 py-3 text-sm">{displayExpiryDate(product.outputQty)} kg</td>
                  <td className="flex flex-col px-4 py-3 text-sm">
                    {product.qrImage ? (
                      <>
                        <img
                          src={product.qrImage}
                          alt="QR Code"
                          className="w-12 h-12 object-contain border rounded bg-white cursor-pointer"
                          onClick={() => setQrImage(product.qrImage)}
                          title="Nhấn để xem lớn"
                        />
                        <div>{product.index}</div>
                      </>
                    ) : (
                      <span className="text-gray-400 italic">Chưa có</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex space-x-2">
                      <button
                        className="text-green-600 hover:text-green-800"
                        onClick={() => {
                          setEditIndex(product.index);
                          setProductForm({
                            ...product,
                            productionDate: product.productionDate && product.productionDate.includes('/')
                              ? (() => {
                                  const [d, m, y] = product.productionDate.split('/');
                                  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                                })()
                              : product.productionDate,
                            expiryDate: product.expiryDate && product.expiryDate.includes('/')
                              ? (() => {
                                  const [d, m, y] = product.expiryDate.split('/');
                                  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                                })()
                              : product.expiryDate
                          });
                          setShowAddForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={async () => {
                          if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
                            // Change from productId to index
                            await fetch(`http://192.168.5.119:3001/api/products/batch/${product.index}`, { 
                              method: 'DELETE' 
                            });
                            fetch('http://192.168.5.119:3001/api/products')
                              .then(res => res.json())
                              .then(data => setProducts(data));
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        className="text-indigo-600 hover:text-indigo-800"
                        onClick={() => setQrEdit({ ...product, weight: product.weight || '', phone: product.phone || '', expiryDate: product.expiryDate || '' })}
                        title="Xuất mã QR"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
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
             {Array.from({ length: Math.ceil(filteredProductList.length / rowsPerPage) }, (_, i) => (
               <button
                 key={i}
                 className={`px-2 py-1 border rounded text-sm ${page === i + 1 ? 'bg-green-100 font-bold' : ''}`}
                 onClick={() => setPage(i + 1)}
               >{i + 1}</button>
             ))}
             <button
               className="px-2 py-1 border rounded text-sm"
               disabled={page === Math.ceil(filteredProductList.length / rowsPerPage) || filteredProductList.length === 0}
               onClick={() => setPage(page + 1)}
             >{">"}</button>
           </div>
         </div>
         </>
    )}
  {activeTab === 'qr-list' && (
  <div className="overflow-x-auto">
    {/* Ô tìm kiếm cho danh sách mã QR đã xuất */}
    <div className="relative w-1/3 mb-4">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
        <Search className="w-5 h-5" />
      </span>
      <input
        type="text"
        placeholder="Tìm kiếm mã QR..."
        className="pl-10 pr-4 py-2 w-full rounded-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition outline-none shadow-sm"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
    </div>
    <h3 className="text-lg font-semibold mb-4">Danh sách mã QR đã xuất</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {exportedQRs
        .filter(qr =>
          !searchTerm ||
          qr.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          qr.batchCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          qr.productId?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map((qr, idx) => (
          <div
            key={idx}
            className="bg-white border rounded shadow p-4 flex flex-col items-center"
            style={{ width: 340, minHeight: 220 }}
          >
            <div className="text-green-600 font-bold text-base text-center text-sm mb-1">
              TEM TRUY XUẤT NGUỒN GỐC NÔNG SẢN
            </div>
            <div className="flex w-full">
              <div className="flex flex-col items-center"> 
                <img
                  src={qr.qrImage}
                  alt="QR"
                  className="w-30 h-30 border bg-white object-contain"
                  style={{ margin: 10, width: 130, height: 130 } }
                />
                <div>{qr.index}</div>
              </div>
              <div className="ml-3 flex-1 text-sm">
                <div className=" font-bold text-base mb-1">{qr.name}</div>
                <div>Lô: {qr.batchCode}</div>
                <div>KL: {qr.weight} kg</div>
                <div>NSX: {qr.productionDate || qr.NSX}</div>
                <div>HSD: {qr.expiryDate || qr.HSD}</div>
                <div>LH: {qr.phone}</div>
                <div className="text-sm mt-2">
                  <span className="font-bold text-green-700 text-base mt-2">DTHHoldings</span>
                </div>
                <div className="text-green-700 text-sm ">Hotline: 0847605605</div>
              </div>
            </div>
            <button
              className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={() => downloadQRAsWord(qr)}
            >
              Tải file Word
            </button>
          </div>
        ))}
      {exportedQRs.length === 0 && (
        <div className="col-span-full text-gray-400 text-center">
          Chưa có mã QR nào được xuất
        </div>
      )}
    </div>
  </div>
)}
  </div>
  )}
                  {/* Nhật ký trồng trọt */}
                  {activeMenu === 'crop-diary' && (
                    <CropDiary
                      onSelectindex={index => {
                        // Xử lý khi người dùng muốn truy xuất nhật ký theo mã lô
                        // Ví dụ: chuyển tab hoặc hiển thị
                        console.log('Truy xuất nhật ký cho mã lô:', index);
                      }}
                    />
                  )}
                  
                </main>
              </div>
              {/* Add Form Modal */}
              {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        {activeTab === 'traceability' ? 'Chỉnh sửa thông tin sản phẩm' : 'Tạo nhật ký mới'}
                      </h3>
                      <div className="space-y-4">
                        {activeTab === 'traceability' ? (
                          // Form đầy đủ cho truy xuất nguồn gốc
                          <>
                            <label className="block text-sm font-medium text-gray-700 mt-2 mb-1">Ngày sản xuất</label>
                            <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            value={
                              productForm.productionDate
                                ? productForm.productionDate.includes('/')
                                  ? (() => {
                                      const [d, m, y] = productForm.productionDate.split('/');
                                      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                                    })()
                                  : productForm.productionDate
                                : ''
                            }
                            onChange={e => setProductForm({ ...productForm, productionDate: e.target.value })}
                          />
                          <div className="text-sm text-gray-500 mt-1">
                            {productForm.productionDate && displayDate(productForm.productionDate)}
                          </div>
                            <label className="block text-sm font-medium text-gray-700 mt-2 mb-1">Hạn sử dụng</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              value={productForm.expiryDate}
                              onChange={e => setProductForm({ ...productForm, expiryDate: e.target.value })}
                            />
                          </>
                         ) : activeTab === 'product-list' ? (
                          // Form rút gọn cho danh sách sản phẩm đã thêm
                          <>
                            <input
                              type="text"
                              id="id"
                              name="id"
                              placeholder="Mã sản phẩm"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              value={productForm.id}
                              onChange={e => setProductForm({ ...productForm, id: e.target.value })}
                            />
                            <input
                              type="text"
                              placeholder="Tên sản phẩm"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              value={productForm.name}
                              onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                            />
                            <input
                              type="file"
                              accept="image/*"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              onChange={e => setProductForm({ ...productForm, image: e.target.files[0] })}
                            />
                          </>
                        )
                        : null}
                      </div>
                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Hủy
                        </button>
                        {activeTab === 'traceability' && (
                          <button
                            onClick={async () => {
                              // Kiểm tra bắt buộc điền
                              const requiredFields = [
                                { key: 'productId', label: 'Mã sản phẩm' },
                                { key: 'batchCode', label: 'Mã lô' },
                                { key: 'name', label: 'Tên sản phẩm' },
                                { key: 'origin', label: 'Nguồn gốc' },
                                { key: 'productionDate', label: 'Ngày sản xuất' },
                                { key: 'outputQty', label: 'Sản lượng' }
                                // Không cần nhập mã QR khi tự động sinh
                              ];
                              for (const field of requiredFields) {
                                if (!productForm[field.key] || productForm[field.key].trim() === '') {
                                  alert(`Vui lòng nhập ${field.label}!`);
                                  return;
                                }
                              }
                              // Kiểm tra ngày sản xuất phải trước ngày hạn sử dụng
                              const [prodDay, prodMonth, prodYear] = productForm.productionDate.split('-').reverse();
                              const [expDay, expMonth, expYear] = productForm.expiryDate.split('-').reverse();
                              const prodDate = new Date(`${prodYear}-${prodMonth}-${prodDay}`);
                              const expDate = new Date(`${expYear}-${expMonth}-${expDay}`);
                              if (prodDate >= expDate) {
                                alert('Ngày sản xuất phải trước ngày hạn sử dụng!');
                                return;
                              }
                              // Chuyển định dạng ngày sang dd/mm/yyyy khi lưu
                              const formatDate = (iso) => {
                                if (!iso) return '';
                                if (iso.includes('/')) return iso; // đã đúng dạng dd/mm/yyyy
                                if (!iso.includes('-')) return iso;
                                const [y, m, d] = iso.split('-');
                                return `${d}/${m}/${y}`;
                              };

                              const productToSave = {
                                ...productForm,
                                productionDate: formatDate(productForm.productionDate),
                                expiryDate: formatDate(productForm.expiryDate),
                                qrCode: productForm.index,
                                qrImage: productForm.qrImage,
                                image: productForm.image
                              };
                              try {
                                if (editIndex) {
                                  // Sửa sản phẩm
                                  await fetch(`http://192.168.5.119:3001/api/products/${editIndex}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(productToSave)
                                  });
                                } else {
                                  // Tự động tạo mã QR và ảnh QR
                                  const url = `http://192.168.5.119:5173/product/${productForm.index}`;
                                  const qrImage = await QRCode.toDataURL(url, { width: 450, margin: 2 });
                                  const productToSave = {
                                    ...productForm,
                                    qrCode: productForm.index,
                                    qrImage
                                  };
                                  const res = await fetch('http://192.168.5.119:3001/api/products', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(productToSave)
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    fetch('http://192.168.5.119:3001/api/products')
                                      .then(res => res.json())
                                      .then(data => setProducts(data));
                                    setShowAddForm(false);
                                    setProductForm({
                                      image: '',
                                      id: '',
                                      batchCode: '',
                                      name: '',
                                      origin: '',
                                      productionDate: '',
                                      expiryDate: '',
                                      qrCode: '',
                                      qrImage: '',
                                      index: ''
                                    });
                                    alert('Thêm sản phẩm thành công!');
                                  } else {
                                    alert('Thêm sản phẩm thất bại!');
                                  }
                                }
                                // Sau khi thêm/sửa, reload danh sách
                                fetch('http://192.168.5.119:3001/api/products')
                                  .then(res => res.json())
                                  .then(data => setProducts(data));
                                setShowAddForm(false);
                                setProductForm({ id: '', batchCode: '', name: '', origin: '', productionDate: '', expiryDate: '', qrCode: '', qrImage: '' });
                                setEditIndex(null);
                              } catch (err) {
                                alert('Lỗi khi thêm sản phẩm!');
                              }
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            {editIndex ? 'Cập nhật' : 'Lưu'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Code Image Modal */}
              {qrImage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-4 rounded">
                    <img src={qrImage} alt="QR" />
                    <button onClick={() => setQrImage(null)}>Đóng</button>
                  </div>
                </div>
              )}

              {/* Add Type Form Modal */}
              {showAddTypeForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Thêm loại sản phẩm</h3>
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Mã sản phẩm"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={productForm.id}
                          onChange={e => setProductForm({ ...productForm, id: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="Tên sản phẩm"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={productForm.name}
                          onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                        />
                        {/* <input
                          type="text"
                          placeholder="Hạn sử dụng"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={productForm.expiryDate}
                          onChange={e => setProductForm({ ...productForm, expiryDate: e.target.value })}
                        /> */}
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          onChange={e => setProductForm({ ...productForm, image: e.target.files[0] })}
                        />
                      </div>
                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          onClick={() => setShowAddTypeForm(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={async () => {
                            if (!productForm.id || !productForm.name || !productForm.image) {
                              alert('Vui lòng nhập đủ thông tin!');
                              return;
                            }
                            const formData = new FormData();
                            formData.append('id', productForm.id);
                            formData.append('name', productForm.name);
                            formData.append('image', productForm.image);

                            let res = await fetch('http://192.168.5.119:3001/api/product-types', {
                              method: 'POST',
                              body: formData
                            });
                            const data = await res.json();
                            if (data.success) {
                              fetch('http://192.168.5.119:3001/api/product-types')
                                .then(res => res.json())
                                .then(data => setProductTypes(data));
                              setShowAddTypeForm(false);
                              setProductForm({ id: '', name: '', image: null });
                            } else {
                              alert('Thêm loại sản phẩm thất bại!');
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sửa Type Form Modal */}
              {showEditTypeForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Chỉnh sửa loại sản phẩm</h3>
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Mã sản phẩm"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={editTypeForm.productId}
                          onChange={e => setEditTypeForm({ ...editTypeForm, productId: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="Tên sản phẩm"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={editTypeForm.name}
                          onChange={e => setEditTypeForm({ ...editTypeForm, name: e.target.value })}
                        />
                        {/* <input
                          type="text"
                          placeholder="Hạn sử dụng"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={editTypeForm.expiryDate || ''}
                          onChange={e => setEditTypeForm({ ...editTypeForm, expiryDate: e.target.value })}
                        /> */}
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          onChange={e => setEditTypeForm({ ...editTypeForm, image: e.target.files[0] })}
                        />
                        {typeof editTypeForm.image === 'string' && (
                          <img
                            src={
                              editTypeForm.image.startsWith('http')
                                ? editTypeForm.image
                                : `http://192.168.5.119:3001${editTypeForm.image.startsWith('/') ? editTypeForm.image : '/' + editTypeForm.image}`
                            }
                            alt="Ảnh hiện tại"
                            className="w-16 h-16 object-cover rounded border"
                          />
                        )}
                      </div>
                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          onClick={() => setShowEditTypeForm(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Hủy
                        </button>
                        <button
                          // Trong phần onClick của nút Lưu trong modal sửa sản phẩm
onClick={async () => {
  try {
    if (!editTypeForm.productId || !editTypeForm.name) {
      alert('Vui lòng nhập đủ thông tin!');
      return;
    }
    
    const formData = new FormData();
    formData.append('productId', editTypeForm.productId);
    formData.append('name', editTypeForm.name);
    if (editTypeForm.image instanceof File) {
      formData.append('image', editTypeForm.image);
    }

    // Sử dụng oldProductId trong URL
    const res = await fetch(`http://192.168.5.119:3001/api/product-types/${editTypeForm.oldProductId}`, {
      method: 'PUT',
      body: formData
    });

    const data = await res.json();
    if (data.success) {
      // Refresh danh sách sau khi cập nhật
      fetch('http://192.168.5.119:3001/api/product-types')
        .then(res => res.json())
        .then(data => setProductTypes(data));
      setShowEditTypeForm(false);
      alert('Cập nhật thành công!');
    } else {
      throw new Error(data.message || 'Cập nhật thất bại');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Lỗi khi cập nhật: ' + error.message);
  }
}}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {qrEdit && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
      <h3 className="text-lg font-semibold mb-4">Xuất mã QR</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Khối lượng (kg)</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            value={qrEdit.weight}
            onChange={e => setQrEdit({ ...qrEdit, weight: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Liên hệ</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            value={qrEdit.phone}
            onChange={e => setQrEdit({ ...qrEdit, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hạn sử dụng</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            value={qrEdit.expiryDate}
            onChange={e => setQrEdit({ ...qrEdit, expiryDate: e.target.value })}
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-6">
        <button
          className="px-4 py-2 border rounded text-gray-700"
          onClick={() => setQrEdit(null)}
        >
          Hủy
        </button>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded"
          onClick={() => {
            handleExportQR(qrEdit);
            setQrEdit(null);
          }}
        >
          Xuất mã QR
        </button>
      </div>
    </div>
  </div>
)}
          {exportQRProduct && (
            <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
              <div
                id="qr-export-area"
                style={{
                  width: 320,
                  height: 200,
                  background: '#fff',
                  border: '1px solid #ccc',
                  padding: 12,
                  fontFamily: 'Arial'
                }}
              >
                <div style={{ color: '#008000', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
                  HTX RAU QUẢ SẠCH CHÚC SƠN
                </div>
                <div style={{ display: 'flex', marginTop: 8 }}>
                  <div>
                    <img src={exportQRProduct.qrImage} alt="QR" style={{ width: 90, height: 90 }} />
                  </div>
                  <div style={{ marginLeft: 12, fontSize: 14 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 15 }}>{exportQRProduct.name}</div>
                    <div>Lô: {exportQRProduct.batchCode}</div>
                    <div>KL: {exportQRProduct.weight || '...'}</div>
                    <div>NSX: {exportQRProduct.productionDate}</div>
                    <div>LH: {exportQRProduct.phone || '0975655507'}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, marginTop: 8, textAlign: 'center' }}>
                  {exportQRProduct.productId} <br /> {exportQRProduct.batchCode}
                </div>
                <div style={{ color: '#008000', fontWeight: 'bold', fontSize: 16, marginTop: 6, textAlign: 'center' }}>
                  <span style={{ background: '#fff', padding: '0 4px' }}>e</span> VIETGAP
                </div>
                <div style={{ color: '#009966', fontSize: 13, textAlign: 'center' }}>
                  Hotline: 0906 213 828
                </div>
              </div>
            </div>
          )}
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;