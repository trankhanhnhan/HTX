import React from 'react';

function QRImageModal({ qrImage, setQrImage }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded">
        <img src={qrImage} alt="QR" />
        <button onClick={() => setQrImage(null)}>Đóng</button>
      </div>
    </div>
  );
}

export default QRImageModal;
