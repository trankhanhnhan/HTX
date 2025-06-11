import React from 'react';
import { Search } from 'lucide-react';
import { downloadQRAsWord } from '../utils/Utils';

function QRExportList({ exportedQRs, searchTerm, setSearchTerm }) {
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
  );
}

export default QRExportList;
