import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { downloadQRAsWord } from '../utils/Utils';

function QRExportList({ exportedQRs, setExportedQRs, searchTerm, setSearchTerm }) {
  // Lấy dữ liệu QR đã xuất khi mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/exported-qr`)
      .then(res => res.json())
      .then(data => {
        console.log('ExportedQRs:', data);
        if (Array.isArray(data) && typeof setExportedQRs === 'function') {
          setExportedQRs(data);
        }
      });
  }, []);

  // Thêm state cho phân trang
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [page, setPage] = useState(1);

  // Lọc theo searchTerm
  const filteredQRs = exportedQRs.filter(qr =>
    !searchTerm ||
    qr.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qr.batchCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qr.productId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cắt mảng theo trang
  const pagedQRs = filteredQRs.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

 return (
    <div className="overflow-x-auto">
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
        {pagedQRs.map((qr, idx) => (
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
                  <img src="/src/smartlook-0.png" alt="Logo công ty" style={{ height: 40, objectFit: 'contain' }} />
                </div>
                <div className="text-green-700 text-sm ">Hotline: </div>
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
        {filteredQRs.length === 0 && (
          <div className="col-span-full text-gray-400 text-center">
            Chưa có mã QR nào được xuất
          </div>
        )}
      </div>
      {/* Phân trang */}
      <div className="flex items-center justify-between my-4">
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
          {Array.from({ length: Math.ceil(filteredQRs.length / rowsPerPage) }, (_, i) => (
            <button
              key={i}
              className={`px-2 py-1 border rounded text-sm ${page === i + 1 ? 'bg-green-100 font-bold' : ''}`}
              onClick={() => setPage(i + 1)}
            >{i + 1}</button>
          ))}
          <button
            className="px-2 py-1 border rounded text-sm"
            disabled={page === Math.ceil(filteredQRs.length / rowsPerPage) || filteredQRs.length === 0}
            onClick={() => setPage(page + 1)}
          >{">"}</button>
        </div>
      </div>
    </div>
  );
}

export default QRExportList;
