import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SidebarMenu, { menuItems } from './components/menu.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Overview from './pages/overview.jsx';
import ProductTypes from './pages/ProductTypes.jsx';
import Plot from './pages/Plot.jsx';
import CropDiary from './pages/CropDiary.jsx';
import Report from './pages/Report.jsx';
import TraceabilityTable from './pages/TraceabilityTable.jsx';
import QRExportList from './pages/QRExportList.jsx';
import AddFormModal from './components/AddFormModal';
import AddTypeModal from './components/AddTypeModal';
import EditTypeModal from './components/EditTypeModal';
import QRExportModal from './components/QRExportModal';
import QRImageModal from './components/QRImageModal';
import Login from './pages/Login.jsx';
import UserManagement from './components/UserManagement';
import ProductionManagement from './components/ProductionManagement';
import {
  useProducts, useProductTypes, useCropDiaries,
  useCompletedDiaries, useExportedQRs
} from './hooks/dataHooks';
import {
  Settings, Menu, X, Sprout, User, QrCode, Package, Users
} from 'lucide-react';
import { displayDate, displayExpiryDate, downloadQRAsWord } from './utils/Utils';
import { API_BASE_URL } from './services/api';

function App() {
  // --- State ---
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
  const [showEditTypeForm, setShowEditTypeForm] = useState(false);
  const [editTypeForm, setEditTypeForm] = useState({ productId: '', name: '', image: '' });
  const [diaryList, setDiaryList] = useState([]);
  const [completedDiaries, setCompletedDiaries] = useState([]);
  const [exportedQRs, setExportedQRs] = useState([]);
  const [exportQRProduct, setExportQRProduct] = useState(null);
  const [qrEdit, setQrEdit] = useState(null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // Thêm state và fetch processStages (quy trình sản xuất)
  const [processStages, setProcessStages] = useState([]);
  useEffect(() => {
    fetch(`${API_BASE_URL}/prod-process`)
      .then(res => res.json())
      .then(data => setProcessStages(data));
  }, []);

  // --- Data fetching ---
  useProducts(setProducts);
  useProductTypes(setProductTypes);
  useCropDiaries(setDiaryList);
  useCompletedDiaries(setCompletedDiaries);

  // Fetch danh sách QR ngay khi component mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/products`)
      .then(res => res.json())
      .then(data => setExportedQRs(data));
  }, []); // Chạy 1 lần khi mount

  // Fetch danh sách QR đã xuất khi component mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/exported-qr`)
      .then(res => res.json())
      .then(data => setExportedQRs(data));
  }, []);

  // --- Derived values ---
  const filteredProductList = products.filter(product =>
    !searchTerm ||
    product.batchCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.expiryDate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.qrCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.origin?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalArea = diaryList.reduce((sum, diary) => sum + (parseFloat(diary.area) || 0), 0);

  // Đếm số QR đã xuất từ exportedQRs
  const totalQRCodes = exportedQRs?.length || 0;

  // Add to the menuItems array:
  const adminMenuItems = [
    ...menuItems,
    {
      id: 'users',
      label: 'Quản lý người dùng',
      icon: Users,
      show: user?.role === 'admin'
    }
  ];

  // --- Handlers ---
  const handleEditType = (type) => {
    setEditTypeForm(type);
    setShowEditTypeForm(true);
  };

  async function handleExportQR(qrEdit) {
    const res = await fetch(`${API_BASE_URL}/product-info?index=${qrEdit.index}`);
    const product = await res.json();
    const exportData = {
      ...product,
      weight: qrEdit.weight,
      phone: qrEdit.phone,
      expiryDate: qrEdit.expiryDate
    };
    await fetch(`${API_BASE_URL}/export-qr`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-role': user?.role || 'user'
      },
      body: JSON.stringify(exportData)  
    });
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // --- Main render ---
  return (
    <Routes>
      <Route path="/product/:index" element={<ProductDetail products={products} />} />
      <Route path="/users" element={
        user?.role === 'admin' ? <UserManagement /> : <Navigate to="/" />
      } />
      <Route path="/*" element={
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
              user={user}
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
                  <span>{user?.username || 'Tài khoản'}</span>
                  <button
                    onClick={handleLogout}
                    className="ml-2 px-3 py-1 bg-white text-green-700 rounded hover:bg-green-100 border border-green-200 transition"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            </header>
            {activeMenu === 'traceability' && (
              <div className="bg-white border-b border-gray-200">
                <div className="px-6">
                  <nav className="flex space-x-8">
                    <button
                      onClick={() => setActiveTab('traceability')}
                      className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === 'traceability'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      <Package className="w-5 h-5 inline mr-2" />
                      Truy xuất nguồn gốc nông sản
                    </button>
                    <button
                      onClick={() => setActiveTab('qr-list')}
                      className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === 'qr-list'
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
                  totalArea={totalArea}
                  totalQRCodes={totalQRCodes}
                />
              )}
              {activeMenu === 'production' && (
                <ProductionManagement processStages={processStages} setProcessStages={setProcessStages} />
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
              {activeMenu === 'users' && user?.role === 'admin' && (
                <UserManagement />
              )}
              {activeMenu !== 'overview' && activeMenu !== 'products' && activeMenu !== 'plot' && activeMenu !== 'traceability' && activeMenu !== 'crop-diary' && activeMenu !== 'reports' && activeMenu !== 'production' && activeMenu !== 'users' && (
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
                    <TraceabilityTable 
                      products={products}
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      setEditIndex={setEditIndex}
                      setProductForm={setProductForm}
                      setShowAddForm={setShowAddForm}
                      setQrImage={setQrImage}
                      setQrEdit={setQrEdit}
                      rowsPerPage={rowsPerPage}
                      setRowsPerPage={setRowsPerPage}
                      page={page}
                      setPage={setPage}
                      filteredProductList={filteredProductList}
                      setProducts={setProducts}
                    />
                  )}

                  {activeTab === 'qr-list' && (
                    <QRExportList
                      exportedQRs={exportedQRs}
                      setExportedQRs={setExportedQRs}
                    />
                  )}
                </div>
              )}
              {/* Nhật ký trồng trọt */}
              {activeMenu === 'crop-diary' && (
                <CropDiary
                  onSelectindex={index => {
                    console.log('Truy xuất nhật ký cho mã lô:', index);
                  }}
                />
              )}

            </main>
          </div>
          {/* --- Modals --- */}
          {showAddForm && (
            <AddFormModal
              // truyền props cần thiết
              {...{ productForm, setProductForm, setShowAddForm, editIndex, setEditIndex, setProducts }}
            />
          )}
          {showAddTypeForm && (
            <AddTypeModal
              {...{ productForm, setProductForm, setShowAddTypeForm, setProductTypes }}
            />
          )}
          {showEditTypeForm && (
            <EditTypeModal
              {...{ editTypeForm, setEditTypeForm, setShowEditTypeForm, setProductTypes }}
            />
          )}
          {qrEdit && (
            <QRExportModal
              {...{ qrEdit, setQrEdit, handleExportQR }}
            />
          )}
          {qrImage && (
            <QRImageModal
              {...{ qrImage, setQrImage }}
            />
          )}
        </div>
      } />
    </Routes>
  );
}

export default App;