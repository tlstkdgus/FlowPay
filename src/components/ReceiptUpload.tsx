import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudArrowUpIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentMagnifyingGlassIcon,
  CameraIcon,
  PhotoIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  LinkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Field, Page, PageHeader, Row, fade, useToast } from './ui';
import { useFlowPay } from '../store/FlowPayContext';
import { myTransactions, needsReceipt, receiptCandidates } from '../store/selectors';
import { CATEGORIES } from '../data/constants';
import { classify } from '../utils/classifier';
import { parseReceipt } from '../utils/receiptParser';
import { formatDate, toDateKey, won } from '../utils/format';
import { CategoryId, LineItem, Transaction } from '../types';

interface Draft {
  merchant: string;
  amount: number;
  date: string;
  businessNumber: string;
  items: LineItem[];
  confidence?: number;
  rawText?: string;
}

const OCR_STATUS: Record<string, string> = {
  'loading tesseract core': 'OCR 엔진 불러오는 중',
  'initializing tesseract': 'OCR 엔진 초기화 중',
  'loading language traineddata': '한국어·영어 학습 데이터 불러오는 중',
  'initializing api': 'OCR 준비 중',
  'recognizing text': '텍스트 인식 중',
};

const emptyDraft = (): Draft => ({ merchant: '', amount: 0, date: toDateKey(new Date()), businessNumber: '', items: [] });

/** 인식률 향상을 위한 전처리: 축소 → 흑백 → 대비 강화 */
const preprocessImage = (imageData: string): Promise<{ processed: string; thumbnail: string }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve({ processed: imageData, thumbnail: imageData });
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const gray = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
        // 대비 1.4배 (128 기준)
        const v = Math.max(0, Math.min(255, (gray - 128) * 1.4 + 128));
        px[i] = px[i + 1] = px[i + 2] = v;
      }
      ctx.putImageData(data, 0, 0);
      const processed = canvas.toDataURL('image/jpeg', 0.92);

      const t = document.createElement('canvas');
      const ts = 240 / Math.max(img.width, img.height);
      t.width = Math.round(img.width * ts);
      t.height = Math.round(img.height * ts);
      t.getContext('2d')?.drawImage(img, 0, 0, t.width, t.height);
      resolve({ processed, thumbnail: t.toDataURL('image/jpeg', 0.6) });
    };
    img.onerror = () => reject(new Error('이미지를 읽을 수 없습니다.'));
    img.src = imageData;
  });

const ReceiptUpload: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { state, saveReceipt, createInvoices } = useFlowPay();

  const [image, setImage] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | undefined>();
  const [ocr, setOcr] = useState<{ status: string; progress: number } | null>(null);
  const [ocrError, setOcrError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [linkId, setLinkId] = useState<string>(params.get('tx') ?? '');
  // 사용자가 직접 연결 대상을 고른 뒤에는 자동 매칭으로 덮어쓰지 않음
  const [linkTouched, setLinkTouched] = useState(false);
  const [classOverride, setClassOverride] = useState<{ departmentId: string; categoryId: CategoryId; projectId?: string } | null>(null);
  const [saved, setSaved] = useState<{ transaction: Transaction } | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runId = useRef(0);

  const linkTarget = state.transactions.find((t) => t.id === linkId);

  /* ---------- OCR ---------- */

  const processImage = async (imageData: string) => {
    const id = ++runId.current;
    setImage(imageData);
    setDraft(null);
    setSaved(null);
    setOcrError('');
    setOcr({ status: '이미지 전처리 중', progress: 0 });
    try {
      const { processed, thumbnail: thumb } = await preprocessImage(imageData);
      setThumbnail(thumb);
      // 큰 라이브러리이므로 사용할 때만 불러옵니다.
      const { default: Tesseract } = await import('tesseract.js');
      const result = await Tesseract.recognize(processed, 'kor+eng', {
        logger: (m: { status: string; progress: number }) => {
          if (runId.current === id) setOcr({ status: OCR_STATUS[m.status] ?? m.status, progress: m.progress });
        },
      });
      if (runId.current !== id) return;
      const text = result.data.text;
      const parsed = parseReceipt(text);
      setDraft({
        merchant: parsed.merchant,
        amount: parsed.amount,
        date: parsed.date ?? toDateKey(new Date()),
        businessNumber: parsed.businessNumber ?? '',
        items: parsed.items,
        confidence: Math.round(result.data.confidence * 10) / 10,
        rawText: text,
      });
    } catch (error) {
      if (runId.current !== id) return;
      console.error('OCR 처리 중 오류:', error);
      setOcrError('텍스트를 인식하지 못했습니다. 네트워크 상태를 확인하거나 직접 입력해주세요.');
      setDraft(emptyDraft());
    } finally {
      if (runId.current === id) setOcr(null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('이미지 파일만 업로드할 수 있습니다', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => processImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  /* ---------- 카메라 ---------- */

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
    setShowCamera(false);
  }, []);

  // 모달이 렌더링되어 video 요소가 생긴 뒤에 스트림을 연결
  useEffect(() => {
    if (!showCamera) return;
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch (error) {
        console.error('카메라 접근 오류:', error);
        toast('카메라에 접근할 수 없습니다. 권한을 확인하거나 이미지를 업로드해주세요.', 'error');
        setShowCamera(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showCamera, toast]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    stopCamera();
    processImage(imageData);
  };

  /* ---------- 분류·매칭 ---------- */

  const auto = useMemo(
    () =>
      draft
        ? classify(
            { merchant: draft.merchant, items: draft.items, amount: draft.amount, departmentId: state.profile.departmentId },
            state.projects
          )
        : null,
    [draft, state.profile.departmentId, state.projects]
  );
  const classification = classOverride ?? (auto ? { departmentId: auto.departmentId, categoryId: auto.categoryId, projectId: auto.projectId } : null);

  const candidates = useMemo(() => {
    if (!draft) return [];
    const list = receiptCandidates(state, draft.amount, draft.date);
    return linkTarget && !list.some((t) => t.id === linkTarget.id) && !linkTarget.receiptId ? [linkTarget, ...list] : list;
  }, [draft, state, linkTarget]);

  // 금액이 일치하는 거래가 하나뿐이면 자동으로 연결 대상으로 선택
  useEffect(() => {
    if (!linkTouched && !linkId && candidates.length === 1) setLinkId(candidates[0].id);
  }, [candidates, linkId, linkTouched]);

  const pendingReceipts = useMemo(() => myTransactions(state).filter(needsReceipt).slice(0, 6), [state]);

  const updateDraft = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const updateItem = (index: number, patch: Partial<LineItem>) =>
    setDraft((d) => (d ? { ...d, items: d.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) } : d));

  const handleSave = () => {
    if (!draft || !classification) return;
    if (!draft.merchant.trim() || draft.amount <= 0) {
      toast('가맹점과 금액을 확인해주세요', 'error');
      return;
    }
    const target = candidates.find((t) => t.id === linkId);
    const { transaction } = saveReceipt({
      merchant: draft.merchant.trim(),
      amount: draft.amount,
      date: draft.date,
      businessNumber: draft.businessNumber || undefined,
      items: draft.items.filter((i) => i.name.trim() && i.price > 0),
      confidence: draft.confidence,
      rawText: draft.rawText,
      thumbnail,
      linkTransactionId: target?.id,
      ...classification,
    });
    setSaved({ transaction });
    if (params.get('tx')) setParams({}, { replace: true });
    toast(target ? `${transaction.id} 거래에 영수증을 연결했습니다` : '새 거래로 등록했습니다');
  };

  const handleCreateInvoice = () => {
    if (!saved) return;
    const existing = state.transactions.find((t) => t.id === saved.transaction.id)?.invoiceId;
    if (existing) {
      navigate(`/invoice?id=${existing}`);
      return;
    }
    const [invoice] = createInvoices([saved.transaction.id]);
    if (invoice) {
      toast(`${invoice.id} 전표를 생성했습니다`);
      navigate(`/invoice?id=${invoice.id}`);
    }
  };

  const handleReset = () => {
    runId.current++;
    setImage(null);
    setThumbnail(undefined);
    setDraft(null);
    setSaved(null);
    setOcr(null);
    setOcrError('');
    setClassOverride(null);
    setShowRaw(false);
    setLinkId('');
    setLinkTouched(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const savedInvoiceId = saved ? state.transactions.find((t) => t.id === saved.transaction.id)?.invoiceId : undefined;

  return (
    <Page>
      <PageHeader
        title="영수증 처리"
        description="영수증을 촬영하거나 업로드하면 텍스트를 추출해 거래와 자동으로 연결하고 분류합니다."
      />

      {linkTarget && !saved && (
        <motion.div {...fade} className="card p-4 sm:p-5 mb-4 flex items-center gap-3">
          <div className="icon-container icon-container-accent w-9 h-9">
            <LinkIcon className="h-5 w-5" />
          </div>
          <p className="text-sm text-gray-700 flex-1 min-w-0">
            <span className="font-medium">{linkTarget.merchant}</span> {won(linkTarget.amount)} ({formatDate(linkTarget.date)}) 거래에
            영수증을 첨부합니다.
          </p>
          <button onClick={() => setLinkId('')} className="text-sm text-gray-400 hover:text-gray-900">
            해제
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 업로드 영역 */}
        <motion.div {...fade} className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">영수증 업로드</h2>

          {!image && !draft ? (
            <div className="space-y-3">
              <button onClick={() => setShowCamera(true)} className="w-full card-muted p-8 text-center hover:bg-gray-200/70 transition-colors">
                <CameraIcon className="h-10 w-10 text-gray-900 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-1">카메라로 촬영</h3>
                <p className="text-sm text-gray-500">영수증을 촬영하여 즉시 처리</p>
              </button>

              <div className="border border-dashed border-gray-300 rounded-4xl p-8 text-center">
                <CloudArrowUpIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-4">또는 이미지 파일을 업로드하세요</p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <div className="flex flex-wrap justify-center gap-2">
                  <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
                    <PhotoIcon className="h-5 w-5 mr-1.5" /> 이미지 선택
                  </button>
                  <button onClick={() => setDraft(emptyDraft())} className="btn-secondary">
                    <PencilSquareIcon className="h-5 w-5 mr-1.5" /> 직접 입력
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {image ? (
                <img src={image} alt="업로드된 영수증" className="w-full max-h-[480px] object-contain rounded-2xl border border-gray-200 bg-gray-50" />
              ) : (
                <div className="card-muted p-6 text-center text-sm text-gray-500">
                  <PencilSquareIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  이미지 없이 직접 입력 중입니다.
                </div>
              )}

              {ocr && (
                <div className="card-muted p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent" />
                    <span className="text-sm font-medium text-gray-900">{ocr.status}…</span>
                    <span className="ml-auto text-xs text-gray-400 tabular-nums">{Math.round(ocr.progress * 100)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.max(4, ocr.progress * 100)}%` }} />
                  </div>
                </div>
              )}

              {ocrError && <p className="text-sm text-error-600">{ocrError}</p>}

              {draft?.rawText && (
                <div>
                  <button onClick={() => setShowRaw((v) => !v)} className="text-sm text-flow-600 font-medium">
                    {showRaw ? '인식된 원문 숨기기' : '인식된 원문 보기'}
                  </button>
                  {showRaw && (
                    <pre className="mt-2 bg-gray-100 rounded-xl p-3 text-xs font-mono text-gray-600 max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {draft.rawText}
                    </pre>
                  )}
                </div>
              )}

              <button onClick={handleReset} className="btn-secondary w-full">
                다른 영수증 처리
              </button>
            </div>
          )}
        </motion.div>

        {/* 결과 영역 */}
        <motion.div {...fade} className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{saved ? '등록 완료' : '추출 결과 확인'}</h2>

          <AnimatePresence mode="wait">
            {saved ? (
              <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="card-muted p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircleIcon className="h-5 w-5 text-success-600" />
                    <span className="text-sm font-medium text-gray-900">영수증이 거래에 연결되었습니다</span>
                  </div>
                  <div className="space-y-2.5 text-sm">
                    <Row label="거래" value={saved.transaction.id} />
                    <Row label="가맹점" value={saved.transaction.merchant} />
                    <Row label="금액" value={won(saved.transaction.amount)} bold />
                    <Row label="Flow ID" value={saved.transaction.flowId} mono />
                  </div>
                </div>
                <button onClick={handleCreateInvoice} className="btn-primary w-full">
                  {savedInvoiceId ? `전표 보기 (${savedInvoiceId})` : '전표 생성'}
                </button>
                <button onClick={() => navigate(`/transactions?id=${saved.transaction.id}`)} className="btn-secondary w-full">
                  거래 상세 보기
                </button>
              </motion.div>
            ) : !draft ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <DocumentMagnifyingGlassIcon className="h-14 w-14 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-400">
                  {ocr ? '영수증을 분석하고 있습니다…' : '영수증을 업로드하거나 촬영하면 AI가 자동으로 분석합니다.'}
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                {draft.confidence !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <SparklesIcon className="h-4 w-4 text-flow-600" />
                    <span className="text-gray-700">OCR 인식 신뢰도 {draft.confidence}%</span>
                    {draft.confidence < 60 && <span className="badge badge-warning">확인 필요</span>}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Field label="가맹점">
                      <input className="input-field" value={draft.merchant} onChange={(e) => updateDraft({ merchant: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="결제일">
                    <input type="date" className="input-field" value={draft.date} onChange={(e) => updateDraft({ date: e.target.value })} />
                  </Field>
                  <Field label="합계 금액 (원)">
                    <input
                      inputMode="numeric"
                      className="input-field"
                      value={draft.amount ? draft.amount.toLocaleString('ko-KR') : ''}
                      onChange={(e) => updateDraft({ amount: parseInt(e.target.value.replace(/[^\d]/g, '') || '0', 10) })}
                    />
                  </Field>
                  <div className="col-span-2">
                    <Field label="사업자등록번호 (선택)">
                      <input
                        className="input-field"
                        placeholder="000-00-00000"
                        value={draft.businessNumber}
                        onChange={(e) => updateDraft({ businessNumber: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>

                {/* 품목 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">품목 {draft.items.length > 0 && `(${draft.items.length})`}</span>
                    <button
                      onClick={() => updateDraft({ items: [...draft.items, { name: '', quantity: 1, price: 0 }] })}
                      className="flex items-center gap-1 text-xs text-flow-600 font-medium"
                    >
                      <PlusIcon className="h-4 w-4" /> 추가
                    </button>
                  </div>
                  <div className="space-y-2">
                    {draft.items.map((item, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          aria-label="품목명"
                          className="input-field py-2 flex-1 min-w-0"
                          value={item.name}
                          placeholder="품목명"
                          onChange={(e) => updateItem(i, { name: e.target.value })}
                        />
                        <input
                          aria-label="수량"
                          inputMode="numeric"
                          className="input-field py-2 w-14 text-center"
                          value={item.quantity}
                          onChange={(e) => updateItem(i, { quantity: parseInt(e.target.value.replace(/[^\d]/g, '') || '0', 10) })}
                        />
                        <input
                          aria-label="단가"
                          inputMode="numeric"
                          className="input-field py-2 w-24 text-right"
                          value={item.price ? item.price.toLocaleString('ko-KR') : ''}
                          placeholder="단가"
                          onChange={(e) => updateItem(i, { price: parseInt(e.target.value.replace(/[^\d]/g, '') || '0', 10) })}
                        />
                        <button
                          aria-label="품목 삭제"
                          onClick={() => updateDraft({ items: draft.items.filter((_, j) => j !== i) })}
                          className="p-2 text-gray-400 hover:text-error-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {draft.items.length === 0 && <p className="text-xs text-gray-400">인식된 품목이 없습니다. 필요하면 추가하세요.</p>}
                  </div>
                </div>

                {/* 거래 매칭 */}
                <div className="card-muted p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">거래 연결</h3>
                  <div className="space-y-2">
                    {candidates.map((t) => (
                      <label key={t.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 cursor-pointer">
                        <input type="radio" name="link" checked={linkId === t.id} onChange={() => { setLinkId(t.id); setLinkTouched(true); }} className="text-flow-600 focus:ring-flow-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{t.merchant}</p>
                          <p className="text-xs text-gray-400">
                            {formatDate(t.date)} · <span className="font-mono">{t.flowId}</span>
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{won(t.amount)}</span>
                      </label>
                    ))}
                    <label className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="link"
                        checked={!candidates.some((t) => t.id === linkId)}
                        onChange={() => { setLinkId(''); setLinkTouched(true); }}
                        className="text-flow-600 focus:ring-flow-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">새 거래로 등록</p>
                        <p className="text-xs text-gray-400">무기명 카드 오프라인 결제로 기록합니다</p>
                      </div>
                    </label>
                  </div>
                  {candidates.length === 0 && (
                    <p className="text-xs text-gray-400 mt-2">금액·날짜(±3일)가 일치하는 영수증 미첨부 거래가 없습니다.</p>
                  )}
                </div>

                {/* 분류 (새 거래로 등록할 때) */}
                {!candidates.some((t) => t.id === linkId) && classification && (
                  <div className="card-muted p-4 space-y-2">
                    <h3 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                      {!classOverride && <SparklesIcon className="h-4 w-4 text-flow-600" />}
                      {classOverride ? '분류' : '자동 분류'}
                    </h3>
                    <select
                      aria-label="부서"
                      className="input-field bg-white py-2.5"
                      value={classification.departmentId}
                      onChange={(e) => setClassOverride({ ...classification, departmentId: e.target.value })}
                    >
                      {state.departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <select
                      aria-label="카테고리"
                      className="input-field bg-white py-2.5"
                      value={classification.categoryId}
                      onChange={(e) => setClassOverride({ ...classification, categoryId: e.target.value as CategoryId })}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.account})</option>
                      ))}
                    </select>
                    <select
                      aria-label="프로젝트"
                      className="input-field bg-white py-2.5"
                      value={classification.projectId ?? ''}
                      onChange={(e) => setClassOverride({ ...classification, projectId: e.target.value || undefined })}
                    >
                      <option value="">프로젝트 없음</option>
                      {state.projects.filter((p) => p.active).map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {!classOverride && auto && <p className="text-xs text-gray-400">근거: {auto.reason}</p>}
                  </div>
                )}

                <button onClick={handleSave} disabled={!!ocr} className="btn-primary w-full disabled:opacity-40">
                  영수증 저장
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* 영수증 필요 거래 · 최근 영수증 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">영수증이 필요한 내 거래</h2>
          <p className="text-sm text-gray-400 mb-5">선택하면 해당 거래에 영수증을 연결합니다.</p>
          {pendingReceipts.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">모든 거래에 증빙이 첨부되었습니다.</p>
          ) : (
            <div className="space-y-1">
              {pendingReceipts.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setLinkId(t.id);
                    setSaved(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full flex items-center justify-between text-left py-2.5 px-3 rounded-xl transition-colors ${
                    linkId === t.id ? 'bg-flow-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.merchant}</p>
                    <p className="text-xs text-gray-400">{formatDate(t.date)}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{won(t.amount)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">최근 등록 영수증</h2>
          <div className="space-y-1">
            {state.receipts.slice(0, 6).map((r) => (
              <button
                key={r.id}
                onClick={() => r.transactionId && navigate(`/transactions?id=${r.transactionId}`)}
                className="w-full flex items-center gap-3 text-left py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {r.thumbnail ? (
                  <img src={r.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                ) : (
                  <div className="icon-container icon-container-muted w-10 h-10">
                    <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.merchant}</p>
                  <p className="text-xs text-gray-400">
                    {r.date}
                    {r.confidence !== undefined ? ` · 신뢰도 ${r.confidence.toFixed(0)}%` : ' · 직접 입력'}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900">{won(r.amount)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 카메라 모달 */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-4xl p-6 max-w-md w-full"
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">카메라 촬영</h3>
                <p className="text-sm text-gray-500">영수증을 가이드 안에 맞춰 촬영해주세요</p>
              </div>
              <div className="relative mb-4">
                <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-2xl bg-gray-900 aspect-[3/4] object-cover" />
                <div className="absolute inset-4 border-2 border-white/60 border-dashed rounded-xl pointer-events-none" />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={stopCamera} className="btn-secondary flex-1">
                  <XMarkIcon className="h-5 w-5 mr-1.5" /> 취소
                </button>
                <button onClick={capturePhoto} className="btn-primary flex-1 disabled:opacity-40" disabled={!cameraReady}>
                  <CameraIcon className="h-5 w-5 mr-1.5" /> 촬영
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
};

export default ReceiptUpload;
