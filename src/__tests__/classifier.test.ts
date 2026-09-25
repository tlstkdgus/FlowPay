import { classify, classifyCategory } from '../utils/classifier';
import { DEFAULT_PROJECTS } from '../data/constants';

describe('classifier', () => {
  it('가맹점 키워드로 카테고리를 분류한다', () => {
    expect(classifyCategory('스타벅스 강남점', 9000).categoryId).toBe('meal');
    expect(classifyCategory('카카오T 택시', 18000).categoryId).toBe('transport');
    expect(classifyCategory('알파문구 A4용지', 25000).categoryId).toBe('supplies');
    expect(classifyCategory('교보문고', 30000).categoryId).toBe('education');
  });

  it('키워드가 없으면 기타로 분류하고 신뢰도를 낮춘다', () => {
    const r = classifyCategory('정체불명 상점', 10000);
    expect(r.categoryId).toBe('etc');
    expect(r.confidence).toBeLessThan(50);
  });

  it('고액 식사는 접대비로 제안한다', () => {
    expect(classifyCategory('삼성동 식당', 200000).categoryId).toBe('entertainment');
  });

  it('프로젝트 키워드가 없으면 소속 부서 프로젝트로 배정한다', () => {
    const r = classify({ merchant: '스타벅스', amount: 5000, departmentId: 'dev' }, DEFAULT_PROJECTS);
    expect(r.departmentId).toBe('dev');
    expect(r.projectId).toBe('p-app');
  });

  it('메모의 프로젝트 키워드를 우선한다', () => {
    const r = classify({ merchant: '한우명가', amount: 90000, memo: '고객 미팅', departmentId: 'dev' }, DEFAULT_PROJECTS);
    expect(r.projectId).toBe('p-client');
  });
});
