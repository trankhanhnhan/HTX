import { useEffect } from 'react';

export function useFetch(url, setter) {
  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setter);
  }, [url, setter]);
}

export function useProducts(setProducts) {
  useFetch('http://172.16.0.119:3001/api/products', setProducts);
}
export function useProductTypes(setProductTypes) {
  useFetch('http://172.16.0.119:3001/api/product-types', setProductTypes);
}
export function usePlots(setPlots) {
  useFetch('http://172.16.0.119:3001/api/plots', setPlots);
}
export function useCropDiaries(setDiaryList) {
  useFetch('http://172.16.0.119:3001/api/crop-diaries', setDiaryList);
}
export function useCompletedDiaries(setCompletedDiaries) {
  useFetch('http://172.16.0.119:3001/api/complete-diaries', setCompletedDiaries);
}
export function useExportedQRs(setExportedQRs, activeTab) {
  useEffect(() => {
    if (activeTab === 'qr-list') {
      fetch('http://172.16.0.119:3001/api/exported-qr')
        .then(res => res.json())
        .then(setExportedQRs);
    }
  }, [activeTab, setExportedQRs]);
}

export function useProductionProcesses(setProcessStages) {
  useFetch('http://172.16.0.119:3001/api/prod-process', setProcessStages);
}
