import React, { useEffect, useState } from 'react';
import { Sprout } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';

function ProductDetail() {
  const { index } = useParams();
  const [product, setProduct] = useState(null);
  const [processStages, setProcessStages] = useState([]);

  useEffect(() => {
    // Lấy dữ liệu sản phẩm từ server
    fetch(`${API_BASE_URL}/products`)
      .then(res => res.json())
      .then(data => {
        const found = data.find(p => p.index === index);
        setProduct(found || null);
      });
    // Lấy dữ liệu các giai đoạn sản xuất từ server
    fetch(`${API_BASE_URL}/prod-process`)
      .then(res => res.json())
      .then(data => setProcessStages(data))
      .catch(() => setProcessStages([]));
  }, [index]);

  if (!product) return <div className="p-8">Đang tải...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-2 py-8">
      <div className="w-full max-w-full md:max-w-3xl bg-white rounded-2xl shadow-xl p-3 md:p-10">
        <div className="flex flex-col items-center">
          <Sprout className="w-12 h-12 md:w-16 md:h-16 text-green-500 mb-2" />
          <h2 className="text-xl md:text-3xl font-bold mb-2 text-green-700 text-center">Thông tin sản phẩm</h2>
          <div className="w-12 md:w-24 h-1 bg-green-200 rounded mb-4"></div>
        </div>
        <div className="flex flex-row items-center justify-evenly gap-4 mb-6">
          {product.image && (
            <div className="flex-shrink-0 flex justify-center">
              <img
                src={
                  product.image.startsWith('http')
                    ? product.image 
                    : `${API_BASE_URL.replace('/api', '')}${product.image}`
                }
                alt="Hình ảnh sản phẩm"
                className="w-28 h-28 sm:w-32 sm:h-32 md:w-60 md:h-60 object-cover border-2 border-green-200 rounded-lg shadow"
              />
            </div>
          )}
          <div className="space-y-2 text-base sm:text-lg">
            <div><span className="font-semibold text-gray-700">Mã lô:</span> <span className="text-gray-900">{product.batchCode}</span></div>
            <div><span className="font-semibold text-gray-700">Mã sản phẩm:</span> <span className="text-gray-900">{product.productId}</span></div>
            <div><span className="font-semibold text-gray-700">Tên sản phẩm:</span> <span className="text-gray-900">{product.name}</span></div>
            <div><span className="font-semibold text-gray-700">Nguồn gốc:</span> <span className="text-gray-900">{product.origin}</span></div>
            <div><span className="font-semibold text-gray-700">Ngày sản xuất:</span> <span className="text-gray-900">{product.productionDate}</span></div>
            <div><span className="font-semibold text-gray-700">Hạn sử dụng:</span> <span className="text-gray-900">{product.expiryDate}</span></div>
          </div>
        </div>

        {/* Hiển thị quá trình sản xuất từ prodProcess.csv */}
        {processStages.filter(step => step.index === product.index).length > 0 && (
          <div className="mt-8 pl-6 pr-4 md:mt-10">
            <h3 className="text-lg md:text-xl font-bold text-green-700 mb-4">Quá trình sản xuất</h3>
            <div className="relative pl-8 md:pl-16">
              <div className="absolute -left-1 top-0 bottom-0 w-1 bg-green-400 rounded-full z-0"></div>
              <div className="space-y-7 -ml-2 md:-ml-8">
                {processStages
                  .filter(step => step.index === product.index)
                  .map((step, idx) => (
                    <div key={idx} className="">
                      <div className="absolute -left-2.5  w-4 h-4 bg-white border-2 border-green-400 rounded-full"></div>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold pb-9">Công việc {idx + 1}: {step.stage}</span>
                        </div>
                        <div className="text-blue-600 text-sm font-medium">{step.date && new Date(step.date).toLocaleDateString('vi-VN')}</div>
                      </div>
                      <div className="mt-1 text-gray-700">- {step.content}</div>
                      {step.imageProd && step.imageProd !== '""' && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(Array.isArray(step.imageProd) ? step.imageProd : step.imageProd.split(','))
                            .map((img, i) => (
                              img.trim() && (
                                <img
                                  key={i}
                                  src={img.replace(/^"|"$/g, '').trim()}
                                  alt="Ảnh công việc"
                                  className="w-40 h-28 object-cover rounded shadow border"
                                />
                              )
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
    </div>
  );
}
export default ProductDetail;