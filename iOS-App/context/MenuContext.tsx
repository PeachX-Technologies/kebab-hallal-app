import React, { createContext, useContext, useMemo } from 'react';
import rawData from '../data/data.json';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NormalizedOption {
  name: string;
  price: number;
}

export interface Question {
  id: string;
  text: string;
  type: 'single_choice' | 'multiple_choice';
  required?: boolean;
  max_selections?: number;
  options: NormalizedOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  image: string;
  price: number;
  deliveryprice: number;
  description: string;
  questions: string[];
}

export interface Category {
  name: string;
  idname: string;
  items: MenuItem[];
}

interface MenuState {
  categories: Category[];
  questions: Record<string, Question>;
  getItem: (id: string) => MenuItem | undefined;
  getQuestion: (id: string) => Question | undefined;
}

// ─── Normalization ────────────────────────────────────────────────────────────

type RawOption = string | { name: string; price: number };

function normalizeOption(opt: RawOption): NormalizedOption {
  if (typeof opt === 'string') return { name: opt, price: 0 };
  return { name: opt.name, price: opt.price ?? 0 };
}

function normalizeQuestions(
  raw: Record<string, unknown>,
): Record<string, Question> {
  const result: Record<string, Question> = {};
  for (const [id, q] of Object.entries(raw)) {
    const question = q as {
      id: string;
      text: string;
      type: string;
      required?: boolean;
      max_selections?: number;
      options: RawOption[];
    };
    result[id] = {
      id: question.id,
      text: question.text,
      type: question.type as 'single_choice' | 'multiple_choice',
      required: question.required,
      max_selections: question.max_selections,
      options: question.options.map(normalizeOption),
    };
  }
  return result;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const MenuContext = createContext<MenuState | undefined>(undefined);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<MenuState>(() => {
    const categories = (rawData.categories as unknown as Category[]) ?? [];
    const questions = normalizeQuestions(
      (rawData.questions as unknown as Record<string, unknown>) ?? {},
    );

    // Build a flat item lookup map
    const itemMap: Record<string, MenuItem> = {};
    for (const cat of categories) {
      for (const item of cat.items) {
        itemMap[item.id] = item;
      }
    }

    return {
      categories,
      questions,
      getItem: (id) => itemMap[id],
      getQuestion: (id) => questions[id],
    };
  }, []);

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu(): MenuState {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu must be used within MenuProvider');
  return ctx;
}

export default MenuContext;
