import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  QueueListIcon,
  PaperClipIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useFlowPay } from '../store/FlowPayContext';
import { departmentName, inPeriod, myFlowIds, needsReceipt, projectName, sum } from '../store/selectors';
import { CATEGORIES, METHOD_LABELS, categoryById } from '../data/constants';
import { PERIODS, PeriodId, formatDateTime, periodRange, won } from '../utils/format';
import { downloadFile, toCsv } from '../utils/csv';
import { EmptyState, Field, Modal, Page, PageHeader, Row, StatusTag, TaxTag, useToast } from './ui';
import { CategoryId, Transaction } from '../types';

const PAGE_SIZE = 30;

const Transactions: React.FC = () => {
  const { state } = useFlowPay();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState<PeriodId | 'all'>((params.get('period') as PeriodId) || 'all');
  const [dept, setDept] = useState(params.get('dept') || 'all');
  const [category, setCategory] = useState('all');
  const [receipt, setReceipt] = useState<'all' | 'needed' | 'attached'>('all');
  const [scope, setScope] = useState<'all' | 'mine'>(params.get('scope') === 'mine' ? 'mine' : 'all');
  const [sort, setSort] = useState<'date' | 'amount'>('date');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const selectedId = params.get('id');

  const mine = useMemo(() => new Set(myFlowIds(state)), [state]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = state.transactions.filter(
      (t) =>
        (dept === 'all' || t.departmentId === dept) &&
        (category === 'all' || t.categoryId === category) &&
        (scope === 'all' || mine.has(t.flowId)) &&
        (receipt === 'all' || (receipt === 'needed' ? needsReceipt(t) : !!t.receiptId)) &&
        (!q || [t.merchant, t.flowId, t.id, t.memo ?? '', ...t.items.map((i) => i.name)].some((v) => v.toLowerCase().includes(q)))
    );
    if (period !== 'all') list = inPeriod(list, periodRange(period).current);
    if (sort === 'amount') list = [...list].sort((a, b) => b.amount - a.amount);
    return list;
  }, [state.transactions, query, period, dept, category, receipt, scope, sort, mine]);

  useEffect(() => setLimit(PAGE_SIZE), [query, period, dept, category, receipt, scope, sort]);

  const selected = state.transactions.find((t) => t.id === selectedId);
  const openDetail = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('id', id);
    setParams(next);
  };
  const closeDetail = () => {
    const next = new URLSearchParams(params);
    next.delete('id');
    setParams(next, { replace: true });
  };

  const exportCsv = () => {
    const csv = toCsv(
      ['거래번호', '일시', 'Flow ID', '가맹점', '금액', '결제수단', '부서', '카테고리', '계정과목', '프로젝트', '영수증', '전표', '상태', '메모'],
      filtered.map((t) => [
        t.id,
        formatDateTime(t.date),
        t.flowId,
        t.merchant,
        t.amount,
        METHOD_LABELS[t.method],
        departmentName(state, t.departmentId),
        categoryById(t.categoryId).name,
        categoryById(t.categoryId).account,
        t.projectId ? projectName(state, t.projectId) : '',
        t.receiptId ? '첨부' : t.method === 'flowpay' ? 'PG 전자영수증' : '미첨부',
        t.invoiceId ?? '',
        t.status === 'cancelled' ? '취소' : '완료',
        t.memo ?? '',
      ])
    );
    downloadFile(`FlowPay_거래내역_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const completedTotal = sum(filtered.filter((t) => t.status === 'completed'));

  return (
    <Page>
      <PageHeader
        title="거래 내역"
        description="Flow ID로 기록된 모든 결제를 검색하고, 분류를 수정하거나 증빙을 연결합니다."
        actions={
          <button onClick={exportCsv} disabled={!filtered.length} className="btn-secondary text-sm py-2.5 px-4 disabled:opacity-40">
            <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" /> CSV 내보내기
          </button>
        }
      />

      {/* 필터 */}
      <div className="card p-4 sm:p-5 mb-4 sm:mb-6 space-y-3">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            className="input-field pl-11"
            placeholder="가맹점, 품목, Flow ID, 거래번호, 메모 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <select aria-label="기간" className="input-field py-2.5" value={period} onChange={(e) => setPeriod(e.target.value as PeriodId | 'all')}>
            <option value="all">전체 기간</option>
            {PERIODS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select aria-label="부서" className="input-field py-2.5" value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="all">전체 부서</option>
            {state.departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select aria-label="카테고리" className="input-field py-2.5" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">전체 카테고리</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select aria-label="영수증" className="input-field py-2.5" value={receipt} onChange={(e) => setReceipt(e.target.value as typeof receipt)}>
            <option value="all">영수증 전체</option>
            <option value="needed">영수증 필요</option>
            <option value="attached">영수증 첨부</option>
          </select>
          <select aria-label="범위" className="input-field py-2.5" value={scope} onChange={(e) => setScope(e.target.value as typeof scope)}>
            <option value="all">전사</option>
            <option value="mine">내 Flow ID</option>
          </select>
          <select aria-label="정렬" className="input-field py-2.5" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="date">최신순</option>
            <option value="amount">금액순</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{filtered.length.toLocaleString()}건</h2>
          <span className="text-sm text-gray-500">
            합계 <span className="font-semibold text-gray-900">{won(completedTotal)}</span>
            <span className="text-xs text-gray-400"> (취소 제외)</span>
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={QueueListIcon} message="조건에 맞는 거래가 없습니다." />
        ) : (
          <>
            <ul className="divide-y divide-gray-100">
              {filtered.slice(0, limit).map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => openDetail(t.id)}
                    className="w-full flex items-center gap-3 py-3 text-left hover:bg-gray-50 -mx-2 px-2 rounded-xl transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium truncate ${t.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {t.merchant}
                        </p>
                        {mine.has(t.flowId) && <span className="badge badge-accent flex-shrink-0">나</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-gray-400">
                        <span>{formatDateTime(t.date)}</span>
                        <span>{departmentName(state, t.departmentId)}</span>
                        <span className="badge badge-primary">{categoryById(t.categoryId).name}</span>
                        {t.status === 'cancelled' && <span className="badge badge-error">취소</span>}
                        {needsReceipt(t) && <span className="badge badge-warning">영수증 필요</span>}
                        {t.invoiceId && <span className="badge badge-primary">전표</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900">{won(t.amount)}</p>
                      <p className="text-xs text-gray-400 font-mono">{t.flowId}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            {filtered.length > limit && (
              <button onClick={() => setLimit((l) => l + PAGE_SIZE)} className="btn-secondary w-full mt-4 text-sm">
                더 보기 ({filtered.length - limit}건 남음)
              </button>
            )}
          </>
        )}
      </div>

      <TransactionDetail transaction={selected} onClose={closeDetail} />
    </Page>
  );
};

const TransactionDetail: React.FC<{ transaction?: Transaction; onClose: () => void }> = ({ transaction: t, onClose }) => {
  const { state, updateTransaction, cancelTransaction, createInvoices } = useFlowPay();
  const navigate = useNavigate();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    setEditing(false);
    setConfirmCancel(false);
  }, [t?.id]);

  if (!t) return <Modal open={false} onClose={onClose} title="">{null}</Modal>;

  const invoice = state.invoices.find((i) => i.id === t.invoiceId);
  const receipt = state.receipts.find((r) => r.id === t.receiptId);
  const category = categoryById(t.categoryId);
  const locked = invoice ? invoice.approvalStatus !== 'pending' : false;
  const cancellable = t.status === 'completed' && (!invoice || invoice.taxStatus === 'not_submitted');

  return (
    <Modal
      open
      onClose={onClose}
      title="거래 상세"
      footer={
        t.status === 'completed' ? (
          confirmCancel ? (
            <>
              <button onClick={() => setConfirmCancel(false)} className="btn-secondary flex-1 text-sm">
                돌아가기
              </button>
              <button
                onClick={() => {
                  cancelTransaction(t.id);
                  toast('결제를 취소했습니다', 'info');
                  setConfirmCancel(false);
                }}
                className="btn-error flex-1 text-sm"
              >
                결제 취소 확정
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setConfirmCancel(true)}
                disabled={!cancellable}
                title={cancellable ? undefined : '국세청에 전송된 전표가 있어 취소할 수 없습니다'}
                className="btn-secondary flex-1 text-sm disabled:opacity-40"
              >
                결제 취소
              </button>
              {invoice ? (
                <button onClick={() => navigate(`/invoice?id=${invoice.id}`)} className="btn-primary flex-1 text-sm">
                  전표 보기
                </button>
              ) : (
                <button
                  onClick={() => {
                    const [inv] = createInvoices([t.id]);
                    if (inv) toast(`${inv.id} 전표를 생성했습니다`);
                  }}
                  className="btn-primary flex-1 text-sm"
                >
                  전표 생성
                </button>
              )}
            </>
          )
        ) : undefined
      }
    >
      <div className="space-y-4">
        <div className="text-center py-2">
          <p className="text-sm text-gray-500">{t.merchant}</p>
          <p className={`text-3xl font-semibold tracking-tight ${t.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
            {won(t.amount)}
          </p>
          {t.status === 'cancelled' && <span className="badge badge-error mt-2">취소된 결제</span>}
          {confirmCancel && <p className="text-sm text-error-600 mt-2">결제를 취소하면 연결된 전표도 반려 처리됩니다.</p>}
        </div>

        <div className="card-muted p-4 space-y-2 text-sm">
          <Row label="거래번호" value={t.id} />
          <Row label="일시" value={formatDateTime(t.date)} />
          <Row label="Flow ID" value={t.flowId} mono />
          <Row label="결제 수단" value={METHOD_LABELS[t.method]} />
          {t.memo && <Row label="메모" value={t.memo} />}
        </div>

        {/* 분류 */}
        <div className="card-muted p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
              {t.autoClassified && <SparklesIcon className="h-4 w-4 text-flow-600" />}
              {t.autoClassified ? '자동 분류' : '분류 (수정됨)'}
            </h3>
            {t.status === 'completed' && !locked && (
              <button onClick={() => setEditing((v) => !v)} className="text-xs text-flow-600 font-medium">
                {editing ? '완료' : '수정'}
              </button>
            )}
          </div>
          {editing ? (
            <div className="space-y-2">
              <Field label="부서">
                <select className="input-field bg-white py-2.5" value={t.departmentId} onChange={(e) => updateTransaction(t.id, { departmentId: e.target.value })}>
                  {state.departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="카테고리">
                <select
                  className="input-field bg-white py-2.5"
                  value={t.categoryId}
                  onChange={(e) => updateTransaction(t.id, { categoryId: e.target.value as CategoryId })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.account})</option>
                  ))}
                </select>
              </Field>
              <Field label="프로젝트">
                <select
                  className="input-field bg-white py-2.5"
                  value={t.projectId ?? ''}
                  onChange={(e) => updateTransaction(t.id, { projectId: e.target.value || undefined })}
                >
                  <option value="">프로젝트 없음</option>
                  {state.projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </Field>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <Row label="부서" value={departmentName(state, t.departmentId)} />
              <Row label="카테고리" value={category.name} />
              <Row label="계정과목" value={`${category.account} (${category.accountCode})`} />
              <Row label="프로젝트" value={projectName(state, t.projectId)} />
              {locked && <p className="text-xs text-gray-400 pt-1">결재가 끝난 전표가 있어 분류를 수정할 수 없습니다.</p>}
            </div>
          )}
        </div>

        {/* 품목 */}
        {t.items.length > 0 && (
          <div className="card-muted p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">품목</h3>
            <div className="space-y-1.5">
              {t.items.map((it, i) => (
                <div key={i} className="flex justify-between text-sm gap-3">
                  <span className="text-gray-700 truncate">
                    {it.name} × {it.quantity}
                  </span>
                  <span className="text-gray-900">{won(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 증빙 */}
        <div className="card-muted p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <PaperClipIcon className="h-4 w-4 text-gray-500" />
              <span className="text-gray-500">영수증</span>
            </div>
            {receipt ? (
              <span className="text-sm text-gray-900">
                {receipt.id}
                {receipt.confidence !== undefined && <span className="text-xs text-gray-400"> · OCR {receipt.confidence.toFixed(0)}%</span>}
              </span>
            ) : t.method === 'flowpay' ? (
              <span className="text-sm text-gray-900">PG 전자영수증</span>
            ) : t.status === 'completed' ? (
              <Link to={`/receipt?tx=${t.id}`} className="text-sm text-flow-600 font-medium">
                영수증 첨부
              </Link>
            ) : (
              <span className="text-sm text-gray-400">없음</span>
            )}
          </div>
          {receipt?.thumbnail && <img src={receipt.thumbnail} alt="영수증" className="max-h-40 rounded-xl border border-gray-200" />}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <DocumentTextIcon className="h-4 w-4 text-gray-500" />
              <span className="text-gray-500">전표</span>
            </div>
            {invoice ? (
              <span className="flex items-center gap-2">
                <Link to={`/invoice?id=${invoice.id}`} className="text-sm text-flow-600 font-medium">
                  {invoice.id}
                </Link>
                <StatusTag status={invoice.approvalStatus} />
                <TaxTag status={invoice.taxStatus} />
              </span>
            ) : (
              <span className="text-sm text-gray-400">미생성</span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default Transactions;
