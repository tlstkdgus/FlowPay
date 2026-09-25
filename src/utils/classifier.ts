// 결제 자동 분류 엔진
// 가맹점명·상품명·메모의 키워드, 결제 시각, 금액을 조합해 카테고리와 프로젝트를 추정합니다.
// 부서는 Flow ID에 연결된 소속 부서를 기본으로 사용합니다.

import { CATEGORIES } from '../data/constants';
import { CategoryId, LineItem, Project } from '../types';

export interface ClassifyInput {
  merchant: string;
  items?: LineItem[];
  memo?: string;
  amount: number;
  date?: Date;
  departmentId: string;
}

export interface Classification {
  categoryId: CategoryId;
  departmentId: string;
  projectId?: string;
  /** 0-100 */
  confidence: number;
  reason: string;
}

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ');

export const classifyCategory = (
  text: string,
  amount: number,
  date?: Date
): { categoryId: CategoryId; confidence: number; reason: string } => {
  const t = normalize(text);
  let best: { id: CategoryId; hits: number; keyword: string } = { id: 'etc', hits: 0, keyword: '' };

  for (const c of CATEGORIES) {
    const matched = c.keywords.filter((k) => t.includes(k.toLowerCase()));
    if (matched.length > best.hits) best = { id: c.id, hits: matched.length, keyword: matched[0] };
  }

  if (best.hits === 0) {
    return { categoryId: 'etc', confidence: 40, reason: '일치하는 키워드 없음' };
  }

  // 고액 식사는 접대 가능성이 높으므로 접대비로 제안
  if (best.id === 'meal' && amount >= 150000) {
    return { categoryId: 'entertainment', confidence: 70, reason: `'${best.keyword}' · 15만원 이상 식사` };
  }

  // 심야(22시~05시) 택시는 야근 교통비로 확정도 상향
  const hour = date?.getHours();
  const lateNight = hour !== undefined && (hour >= 22 || hour < 5);
  const confidence = Math.min(98, 75 + best.hits * 8 + (best.id === 'transport' && lateNight ? 6 : 0));

  return { categoryId: best.id, confidence, reason: `'${best.keyword}' 키워드 일치` };
};

export const classifyProject = (text: string, departmentId: string, projects: Project[]): string | undefined => {
  const t = normalize(text);
  const active = projects.filter((p) => p.active);
  const keywordHit = active.find((p) => p.keywords.some((k) => t.includes(k.toLowerCase())));
  if (keywordHit) return keywordHit.id;
  // 키워드가 없으면 소속 부서의 진행 중 프로젝트로 배정
  return active.find((p) => p.departmentId === departmentId)?.id;
};

export const classify = (input: ClassifyInput, projects: Project[]): Classification => {
  const text = [input.merchant, ...(input.items ?? []).map((i) => i.name), input.memo ?? ''].join(' ');
  const category = classifyCategory(text, input.amount, input.date);
  return {
    categoryId: category.categoryId,
    departmentId: input.departmentId,
    projectId: classifyProject(text, input.departmentId, projects),
    confidence: category.confidence,
    reason: category.reason,
  };
};
