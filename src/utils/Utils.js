import html2canvas from "html2canvas";
import { saveAs } from "file-saver";

// Định dạng ngày
export function displayDate(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// Định dạng hạn sử dụng
export function displayExpiryDate(expiryDate) {
  if (!expiryDate) return '';
  const date = new Date(expiryDate);
  if (!isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }
  return expiryDate;
}

// 1. Thêm hàm in QR
  //   function printQR(qr) {
  //   const printWindow = window.open('', '_blank', 'width=250,height=400');
  //   printWindow.document.write(`
  //     <html>
  //       <head>
  //         <title>In mã QR</title>
  //         <style>
  //           body { font-family: Arial, sans-serif; padding: 1px; }
  //           .qr-border {
  //             border: 2px solid #008000;
  //             border-radius: 12px;
  //             padding: 18px 2px 10px 2px;
  //             max-width: 280px;
  //             margin: 0;
  //             background: #fff;
  //           }
  //           .title { color: #008000; font-weight: bold; font-size: 20px; text-align: center; margin-bottom: 10px; }
  //           .qr-row { display: flex; align-items: flex-start; justify-content: center; }
  //           .qr-img { width: 110px; height: 110px; border: 1px solid #eee; background: #fff; margin-right: 18px; }
  //           .info { font-size: 14px; color: #222; }
  //           .info .name { font-weight: bold; font-size: 16px; margin-bottom: 6px; }
  //           .info div { margin-bottom: 2px; }
  //           .brand { color: #009966; font-weight: bold; font-size: 15px; margin-top: 10px; text-align: center; }
  //           .hotline { color: #009966; font-size: 13px; text-align: center; }
  //         </style>
  //       </head>
  //       <body>
  //         <div class="qr-border">
  //           <div class="title">HTX RAU QUẢ SẠCH</div>
  //           <div class="qr-row">
  //             <img src="${qr.qrImage}" class="qr-img" alt="QR" />
  //             <div class="info">
  //               <div class="name">${qr.name}</div>
  //               <div>Lô: ${qr.batchCode}</div>
  //               <div>KL: ${qr.weight || ''} kg</div>
  //               <div>NSX: ${qr.productionDate || qr.NSX || ''}</div>
  //               <div>HSD: ${qr.expiryDate || qr.HSD || ''}</div>
  //               <div>LH: ${qr.phone || ''}</div>
  //             </div>
  //           </div>
  //           <div class="brand">DTHHoldings</div>
  //           <div class="hotline">Hotline: 0847605605</div>
  //         </div>
  //         <script>window.onload = function() { window.print(); }</script>
  //       </body>
  //     </html>
  //   `);
  //   printWindow.document.close();
  // }

// Xuất QR ra file Word
export async function downloadQRAsWord(qr) {
  const response = await fetch(qr.qrImage);
  const blob = await response.blob();
  const reader = new FileReader();
  reader.onloadend = function () {
    const base64 = reader.result;
    const html = `
      <html>
      <head>
        <meta charset='utf-8'>
        <title>QR</title>
        <style>
          @page { size: A4 landscape; margin: 0; }
          body { font-family: Times New Roman, Arial, sans-serif; }
          .qr-outer { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 1122px; height: 793px; margin: 0 auto; padding: 10px; background: #fff; display: block; text-align: center; }
          .qr-title { color: #008000; font-weight: bold; font-size: 45px; text-align: center; margin-bottom: 20px; }
          .qr-table { width: 100%; border-collapse: collapse; margin-bottom: 5px; row-gap: 20px; padding-left: 30px; }
          .qr-img-cell { display: flex; flex-direction: column; width: 280px; vertical-align: top; text-align: center; }
          .qr-index { font-size: 30px; color: #000000; font-weight: bold; margin-top: 10px; }
          .qr-info-cell { vertical-align: top; padding-left: 38px; }
          .qr-name { font-weight: bold; font-size: 40px; margin-bottom: 10px; margin-top: 20px; }
          .qr-meta { font-size: 34px; margin-bottom: 0px; }
          .qr-footer { color: #009966; font-weight: bold; font-size: 39px; margin-top: 5px; text-align: center; }
          .qr-hotline { color: #009966; font-size: 34px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="qr-outer">
          <div class="qr-title">Tem truy xuất nguồn gốc nông sản</div>
          <table class="qr-table">
            <tr>
              <td class="qr-img-cell">
                <img src="${base64}" alt="QR" class="w-30 h-30 border bg-white object-contain" />
                <div class="qr-index">${qr.index}</div>
              </td>
              <td class="qr-info-cell">
                <div class="qr-name">${qr.name}</div>
                <div class="qr-meta">CS: HTX Lâm Đồng</div>
                <div class="qr-meta">Lô: ${qr.batchCode}</div>
                <div class="qr-meta">KL: ${qr.weight || ''} kg</div>
                <div class="qr-meta">NSX: ${qr.productionDate || qr.NSX || ''}</div>
                <div class="qr-meta">HSD: ${qr.expiryDate || qr.HSD || ''}</div>
                <div class="qr-meta">LH: ${qr.phone || ''}</div>
              </td>
            </tr>
          </table>
          <div class="qr-footer">DTHHoldings</div>
          <div class="qr-hotline">Hotline: 0847605605</div>
        </div>
      </body>
      </html>
    `;
    const blobWord = new Blob(['\ufeff', html], { type: 'application/msword' });
    saveAs(blobWord, `${qr.name || 'qr'}_${qr.batchCode}.doc`);
  };
  reader.readAsDataURL(blob);
}

// Xuất QR ra ảnh và ghi log
export async function handleExportQR(product, setExportQRProduct, setExportedQRs) {
  setExportQRProduct(product);
  setTimeout(async () => {
    const node = document.getElementById('qr-export-area');
    if (!node) return;
    const canvas = await html2canvas(node);
    const link = document.createElement('a');
    link.download = `${product.name || 'qr'}_${product.batchCode}.png`;
    link.href = canvas.toDataURL();
    link.click();

    await fetch('http://192.168.5.119:3001/api/export-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.productId,
        batchCode: product.batchCode,
        name: product.name,
        weight: product.weight,
        phone: product.phone,
        qrImage: product.qrImage,
        index: product.index
      })
    });

    fetch('http://192.168.5.119:3001/api/exported-qr')
      .then(res => res.json())
      .then(data => setExportedQRs(data));

    setExportQRProduct(null);
  }, 200);
}