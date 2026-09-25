import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

beforeEach(() => localStorage.clear());

it('대시보드가 저장소 데이터로 렌더링된다', () => {
  render(<App />);
  expect(screen.getByText(/안녕하세요, 김대리님/)).toBeInTheDocument();
  expect(screen.getAllByText('XK8P2M').length).toBeGreaterThan(0);
  expect(screen.getByText('내 최근 결제')).toBeInTheDocument();
});
