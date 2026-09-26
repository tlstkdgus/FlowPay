import React, { useEffect, useState } from 'react';
import {
  ArrowPathIcon,
  ClipboardDocumentIcon,
  FingerPrintIcon,
  ShieldCheckIcon,
  TrashIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { useFlowPay } from '../store/FlowPayContext';
import { monthSpentByDepartment } from '../store/selectors';
import { formatDate, won } from '../utils/format';
import { downloadFile } from '../utils/csv';
import {
  AuthServerError,
  PasskeyCancelledError,
  PasskeyUnsupportedError,
  ServerStatus,
  getServerStatus,
  hasServerPasskey,
  isPasskeySupported,
  registerPasskey,
} from '../utils/passkey';
import { Field, Modal, Page, PageHeader, Toggle, useToast } from './ui';

const Section: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <section className="card mb-4 sm:mb-6">
    <h2 className="card-title">{title}</h2>
    {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
    <div className="mt-6">{children}</div>
  </section>
);

const SettingRow: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <div className="flex items-center justify-between gap-4 py-3.5 border-b border-gray-100 last:border-0 first:pt-0 last:pb-0">
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-900">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
    {children}
  </div>
);

const parseWon = (v: string) => parseInt(v.replace(/[^\d]/g, '') || '0', 10);

const Settings: React.FC = () => {
  const { state, updateProfile, reissueFlowId, updateSettings, updateDepartment, resetDemo } = useFlowPay();
  const { profile, settings } = state;
  const toast = useToast();
  const [supported] = useState(isPasskeySupported);
  const [server, setServer] = useState<ServerStatus | null | undefined>(undefined);
  const [registering, setRegistering] = useState(false);
  const [confirm, setConfirm] = useState<'reissue' | 'reset' | null>(null);

  useEffect(() => {
    getServerStatus().then(setServer);
  }, []);

  const passkey = hasServerPasskey(profile.passkey) ? profile.passkey : undefined;

  const copyFlowId = async () => {
    try {
      await navigator.clipboard.writeText(profile.flowId);
      toast('Flow ID를 복사했습니다');
    } catch {
      toast('복사할 수 없는 환경입니다', 'error');
    }
  };

  const register = async () => {
    setRegistering(true);
    try {
      const passkey = await registerPasskey(profile.flowId);
      updateProfile({ passkey });
      toast('패스키를 등록했습니다. 서버가 검증한 패스키로 1-Click 결제를 사용할 수 있어요');
    } catch (e) {
      if (e instanceof PasskeyCancelledError) toast(e.message, 'info');
      else if (e instanceof PasskeyUnsupportedError) toast(e.message, 'error');
      else if (e instanceof AuthServerError) toast(`인증 서버 오류: ${e.message}`, 'error');
      else toast('패스키 등록에 실패했습니다', 'error');
    } finally {
      setRegistering(false);
    }
  };

  const exportBackup = () =>
    downloadFile(`FlowPay_백업_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(state, null, 2), 'application/json');

  return (
    <Page wide={false}>
      <PageHeader eyebrow="Settings" title="설정" description="Flow ID와 인증 수단, 결제 정책, 부서 예산을 관리합니다." />

      {/* Flow ID */}
      <Section title="Flow ID" description="개인정보 대신 결제·전표에 기록되는 익명 토큰입니다. 유출이 의심되면 재발급하세요.">
        <div className="card-muted p-5 flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">현재 Flow ID</p>
            <p className="text-3xl font-bold tracking-[0.2em] text-gray-900">{profile.flowId}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyFlowId} className="btn-secondary p-3" aria-label="Flow ID 복사">
              <ClipboardDocumentIcon className="h-5 w-5" />
            </button>
            <button onClick={() => setConfirm('reissue')} className="btn-secondary text-sm py-2.5 px-4">
              <ArrowPathIcon className="h-4 w-4 mr-1.5" /> 재발급
            </button>
          </div>
        </div>
        {profile.previousFlowIds.length > 0 && (
          <p className="text-xs text-gray-500 mb-4">
            이전 Flow ID: <span className="tracking-wide font-medium">{profile.previousFlowIds.join(', ')}</span> — 과거 거래는 이전 토큰으로 유지되며 내 거래로 함께 조회됩니다.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="표시 이름" hint="이 기기에만 저장되며 거래·전표에는 기록되지 않습니다.">
            <input className="input-field" value={profile.displayName} onChange={(e) => updateProfile({ displayName: e.target.value })} />
          </Field>
          <Field label="소속 부서" hint="자동 분류 시 기본 부서로 사용됩니다.">
            <select className="input-field" value={profile.departmentId} onChange={(e) => updateProfile({ departmentId: e.target.value })}>
              {state.departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="월 사용 한도 (원)" hint="한도를 넘는 결제는 차단됩니다.">
            <input
              inputMode="numeric"
              className="input-field"
              value={profile.monthlyLimit.toLocaleString('ko-KR')}
              onChange={(e) => updateProfile({ monthlyLimit: parseWon(e.target.value) })}
            />
          </Field>
        </div>
      </Section>

      {/* 패스키 */}
      <Section
        title="패스키 (FIDO2)"
        description="지문·Face ID로 결제를 승인합니다. 생체 정보는 기기 밖으로 나가지 않고, 인증기의 서명은 FlowPay 인증 서버가 검증합니다."
      >
        {/* 인증 서버 상태 */}
        <div className="flex items-center gap-2 text-sm mb-5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              server === undefined ? 'bg-gray-300' : server && server.originAllowed ? 'bg-flow-500' : 'bg-error-500'
            }`}
          />
          <span className="text-gray-600">
            {server === undefined
              ? '인증 서버 확인 중…'
              : !server
              ? '인증 서버에 연결할 수 없습니다 (npm run api 실행 필요)'
              : !server.originAllowed
              ? '인증 서버가 이 도메인을 허용하지 않습니다 (FLOWPAY_ALLOWED_ORIGINS 확인)'
              : '인증 서버 연결됨'}
          </span>
          {server && (
            <span className={`badge ${server.keyMode === 'configured' ? 'badge-success' : 'badge-warning'}`}>
              {server.keyMode === 'configured' ? '운영 서명 키' : '데모 서명 키'}
            </span>
          )}
        </div>

        {passkey ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="icon-container icon-container-success">
                <ShieldCheckIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">서버 검증 패스키 등록됨</p>
                <p className="text-xs text-gray-500 truncate">
                  {formatDate(passkey.createdAt)} 등록 · Flow ID {profile.flowId}
                  {passkey.deviceType && ` · ${passkey.deviceType === 'multiDevice' ? '동기화 패스키' : '기기 전용'}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                updateProfile({ passkey: undefined });
                toast('패스키를 삭제했습니다', 'info');
              }}
              className="btn-secondary text-sm py-2 px-4"
            >
              삭제
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="icon-container icon-container-accent">
                <FingerPrintIcon className="h-5 w-5" />
              </div>
              <p className="text-sm text-gray-600">
                {supported
                  ? '기기의 지문·Face ID·화면 잠금이나 휴대폰(QR), 보안 키로 패스키를 만들 수 있습니다.'
                  : '이 브라우저는 패스키를 지원하지 않습니다 (HTTPS 필요). 결제 화면의 데모 인증으로 시연할 수 있습니다.'}
              </p>
            </div>
            <button onClick={register} disabled={!supported || !server || registering} className="btn-primary text-sm disabled:opacity-40">
              <FingerPrintIcon className="h-4 w-4 mr-1.5" /> {registering ? '등록 중…' : '패스키 등록'}
            </button>
          </div>
        )}
      </Section>

      {/* 결제 정책 */}
      <Section title="결제 · 자동화">
        <SettingRow title="1-Click 결제" description="패스키가 등록되어 있으면 결제 버튼과 동시에 생체 인증을 요청합니다.">
          <Toggle label="1-Click 결제" checked={settings.oneClick} onChange={(v) => updateSettings({ oneClick: v })} />
        </SettingRow>
        <SettingRow title="자동 분류" description="가맹점·품목·시간대로 부서, 계정과목, 프로젝트를 자동 지정합니다.">
          <Toggle label="자동 분류" checked={settings.autoClassify} onChange={(v) => updateSettings({ autoClassify: v })} />
        </SettingRow>
        <SettingRow title="자동 전표 생성" description="FlowPay 결제 즉시 전표를 만들고 부서 승인자에게 배정합니다.">
          <Toggle label="자동 전표 생성" checked={settings.autoInvoice} onChange={(v) => updateSettings({ autoInvoice: v })} />
        </SettingRow>
        <SettingRow title="예산 초과 결제 차단" description="부서 월 예산을 넘는 결제를 막습니다. 끄면 경고만 표시합니다.">
          <Toggle label="예산 초과 결제 차단" checked={settings.blockOverBudget} onChange={(v) => updateSettings({ blockOverBudget: v })} />
        </SettingRow>
        <SettingRow title={`예산 경고 기준 ${settings.alertThreshold}%`} description="이 비율을 넘으면 대시보드와 결제 화면에 경고합니다.">
          <input
            type="range"
            min={50}
            max={100}
            step={5}
            value={settings.alertThreshold}
            onChange={(e) => updateSettings({ alertThreshold: Number(e.target.value) })}
            className="w-32 accent-gray-900"
            aria-label="예산 경고 기준"
          />
        </SettingRow>
      </Section>

      {/* 부서 */}
      <Section title="부서 예산 · 승인자" description="승인자를 바꾸면 결재 대기 중인 전표의 승인자도 함께 변경됩니다.">
        <div className="space-y-3">
          {state.departments.map((d) => {
            const spent = monthSpentByDepartment(state, d.id);
            return (
              <div key={d.id} className="card-muted p-4">
                <div className="flex items-baseline justify-between mb-3 gap-3">
                  <p className="font-medium text-gray-900">{d.name}</p>
                  <p className="text-xs text-gray-500">
                    이번 달 {won(spent)} 사용 ({d.budget ? ((spent / d.budget) * 100).toFixed(0) : 0}%)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="월 예산 (원)">
                    <input
                      inputMode="numeric"
                      className="input-field bg-white py-2.5"
                      value={d.budget.toLocaleString('ko-KR')}
                      onChange={(e) => updateDepartment(d.id, { budget: parseWon(e.target.value) })}
                    />
                  </Field>
                  <Field label="승인자">
                    <input
                      className="input-field bg-white py-2.5"
                      value={d.approver}
                      onChange={(e) => updateDepartment(d.id, { approver: e.target.value })}
                    />
                  </Field>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 데이터 */}
      <Section title="데이터" description="모든 데이터는 이 브라우저에만 저장됩니다.">
        <div className="flex flex-wrap gap-2">
          <button onClick={exportBackup} className="btn-secondary text-sm">
            <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" /> JSON 백업
          </button>
          <button onClick={() => setConfirm('reset')} className="btn-secondary text-sm text-error-600">
            <TrashIcon className="h-4 w-4 mr-1.5" /> 데모 데이터로 초기화
          </button>
        </div>
      </Section>

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm === 'reissue' ? 'Flow ID 재발급' : '데이터 초기화'}
        footer={
          <>
            <button onClick={() => setConfirm(null)} className="btn-secondary flex-1 text-sm">
              취소
            </button>
            <button
              onClick={() => {
                if (confirm === 'reissue') {
                  const id = reissueFlowId();
                  toast(`새 Flow ID ${id}가 발급되었습니다`);
                } else {
                  resetDemo();
                  toast('데모 데이터로 초기화했습니다', 'info');
                }
                setConfirm(null);
              }}
              className={`${confirm === 'reset' ? 'btn-error' : 'btn-primary'} flex-1 text-sm`}
            >
              {confirm === 'reissue' ? '재발급' : '초기화'}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600 leading-relaxed">
          {confirm === 'reissue'
            ? '새 익명 토큰이 발급되고 이후 결제부터 적용됩니다. 기존 패스키는 이전 Flow ID에 묶여 있어 해제되므로 다시 등록해야 합니다.'
            : '결제·영수증·전표와 설정이 모두 초기 데모 상태로 돌아갑니다. 되돌릴 수 없습니다.'}
        </p>
      </Modal>
    </Page>
  );
};

export default Settings;
