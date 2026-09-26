import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// react-router 7은 jsdom에 없는 TextEncoder를 사용합니다.
Object.assign(global, { TextEncoder, TextDecoder });
