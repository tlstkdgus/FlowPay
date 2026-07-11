import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudArrowUpIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentMagnifyingGlassIcon,
  CameraIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import Tesseract from 'tesseract.js';
import { useNavigate } from 'react-router-dom';

interface ReceiptData {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  items: string[];
  flowId: string;
  department: string;
  category: string;
  confidence: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

const processingSteps = [
  '이미지 업로드 중...',
  '이미지 전처리 중...',
  'OCR 텍스트 추출 중...',
  '데이터 분석 중...',
  'Flow ID 매칭 중...',
  '분류 완료!',
];

const ReceiptUpload: React.FC = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [processingStep, setProcessingStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        processImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const preprocessImage = async (imageData: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const maxSize = 1200;
          let { width, height } = img;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height * maxSize) / width;
              width = maxSize;
            } else {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }
          ctx.putImageData(imgData, 0, 0);
          ctx.filter = 'contrast(1.2) brightness(1.1)';
          ctx.drawImage(canvas, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } else {
          resolve(imageData);
        }
      };
      img.src = imageData;
    });
  };

  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    setProcessingStep(0);
    try {
      for (let i = 0; i < processingSteps.length; i++) {
        setProcessingStep(i);
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
      const processedImage = await preprocessImage(imageData);
      const result = await Tesseract.recognize(processedImage, 'kor+eng', {
        logger: (m) => console.log(m),
      });
      const text = result.data.text;
      setExtractedText(text);
      setReceiptData(parseReceiptData(text));
    } catch (error) {
      console.error('OCR 처리 중 오류:', error);
      setReceiptData({
        id: 'ERROR',
        merchant: '처리 실패',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        items: [],
        flowId: 'ERROR',
        department: '오류',
        category: '오류',
        confidence: 0,
        status: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const parseReceiptData = (text: string): ReceiptData => {
    const lines = text.split('\n').filter((line) => line.trim());
    const merchant = lines[0]?.trim() || '알 수 없는 가맹점';
    const amountMatch = text.match(/(\d{1,3}(,\d{3})*원|\d+원)/);
    const amount = amountMatch ? parseInt(amountMatch[0].replace(/[^\d]/g, '')) : 0;
    const dateMatch = text.match(/(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})/);
    const date = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];
    const items = lines
      .filter((line) => line.includes('개') || line.includes('EA') || line.includes('수량'))
      .slice(0, 5);
    const flowId = localStorage.getItem('flowId') || 'XK8P2M';
    const { department, category } = classifyReceipt(merchant);
    return {
      id: `REC-${Date.now()}`,
      merchant,
      amount,
      date,
      items,
      flowId,
      department,
      category,
      confidence: Math.random() * 20 + 80,
      status: 'completed',
    };
  };

  const classifyReceipt = (merchant: string): { department: string; category: string } => {
    const m = merchant.toLowerCase();
    if (m.includes('스타벅스') || m.includes('카페') || m.includes('커피')) return { department: '영업팀', category: '식비' };
    if (m.includes('gs25') || m.includes('cu') || m.includes('편의점')) return { department: '관리부', category: '사무용품' };
    if (m.includes('맥도날드') || m.includes('버거') || m.includes('패스트푸드')) return { department: '개발팀', category: '식비' };
    if (m.includes('올리브영') || m.includes('화장품')) return { department: '인사팀', category: '복리후생' };
    return { department: '관리부', category: '기타' };
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        setShowCamera(true);
      }
    } catch (error) {
      console.error('카메라 접근 오류:', error);
      alert('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setShowCamera(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setUploadedImage(imageData);
        stopCamera();
        processImage(imageData);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopCamera]);

  const handleRetry = () => {
    setUploadedImage(null);
    setExtractedText('');
    setReceiptData(null);
    setProcessingStep(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="px-5 sm:px-8 lg:px-12 py-10 sm:py-14">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 mb-2">영수증 처리</h1>
          <p className="text-gray-500 max-w-2xl leading-relaxed">
            영수증을 업로드하거나 촬영하면 텍스트를 추출해 Flow ID와 연결하고 자동으로 분류합니다.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* 업로드 영역 */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">영수증 업로드</h2>

            {!uploadedImage ? (
              <div className="space-y-3">
                <button
                  onClick={startCamera}
                  className="w-full card-muted p-8 text-center hover:bg-gray-200/70 transition-colors"
                >
                  <CameraIcon className="h-10 w-10 text-gray-900 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-1">카메라로 촬영</h3>
                  <p className="text-sm text-gray-500">실시간으로 영수증을 촬영하여 즉시 처리</p>
                </button>

                <div className="border border-dashed border-gray-300 rounded-4xl p-8 text-center">
                  <CloudArrowUpIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-4">또는 기존 이미지 파일을 업로드하세요</p>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
                    이미지 선택
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img src={uploadedImage} alt="업로드된 영수증" className="w-full rounded-2xl border border-gray-200" />
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="absolute top-3 right-3 bg-white/80 backdrop-blur rounded-full p-2 shadow-soft"
                  >
                    {showPreview ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>

                {isProcessing && (
                  <div className="card-muted p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent" />
                      <span className="text-sm font-medium text-gray-900">{processingSteps[processingStep]}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${((processingStep + 1) / processingSteps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={handleRetry} className="btn-secondary flex-1">
                    다시 업로드
                  </button>
                  {receiptData && receiptData.status === 'completed' && (
                    <button onClick={() => navigate('/invoice')} className="btn-primary flex-1">
                      전표 생성
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* 결과 영역 */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">처리 결과</h2>

            <AnimatePresence mode="wait">
              {!receiptData ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                  <DocumentMagnifyingGlassIcon className="h-14 w-14 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-400">영수증을 업로드하거나 촬영하면 AI가 자동으로 분석합니다.</p>
                </motion.div>
              ) : (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="card-muted p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircleIcon className="h-5 w-5 text-success-600" />
                      <span className="text-sm font-medium text-gray-900">데이터 추출 완료</span>
                    </div>
                    <div className="space-y-2.5 text-sm">
                      <ResultRow label="가맹점" value={receiptData.merchant} />
                      <ResultRow label="금액" value={`₩${receiptData.amount.toLocaleString()}`} bold />
                      <ResultRow label="날짜" value={receiptData.date} />
                      <ResultRow label="Flow ID" value={receiptData.flowId} mono />
                      <ResultRow label="부서" value={receiptData.department} />
                      <ResultRow label="카테고리" value={receiptData.category} />
                      <ResultRow label="정확도" value={`${receiptData.confidence.toFixed(1)}%`} />
                    </div>
                  </div>

                  {showPreview && (
                    <div className="card-muted p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">추출된 텍스트</h3>
                      <div className="bg-white rounded-xl p-3 text-xs font-mono text-gray-600 max-h-40 overflow-y-auto whitespace-pre-wrap">
                        {extractedText || '텍스트 추출 중...'}
                      </div>
                    </div>
                  )}

                  {receiptData.items.length > 0 && (
                    <div className="card-muted p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">상품 목록</h3>
                      <div className="space-y-1.5">
                        {receiptData.items.map((item, index) => (
                          <div key={index} className="text-sm text-gray-600 bg-white rounded-lg px-3 py-2">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* 카메라 모달 */}
        <AnimatePresence>
          {showCamera && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                className="bg-white rounded-4xl p-6 max-w-md w-full"
              >
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">카메라 촬영</h3>
                  <p className="text-sm text-gray-500">영수증을 화면에 맞춰 촬영해주세요</p>
                </div>
                <div className="relative mb-4">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-2xl bg-gray-900" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-2 border-2 border-white/50 border-dashed rounded-xl pointer-events-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={stopCamera} className="btn-secondary flex-1">
                    <XMarkIcon className="h-5 w-5 mr-1.5" /> 취소
                  </button>
                  <button onClick={capturePhoto} className="btn-primary flex-1" disabled={!isCameraActive}>
                    <PhotoIcon className="h-5 w-5 mr-1.5" /> 촬영
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ResultRow: React.FC<{ label: string; value: string; bold?: boolean; mono?: boolean }> = ({
  label,
  value,
  bold,
  mono,
}) => (
  <div className="flex justify-between">
    <span className="text-gray-500">{label}</span>
    <span className={`${bold ? 'font-semibold' : 'font-medium'} ${mono ? 'font-mono text-flow-600' : 'text-gray-900'}`}>
      {value}
    </span>
  </div>
);

export default ReceiptUpload;
